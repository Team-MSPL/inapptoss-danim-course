import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import {
  colors,
  Text,
  ListRow,
  Top,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  useToast,
} from '@toss-design-system/react-native';
import { appLogin } from '@apps-in-toss/framework';
import { useAppDispatch, useAppSelector } from 'store';
import { socialConnect, tossUser, travelSliceActions } from '../redux/travle-slice';

export const Route = createRoute('/', {
  validateParams: (params) => params,
  component: Index,
});

export function Index() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { userId, userJwtToken } = useAppSelector((state) => state.travelSlice);
  const { open } = useToast();

  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (loading) return; // prevent double tap
    if (userId != null) {
      dispatch(travelSliceActions.reset({ userId: userId, userJwtToken: userJwtToken }));
      navigation.reset({ index: 0, routes: [{ name: '/enroll/title' }] });
    } else {
      setLoading(true);
      try {
        await handleLogin();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogin = useCallback(async () => {
    try {
      const { authorizationCode, referrer } = await appLogin();
      const userData = await dispatch(tossUser({ authorizationCode, referrer })).unwrap();
      if (userData?.resultType == 'SUCCESS') {
        await dispatch(socialConnect({ userToken: userData?.success?.userKey }));
        navigation.navigate(`/${import.meta.env.APP_START_MODE}`);
      } else {
        open('로그인에 잠시 문제가 생겼어요', {
          icon: 'icon-warning-circle',
        });
      }
    } catch (e) {
      open('로그인 중 오류가 발생했어요', {
        icon: 'icon-warning-circle',
      });
    }
  }, [dispatch, navigation, open]);

  return (
    <View style={{ flex: 1 }}>
      <FixedBottomCTAProvider>
        <Top
          title={
            <Text typography="t6" fontWeight="medium" color={colors.grey600}>
              성향을 토대로 다님 AI가 추천을해줘요
            </Text>
          }
          subtitle1={
            <Text typography="t3" fontWeight="bold" color={colors.grey900}>
              다님으로 1분만에{`\n`}여행 일정을 추천받을 수 있어요
            </Text>
          }
        />

        <ListRow
          left={
            <ListRow.Image
              type="3d-emoji"
              source={{
                uri: 'https://static.toss.im/2d-emojis/png/4x/u1F31E.png',
              }}
            />
          }
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="성향에 맞춘 여행 일정"
              bottom="내 취향에 꼭 맞는 여행 일정을 추천해줘요"
              topProps={{
                typography: 't5',
                fontWeight: 'semiBold',
                color: colors.grey700,
              }}
              bottomProps={{
                typography: 't6',
                fontWeight: 'regular',
                color: colors.grey600,
              }}
            />
          }
        />
        <ListRow
          left={
            <ListRow.Image
              type="3d-emoji"
              source={{
                uri: 'https://static.toss.im/2d-emojis/png/4x/u23F3.png',
              }}
            />
          }
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="시간 절약"
              bottom="1분 만에 여행 일정을 알려줘서 빠르게 준비할 수 있어요"
              topProps={{
                typography: 't5',
                fontWeight: 'semiBold',
                color: colors.grey700,
              }}
              bottomProps={{
                typography: 't6',
                fontWeight: 'regular',
                color: colors.grey600,
              }}
            />
          }
        />
        <ListRow
          left={
            <ListRow.Image
              type="3d-emoji"
              source={{
                uri: 'https://static.toss.im/2d-emojis/png/4x/u1F4F1.png',
              }}
            />
          }
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="손쉬운 조작"
              bottom="누구나 쉽게 사용할 수 있도록 간단하고 편리하게 만들었어요"
              topProps={{
                typography: 't5',
                fontWeight: 'semiBold',
                color: colors.grey700,
              }}
              bottomProps={{
                typography: 't6',
                fontWeight: 'regular',
                color: colors.grey600,
              }}
            />
          }
        />
        <FixedBottomCTA onPress={handleNext} disabled={loading}>
          {loading ? '잠시만 기다려주세요...' : '시작하기'}
        </FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}
