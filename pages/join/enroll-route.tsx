import React, { useState } from "react";
import { View } from "react-native";
import {Button, FixedBottomCTAProvider, FixedBottomCTA} from "@toss-design-system/react-native";
import { createRoute } from "@granite-js/react-native";
import { EnrollTransit } from '../enroll/transit';
import { EnrollBusy } from '../enroll/busy';
import { EnrollTitle } from "../enroll/title";
import NavigationBar from "../../components/navigation-bar";
import { CustomProgressBar } from "../../components/progress-bar";
import { StepText } from "../../components/step-text";
import { Day } from "../enroll/day";
import { Departure } from "../enroll/departure";
import { Essential } from "../enroll/essential";

type NavigationStackItem = {
  title: string;
  subTitle1?: string | null | undefined;
  subTitle2?: string | null | undefined;
  component: React.ReactNode;
};

export const Route = createRoute('/join/enroll-route', {
  validateParams: (params) => params,
  component: EnrollRoute,
})

function EnrollRoute() {
  const navigationStack: NavigationStackItem[] = [
    { title: '여행 이름 정해주세요!', subTitle1: '새 여행', subTitle2: null, component: <EnrollTitle /> },
    { title: '여행 날짜를 정해주세요', subTitle1: '1. 여행 계획을 알려주세요', subTitle2: '여행 시작일과 마지막 날을 선택해주세요', component: <Day /> },
    { title: '여행 출발지는 어디인가요?', subTitle1: '1. 여행 계획을 알려주세요', subTitle2: '선택하신 지역 근처의 공항과 기차역을 찾아봤어요', component: <Departure /> },
    { title: '미리 정해 둔 장소가 있나요?', subTitle1: '1. 여행 계획을 알려주세요', subTitle2: '숙소는 최대 1개, 여행지는 최대 3개 추가할 수 있어요', component: <Essential /> },
    { title: '이동 수단은 무엇인가요?', subTitle1: '2. 여행 스타일을 알아볼게요', subTitle2: '* 기본값 : 자동차(렌트카)',  component: <EnrollTransit /> },
    { title: '원하는 여행 유형은 무엇인가요?', subTitle1: '2. 여행 스타일을 알아볼게요 ', subTitle2: '* 기본값: 여유있는 일정',  component: <EnrollBusy /> },
  ];

  const [step, setStep] = useState(0);
  const CurrentComponent = navigationStack[step]?.component;

  return (
    <View style={{ flex: 1 }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <>
          <CustomProgressBar />
          <StepText
            title={navigationStack[step]?.title}
            subTitle1={navigationStack[step]?.subTitle1}
            subTitle2={navigationStack[step]?.subTitle2}
          ></StepText>
          {CurrentComponent}
          <FixedBottomCTA.Double
            containerStyle={{ backgroundColor: 'white' }}
            leftButton={
              <Button type="dark" style="weak" display="block" onPress={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                이전으로
              </Button>
            }
            rightButton={
              <Button display="block" onPress={() =>
                setStep(step === navigationStack.length - 1 ? step : step + 1)
              }>
                다음으로
              </Button>
            }
          />
        </>
      </FixedBottomCTAProvider>
    </View>
  );
}

export default EnrollRoute;