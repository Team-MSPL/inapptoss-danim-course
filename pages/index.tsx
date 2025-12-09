import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { Text, colors, FixedBottomCTAProvider, useToast } from '@toss-design-system/react-native';
import { appLogin } from '@apps-in-toss/framework';
import { useAppDispatch, useAppSelector } from 'store';
import { socialConnect, tossUser, travelSliceActions } from '../redux/travle-slice';
import useAuthStore from '../zustand/useAuthStore';

export const Route = createRoute('/', {
  validateParams: (params) => params,
  component: Index,
});

export function Index() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { userId, userJwtToken } = useAppSelector((state) => state.travelSlice);
  const setUserKey = useAuthStore((s) => s.setUserKey);
  const { open } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [errored, setErrored] = useState<boolean>(false);

  const navigateToStart = () => {
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: `/${import.meta.env.APP_START_MODE}` }],
      });
    } catch {
      navigation.goBack();
    }
  };

  const runLoginFlow = async () => {
    if (userId != null) {
      dispatch(travelSliceActions.reset({ userId, userJwtToken }));
      navigateToStart();
      return;
    }

    setErrored(false);
    setLoading(true);

    try {
      const { authorizationCode, referrer } = await appLogin();
      const userData = await dispatch(tossUser({ authorizationCode, referrer })).unwrap();

      if (userData?.resultType === 'SUCCESS') {
        await dispatch(socialConnect({ userToken: userData?.success?.userKey }));
        const userKey = userData.success?.userKey ?? null;
        setUserKey(userKey);
        navigateToStart();
      } else {
        setErrored(true);
        open('로그인에 잠시 문제가 생겼어요', { icon: 'icon-warning-circle' });
      }
    } catch (e) {
      console.warn('auto-login error', e);
      setErrored(true);
      open('로그인 중 오류가 발생했어요', { icon: 'icon-warning-circle' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runLoginFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <FixedBottomCTAProvider>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.PointGreen1} />
            <Text typography="t6" color={colors.grey700} style={styles.message}>
              로그인 중입니다...
            </Text>
          </View>
        ) : errored ? (
          <View style={styles.center}>
            <Text typography="t5" color={colors.grey800} style={{ marginBottom: 12 }}>
              자동 로그인에 실패했습니다.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                runLoginFlow();
              }}
              activeOpacity={0.8}
            >
              <Text typography="t6" color="#ffffff">
                다시 시도
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.center}>
            <Text typography="t6" color={colors.grey700}>
              준비 중입니다...
            </Text>
          </View>
        )}
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  message: { marginTop: 12, textAlign: 'center' },
  retryButton: {
    backgroundColor: colors.green300,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
});