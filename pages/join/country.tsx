import React from 'react';
import { View } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import NavigationBar from '../../components/navigation-bar';
import { Button, FixedBottomCTA, FixedBottomCTAProvider } from '@toss-design-system/react-native';
import { CustomProgressBarJoin } from '../../components/join/custom-progress-bar-join';
import { StepText } from '../../components/step-text';
import CountrySelector from '../../components/main/CountrySelector';
import { useCountryStore } from '../../zustand/countryStore';

export const Route = createRoute('/join/country', {
  validateParams: (params) => params,
  component: JoinCountry,
});

type Country = { code: string; dial?: string; label: string; lang?: string };

const COUNTRY_OPTIONS: Country[] = [
  { code: 'KR', dial: '82', label: '한국', lang: 'ko' },
  { code: 'JP', dial: '81', label: '일본', lang: 'ja' },
  { code: 'CN', dial: '86', label: '중국', lang: 'zh-cn' },
  { code: 'VN', dial: '84', label: '베트남', lang: 'vi' },
  { code: 'TH', dial: '66', label: '태국', lang: 'th' },
  { code: 'PH', dial: '63', label: '필리핀', lang: 'en' },
  { code: 'SG', dial: '65', label: '싱가포르', lang: 'en' },
];

function JoinCountry() {
  const navigation = useNavigation();
  const selectedCountryKo = useCountryStore((s) => s.selectedCountryKo);
  const setSelectedCountryKo = useCountryStore((s) => s.setSelectedCountryKo);

  const handleSelect = (code: string) => {
    const picked = COUNTRY_OPTIONS.find((c) => c.code === code);
    const ko = picked ? picked.label : null;
    setSelectedCountryKo(ko);
    console.log('선택한 국가:', ko);
  };

  return (
    <View style={{ flex: 1 }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <CustomProgressBarJoin currentIndex={0} />
        <StepText title={'어디로 떠나시나요?'} subTitle1={'1. 여행 계획을 알려주세요.'} />

        <CountrySelector
          countries={COUNTRY_OPTIONS}
          onSelect={handleSelect}
          columns={2}
          selectedCode={
            selectedCountryKo
              ? COUNTRY_OPTIONS.find((c) => c.label === selectedCountryKo)?.code
              : undefined
          }
        />

        <FixedBottomCTA.Double
          containerStyle={{ backgroundColor: 'white' }}
          leftButton={
            <Button type="dark" style="weak" display="block" onPress={() => navigation.goBack()}>
              이전으로
            </Button>
          }
          rightButton={
            <Button
              display="block"
              onPress={() => {
                navigation.navigate('/join/who');
              }}
            >
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}

export default JoinCountry;