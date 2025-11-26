import React from 'react';
import { Text, View } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import { useNavigation } from '@granite-js/native/@react-navigation/native';
import { FixedBottomCTAProvider } from '@toss-design-system/react-native';
import { StepText } from '../../components/step-text';
import CountrySelector from "../../components/main/CountrySelector";

export const Route = createRoute('/main/country-selection', {
  validateParams: (params) => params,
  component: MainCountrySelection,
});

type Country = { code: string; dial: string; label: string; lang: string };

const COUNTRY_OPTIONS: Country[] = [
  { code: "KR", dial: "82", label: "한국", lang: "ko" },
  { code: "JP", dial: "81", label: "일본", lang: "ja" },
  { code: "CN", dial: "86", label: "중국", lang: "zh-cn" },
  { code: "VN", dial: "84", label: "베트남", lang: "vi" },
  { code: "TH", dial: "66", label: "태국", lang: "th" },
  { code: "PH", dial: "63", label: "필리핀", lang: "en" },
  { code: "SG", dial: "65", label: "싱가포르", lang: "en" },
];

export default function MainCountrySelection() {
  const navigation = useNavigation();

  function onSelectCountry(code: string) {
    // Navigate to the travel shop screen and pass the selected country as a param.
    // Your app router must have a route registered for '/travel/shop' (or change the path accordingly).
    navigation.navigate("/main/travel-shop-screen", { country: code });
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingVertical: 20, paddingHorizontal: 8 }}>
      <FixedBottomCTAProvider>
        <StepText title={"여행상품을 찾으시나요?"} subTitle1={"원하는 국가를 선택해주세요!"} />
        <CountrySelector
          countries={COUNTRY_OPTIONS}
          onSelect={onSelectCountry}
          columns={2}
          selectedCode={undefined}
        />
      </FixedBottomCTAProvider>
    </View>
  );
}