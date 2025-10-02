import React, { useState, useEffect } from 'react';
import { Alert, View, TextInput, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from 'store'; // redux hooks
import {
  FixedBottomCTA,
  FixedBottomCTAProvider,
  Top,
  colors,
  Text, Icon,
} from '@toss-design-system/react-native';
import { resetInquiryState, postInquiry } from '../../redux/inquirySlice';
import { useNavigation } from "@granite-js/react-native";

export default function InfoOneOnOneInquiry() {
  const navigation = useNavigation();
  const [value, setValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const dispatch = useAppDispatch();
  const { loading, error, success } = useAppSelector((state) => state.inquirySlice);
  const userName = 'toss_user';

  useEffect(() => {
    if (success) {
      setValue('');
      setIsSubmitted(true); // 문의 접수 완료 화면으로 전환
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

  const handleGoHome = () => {
    setIsSubmitted(false);
    navigation.navigate('/main');
  };

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

const successStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  iconWrapper: { marginBottom: 16 },
  checkCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#4287f5', alignItems: 'center', justifyContent: 'center'
  },
  check: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', marginTop: 8, color: '#23262F' },
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