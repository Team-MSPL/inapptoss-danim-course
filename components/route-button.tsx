import {
  Button,
  FixedBottomCTA,
  useToast,
} from "@toss-design-system/react-native";
import { useNavigation } from "react-native-bedrock";
import { routeStack } from "../utill/route-stack";
import { useAppDispatch, useAppSelector } from "store";
import { cityViewList } from "../utill/city-list";
import { useTendencyHandler } from "../hooks/useTendencyHandler";
import { getRegionInfo } from "../redux/travle-slice";

export const RouteButton = ({ disabled }: { disabled?: boolean }) => {
  const navigation = useNavigation();
  const { region, country, cityIndex } = useAppSelector(
    (state) => state.travelSlice
  );
  const dispatch = useAppDispatch();
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const { countryList } = useTendencyHandler();
  const { open } = useToast();
  const goNext = () => {
    if (region.length == 0) {
      open("지역을 선택해주세요.", {
        icon: "icon-warning-circle",
      });
      return false;
    } else {
      //서울== 서울 전체, 광역시 전체
      const city = cityViewList[country][cityIndex];
      const isDomestic = country == 0; //한국인지 해외인지
      const regionName = region[0]; //지역 이름
      const subTitle = city?.sub?.[1]?.subTitle ?? "";
      const cityEng = city.eng ?? ""; // 일본은 영어정보가 같이 들어가야해서
      const countryEn = countryList[country].en; //해외/japan 할때 쓰느 영어
      // 한국일때 - 광역시면 해당광역시 + 전체 ex) ['광역시 부산'] == '부산 전체'
      // 서울일때 - '서울 전체'
      // 해외일때 - 파이어베이스에는 정규화가 이상하게 되어있어서 normalize를 이용해서 넘김.
      // 특이사항- 일본은 영어를 같이 보내줘야해서 cityEng를 함께 넣음 + 영어 뒤에 띄어쓰기가 한칸 더 있어야함.
      // 국내 = '서울 전체' ....  해외 = '해외/japan/간토 (Kanto) !도쿄 or 해외/Philippines/루손 섬 !마닐라
      const data = isDomestic
        ? city.title === "광역시"
          ? `${regionName} 전체`
          : city.title === "서울"
          ? "서울 전체"
          : `${city.title} ${regionName !== "전체" ? regionName : subTitle}`
        : `해외/${countryEn}/${city.title.normalize("NFD")} ${cityEng.normalize(
            "NFD"
          )}${cityEng ? " " : ""}${
            regionName !== "전체" ? "!" + regionName : "!" + subTitle
          }`;

      //regionINfo api
      dispatch(
        getRegionInfo({
          region: data,
        })
      );
      return true;
    }
  };

  const handleNext = () => {
    const nowStep = navigation
      .getState()
      ?.routes?.at(-1)
      ?.name.split("/enroll")[1];
    if (nowStep == "/region") {
      const shouldProceed = goNext();
      if (shouldProceed) {
        navigation.navigate(
          (nowStep == "/distance" ? "" : "/enroll") + routeStack[nowStep]?.next
        );
      }
    } else if (nowStep == "/country") {
      if (country == null) {
        open("나라를 선택해주세요.", {
          icon: "icon-warning-circle",
        });
      } else {
        navigation.navigate(
          (nowStep == "/distance" ? "" : "/enroll") + routeStack[nowStep]?.next
        );
      }
    } else {
      navigation.navigate(
        (nowStep == "/distance" ? "" : "/enroll") + routeStack[nowStep]?.next
      );
    }
  };
  return (
    <FixedBottomCTA.Double
      leftButton={
        <Button type="dark" style="weak" display="block" onPress={handleBack}>
          이전으로
        </Button>
      }
      rightButton={
        <Button
          display="block"
          onPress={handleNext}
          disabled={disabled ?? false}
        >
          다음으로
        </Button>
      }
    />
  );
};
