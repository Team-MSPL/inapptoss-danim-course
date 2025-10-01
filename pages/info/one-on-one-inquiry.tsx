import React, { useState, useEffect } from 'react';
import { Alert, View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { useAppDispatch, useAppSelector } from 'store'; // redux hooks
import {
  FixedBottomCTA,
  FixedBottomCTAProvider,
  Top,
  colors,
} from '@toss-design-system/react-native';
import { resetInquiryState } from '../../redux/inquirySlice';
import { postInquiry } from '../../redux/inquirySlice';
import {useNavigation} from "@granite-js/react-native";

export default function InfoOneOnOneInquiry() {
  const navigation = useNavigation();
  const [value, setValue] = useState('');
  const dispatch = useAppDispatch();
  const { loading, error, success } = useAppSelector((state) => state.inquirySlice);
  const userName = 'toss_user';

  useEffect(() => {
    if (success) {
      Alert.alert('문의가 성공적으로 접수되었습니다.');
      setValue('');
      navigation.goBack();
      dispatch(resetInquiryState());
    }
  }, [success, dispatch]);

  // 에러시 Alert
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
    dispatch(postInquiry({ userName, inquire: value }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
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
        </View>
        <FixedBottomCTA onPress={onSubmit} disabled={loading || !value.trim()}>
          {loading ? '잠시만 기다려주세요...' : '제출하기'}
        </FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#23262F',
    marginBottom: 22,
  },
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
});
