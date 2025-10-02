import React, { useState, useEffect } from 'react';
import { Alert, View, TextInput, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import { useAppDispatch, useAppSelector } from 'store';
import {
  FixedBottomCTA,
  FixedBottomCTAProvider,
  Top,
  colors,
  Text, Icon,
  useToast,
} from '@toss-design-system/react-native';
import { resetInquiryState, postInquiry } from '../../redux/inquirySlice';
import { useNavigation } from "@granite-js/react-native";

import { fetchAlbumPhotos, ImageResponse } from '@apps-in-toss/framework';

import { useCallback, useEffect as useEffectHook, useRef, useState as useStateHook } from 'react';
import { PermissionStatus } from '@apps-in-toss/framework';
import { fn } from 'moment';

export interface PermissionGateConfig {
  getPermission: () => Promise<PermissionStatus>;
  openPermissionDialog: () => Promise<PermissionStatus>;
  onPermissionRequested?: (status: PermissionStatus) => void;
}

interface UsePermissionGateReturn {
  permission: PermissionStatus | null;
  isRequestingPermission: boolean;
  isExecuting: boolean;
  ensureAndRun: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  checkPermission: () => Promise<PermissionStatus>;
  requestPermission: () => Promise<PermissionStatus>;
}

const isAllowed = (status: PermissionStatus) => status === 'allowed';

function usePermissionGate(
  config: PermissionGateConfig
): UsePermissionGateReturn {
  const [permission, setPermission] = useStateHook<PermissionStatus | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useStateHook(false);
  const [isExecuting, setIsExecuting] = useStateHook(false);

  const mountedRef = useRef<boolean>(false);
  const execCountRef = useRef<number>(0);
  const reqCountRef = useRef<number>(0);

  const runIfMounted = useCallback((fn: () => void) => {
    if (mountedRef.current) {
      fn();
    }
  }, []);

  const checkPermission = useCallback(async () => {
    const status = await config.getPermission();
    runIfMounted(() => setPermission(status));
    return status;
  }, [config, runIfMounted]);

  const requestPermission = useCallback(async () => {
    reqCountRef.current += 1;
    runIfMounted(() => setIsRequestingPermission(true));
    try {
      const status = await config.openPermissionDialog();
      runIfMounted(() => setPermission(status));
      config.onPermissionRequested?.(status);
      return status;
    } finally {
      reqCountRef.current -= 1;
      if (reqCountRef.current === 0) {
        runIfMounted(() => setIsRequestingPermission(false));
      }
    }
  }, [config, runIfMounted]);

  const ensureAndRun = useCallback(
    async <T>(fn: () => Promise<T>) => {
      const current = await checkPermission();
      const allowed =
        isAllowed(current) || isAllowed(await requestPermission());

      if (!allowed) {
        const error = new Error('권한을 거절했어요.');
        error.name = 'PermissionDeniedError';
        throw error;
      }

      execCountRef.current += 1;
      runIfMounted(() => setIsExecuting(true));
      try {
        const result = await fn();
        return result;
      } finally {
        execCountRef.current -= 1;

        if (execCountRef.current === 0) {
          runIfMounted(() => setIsExecuting(false));
        }
      }
    },
    [checkPermission, requestPermission, runIfMounted]
  );

  useEffectHook(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    permission,
    isRequestingPermission,
    isExecuting,
    ensureAndRun,
    checkPermission,
    requestPermission,
  };
}

// ------ useAlbumPhotos hook -------
export interface ImageState extends ImageResponse {
  previewUri: string;
}

function useAlbumPhotos({ base64 = true }: { base64?: boolean }) {
  const [albumPhotos, setAlbumPhotos] = useState<ImageState[]>([]);
  const toast = useToast();
  const permissionGate = usePermissionGate({
    getPermission: () => fetchAlbumPhotos.getPermission(),
    openPermissionDialog: () => fetchAlbumPhotos.openPermissionDialog(),
    onPermissionRequested: (status) => console.log(`권한 요청 결과: ${status}`),
  });

  const loadPhotos = useCallback(async () => {
    try {
      const response = await permissionGate.ensureAndRun(() =>
        fetchAlbumPhotos({ maxWidth: 360, base64 })
      );

      if (!response) return;

      const newImages = response.map((img) => ({
        ...img,
        previewUri: base64
          ? `data:image/jpeg;base64,${img.dataUri}`
          : img.dataUri,
      }));

      setAlbumPhotos((prev) => [...prev, ...newImages]);
    } catch (error) {
      let errorMessage = '앨범을 가져오는 데 실패했어요';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.open(`${errorMessage}`);
    }
  }, [base64]);

  const deletePhoto = useCallback((id: string) => {
    setAlbumPhotos((prev) => prev.filter((album) => album.id !== id));
  }, []);

  return { albumPhotos, loadPhotos, deletePhoto };
}

// ------ Main Inquiry Component -------
export default function InfoOneOnOneInquiry() {
  const navigation = useNavigation();
  const [value, setValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { albumPhotos, loadPhotos, deletePhoto } = useAlbumPhotos({ base64: true });

  const dispatch = useAppDispatch();
  const { loading, error, success } = useAppSelector((state) => state.inquirySlice);
  const userName = 'toss_user';

  useEffect(() => {
    if (success) {
      setValue('');
      setIsSubmitted(true);
      dispatch(resetInquiryState());
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('에러', error);
      dispatch(resetInquiryState());
    }
  }, [error, dispatch]);

  const onSubmit = () => {
    if (!value.trim()) {
      Alert.alert('문의 내용을 입력해 주세요.');
      return;
    }
    dispatch(postInquiry({
      userName,
      inquire: value,
      photos: albumPhotos.map((img) => img.previewUri), // base64 포함
    }));
  };

  const handleGoHome = () => {
    setIsSubmitted(false);
    navigation.navigate('/main');
  };

  // 사진 추가 UI
  const renderPhotoSection = () => (
    <View>
      <Text style={styles.photoLabel}>사진 추가</Text>
      <View style={styles.photoRow}>
        {/* "+" 버튼 */}
        {albumPhotos.length < 3 && (
          <TouchableOpacity style={styles.photoAddBox} onPress={loadPhotos} activeOpacity={0.8}>
            <Icon name="icon-plus" size={32} color={colors.blue600}/>
          </TouchableOpacity>
        )}
        {/* 선택된 사진들 */}
        {albumPhotos.map((img) => (
          <View key={img.id} style={styles.photoPreviewBox}>
            <Image source={{ uri: img.previewUri }} style={styles.photoPreviewImg} />
            <TouchableOpacity
              style={styles.photoRemoveBtn}
              onPress={() => deletePhoto(img.id)}
            >
              <Icon name="icon-close" size={18} color={colors.grey400} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {isSubmitted ? (
        <InquirySuccessView onGoHome={handleGoHome} />
      ) : (
        <>
          <Top.Root
            title={
              <Top.TitleParagraph typography="t3" color={colors.grey900}>
                1:1 문의하기
              </Top.TitleParagraph>
            }
          />
          <FixedBottomCTAProvider>
            <View style={styles.container}>
              <View style={styles.boxWrapper}>
                <TextInput
                  style={styles.textArea}
                  multiline
                  placeholder="문의하실 내용을 입력해 주세요"
                  placeholderTextColor="#B1B6BE"
                  value={value}
                  onChangeText={setValue}
                  textAlignVertical="top"
                  underlineColorAndroid="transparent"
                  selectionColor="#23262F"
                  editable={!loading}
                />
              </View>
              {/* 사진 추가 영역 */}
              {renderPhotoSection()}
            </View>
            <FixedBottomCTA onPress={onSubmit} disabled={loading || !value.trim()}>
              {loading ? '잠시만 기다려주세요...' : '제출하기'}
            </FixedBottomCTA>
          </FixedBottomCTAProvider>
        </>
      )}
    </View>
  );
}

function InquirySuccessView({ onGoHome }: { onGoHome: () => void }) {
  return (
    <View style={successStyles.container}>
      <View style={successStyles.iconWrapper}>
        <Icon name='icon-check-circle-blue' size={68}/>
      </View>
      <Text typography='t3' fontWeight='semiBold'>문의 접수가 됐어요</Text>
      <Text style={successStyles.desc}>답변은 내 정보 &gt; 쪽지함에서 확인할 수 있어요</Text>
      <TouchableOpacity style={successStyles.button} onPress={onGoHome}>
        <Text style={successStyles.buttonText}>홈으로 돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  boxWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECEEF1',
    padding: 0,
    minHeight: 200,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.02 : 0,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 1 },
  },
  textArea: {
    minHeight: 180,
    padding: 16,
    marginVertical: 16,
    fontSize: 18,
    color: '#23262F',
    backgroundColor: 'transparent',
  },
  photoLabel: {
    fontSize: 16, fontWeight: '600', color: colors.grey800, marginTop: 10, marginBottom: 10,
  },
  photoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  photoAddBox: {
    width: 90, height: 90, borderRadius: 18, borderWidth: 1, borderColor: '#ECEEF1',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', marginRight: 10,
  },
  photoPreviewBox: {
    width: 90, height: 90, borderRadius: 18, overflow: 'hidden', marginRight: 10,
    position: 'relative',
  },
  photoPreviewImg: {
    width: '100%', height: '100%', borderRadius: 18,
  },
  photoRemoveBtn: {
    position: 'absolute', top: 4, right: 4, backgroundColor: '#fff', borderRadius: 12, padding: 2,
  },
});

const successStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  iconWrapper: { marginBottom: 16 },
  desc: { fontSize: 15, color: colors.grey700, marginTop: 12, marginBottom: 32, textAlign: 'center' },
  button: {
    backgroundColor: '#EDF3FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8
  },
  buttonText: { color: '#4287f5', fontSize: 16, fontWeight: 'bold' }
});

function async<T>(fn: any, arg1: () => { new(executor: (resolve: (value: any) => void, reject: (reason?: any) => void) => void): Promise<T>; all<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>[]>; all<T extends readonly unknown[] | []>(values: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]>; }>; race<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>>; race<T extends readonly unknown[] | []>(values: T): Promise<Awaited<T[number]>>; readonly prototype: Promise<any>; reject<T = never>(reason?: any): Promise<T>; resolve(): Promise<void>; resolve<T>(value: T): Promise<Awaited<T>>; resolve<T>(value: T | PromiseLike<T>): Promise<Awaited<T>>; allSettled<T extends readonly unknown[] | []>(values: T): Promise<{ -readonly [P in keyof T]: PromiseSettledResult<Awaited<T[P]>>; }>; allSettled<T>(values: Iterable<T | PromiseLike<T>>): Promise<PromiseSettledResult<Awaited<T>>[]>; any<T extends readonly unknown[] | []>(values: T): Promise<Awaited<T[number]>>; any<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>>; withResolvers<T>(): PromiseWithResolvers<T>; try<T, U extends unknown[]>(callbackFn: (...args: U) => T | PromiseLike<T>, ...args: U): Promise<Awaited<T>>; readonly [Symbol.species]: PromiseConstructor; }): any {
    throw new Error('Function not implemented.');
}
