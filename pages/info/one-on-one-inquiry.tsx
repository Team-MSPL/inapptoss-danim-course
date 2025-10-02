import React, { useState, useEffect } from 'react';
import { Alert, View, TextInput, StyleSheet, Platform, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useAppDispatch, useAppSelector } from 'store';
import {
  FixedBottomCTA,
  FixedBottomCTAProvider,
  Top,
  colors,
  Text, Icon,
  Button,
} from '@toss-design-system/react-native';
import { resetInquiryState, postInquiry } from '../../redux/inquirySlice';
import { useNavigation } from "@granite-js/react-native";
import {useAlbumPhotos} from "../../hooks/useAlbumPhotos";

// useAlbumPhotos, usePermissionGate 등은 기존과 동일하게 사용

export default function InfoOneOnOneInquiry() {
  const navigation = useNavigation();
  const [value, setValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 확대 이미지 상태
  const [expandedPhoto, setExpandedPhoto] = useState<{ id: string; uri: string } | null>(null);

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
      photos: albumPhotos.map((img) => img.previewUri),
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
        {albumPhotos.length < 3 && (
          <TouchableOpacity style={styles.photoAddBox} onPress={loadPhotos} activeOpacity={0.8}>
            <Icon name="icon-plus" size={32} color={colors.blue600}/>
          </TouchableOpacity>
        )}
        {albumPhotos.map((img) => (
          <TouchableOpacity
            key={img.id}
            style={styles.photoPreviewBox}
            onPress={() => setExpandedPhoto({ id: img.id, uri: img.previewUri })}
            activeOpacity={0.93}
          >
            <Image source={{ uri: img.previewUri }} style={styles.photoPreviewImg} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // 확대 이미지 전용 뷰
  const renderExpandedPhoto = () => (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={{ uri: expandedPhoto?.uri }}
        style={{
          width: Dimensions.get('window').width,
          height: Dimensions.get('window').height * 0.55,
          resizeMode: 'contain',
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {isSubmitted ? (
        <InquirySuccessView onGoHome={handleGoHome} />
      ) : (
        <FixedBottomCTAProvider>
          {expandedPhoto ? (
            // 확대 이미지 화면
            <>
              {renderExpandedPhoto()}
              <View style={styles.bottomBar}>
                <Button
                  type="dark"
                  style="weak"
                  size="large"
                  onPress={() => setExpandedPhoto(null)}
                >
                  닫기
                </Button>
                <Button
                  type="danger"
                  style="fill"
                  size="large"
                  onPress={() => {
                    deletePhoto(expandedPhoto.id);
                    setExpandedPhoto(null);
                  }}
                >
                  삭제
                </Button>
              </View>
            </>
          ) : (
            // 기본 문의 폼 화면
            <>
              <Top.Root
                title={
                  <Top.TitleParagraph typography="t3" color={colors.grey900}>
                    1:1 문의하기
                  </Top.TitleParagraph>
                }
              />
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
                {renderPhotoSection()}
              </View>
              <FixedBottomCTA onPress={onSubmit} disabled={loading || !value.trim()}>
                {loading ? '잠시만 기다려주세요...' : '제출하기'}
              </FixedBottomCTA>
            </>
          )}
        </FixedBottomCTAProvider>
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
  },
  photoPreviewImg: {
    width: '100%', height: '100%', borderRadius: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: '#fff',
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 8,
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