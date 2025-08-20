import {
  BottomSheet,
  Button,
  colors,
  Icon,
  ListRow,
  NumericSpinner,
  SegmentedControl,
  useBottomSheet,
  useToast,
} from "@toss-design-system/react-native";
import React, { MutableRefObject, useRef, useState } from "react";
import { Dimensions, Text, View } from "react-native";
import { BedrockRoute, useNavigation } from "react-native-bedrock";
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from "react-native-google-places-autocomplete";
import { useAppDispatch, useAppSelector } from "store";
import { googleDetailApi, travelSliceActions } from "../../redux/travle-slice";

export const Route = BedrockRoute("/enroll/essential-search", {
  validateParams: (params) => params,
  component: EnrollEssentialSearch,
});

function EnrollEssentialSearch() {
  const [value, setValue] = useState("여행지");
  const [hour, setHour] = useState(1);
  const dispatch = useAppDispatch();
  const bottomSheet = useBottomSheet();
  const { Place, essentialPlaces, accommodations } = useAppSelector(
    (state) => state.travelSlice
  );
  const params = Route.useParams();
  const autocompleteRef = useRef<GooglePlacesAutocompleteRef | null>();
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const INPUT_WIDTH = SCREEN_WIDTH - 24 * 2; // 양쪽 여백 24씩
  const navigation = useNavigation();
  const [placeState, setPlaceState] = useState<{
    name: string | undefined;
    lat: number | undefined;
    lng: number | undefined;
    photo: string;
    category: number;
    takenTime: number;
    formatted_address: string | undefined;
    region: string;
  } | null>();
  const showHourBottomSheet = (datas: any) => {
    bottomSheet.open({
      children: (
        <HourBottomSheetContent
          initialHour={hour}
          onConfirm={(newHour) => {
            bottomSheet.close();
            addPlace(newHour, datas);
            // 여기서 원하는 로직 추가 가능 (예: dispatch)
          }}
          onCancel={() => {
            bottomSheet.close();
            autocompleteRef.current?.setAddressText("");
          }}
          placeType={value}
          placeState={datas}
        />
      ),
    });
  };
  const addPlace = (newHour, datas) => {
    const filteredPlaces = essentialPlaces.filter(
      (place) => place?.day === params.idx + 1
    );
    if (value == "숙소" && accommodations[params.idx + 1].name != "") {
      open("숙소는 1개까지 추가 할 수 있어요", {
        icon: "icon-warning-circle",
      });
      autocompleteRef.current?.setAddressText("");
    } else if (value == "여행지" && filteredPlaces.length == 3) {
      open("여행지는 3개까지 추가 할 수 있어요", {
        icon: "icon-warning-circle",
      });
      autocompleteRef.current?.setAddressText("");
    } else {
      let copy = [...(value == "여행지" ? essentialPlaces : accommodations)];
      value == "숙소"
        ? datas && (copy[params.idx + 1] = datas)
        : copy.push({
            ...datas,
            day: params.idx + 1,
            id: params.idx + 1 + "q" + datas?.lat,
            category: 5,
            takenTime: (newHour + 1) * 60,
          });
      dispatch(
        travelSliceActions.updateFiled({
          field: value == "숙소" ? "accommodations" : "essentialPlaces",
          value: copy,
        })
      );
      navigation.goBack();
    }
  };
  const { open } = useToast();

  return (
    <>
      <SegmentedControl.Root
        size="large"
        alignment="fixed"
        name="segmented2"
        value={value}
        onChange={setValue}
      >
        <SegmentedControl.Item value="여행지">여행지</SegmentedControl.Item>
        <SegmentedControl.Item value="숙소">숙소</SegmentedControl.Item>
      </SegmentedControl.Root>

      <GooglePlacesAutocomplete
        placeholder={`${value}를 검색해보세요`}
        disableScroll={false}
        enablePoweredByContainer={false}
        keepResultsAfterBlur={true}
        ref={
          autocompleteRef as MutableRefObject<GooglePlacesAutocompleteRef | null>
        }
        query={{
          key: "AIzaSyA_nsvAajvyiWj-FeJO6u1-yZYsOBkoPOk",
          language: "ko",
        }}
        textInputProps={{
          placeholderTextColor: colors.grey500,
          allowFontScaling: false,
        }}
        renderLeftButton={() => <Icon name="icon-search-mono" />}
        styles={{
          container: { alignItems: "center", marginTop: 30 },
          textInputContainer: {
            width: INPUT_WIDTH,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.grey100,
            alignItems: "center",
            paddingLeft: 20,
          },
          listView: { width: INPUT_WIDTH, maxHeight: 250, zIndex: 1000 },
          textInput: {
            color: colors.grey500,
            backgroundColor: "transparent",
            flex: 0.9,
            fontSize: 16,
          },
          description: { color: "black" },
        }}
        fetchDetails={true}
        onPress={async (data, details) => {
          const placeId = details?.place_id;
          const response = await dispatch(
            googleDetailApi({ placeId: placeId })
          );
          let imageUrl;
          if (response.payload.result.photos) {
            const photoReference =
              response.payload.result?.photos[0]?.photo_reference;
            imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=AIzaSyA_nsvAajvyiWj-FeJO6u1-yZYsOBkoPOk`;
          } else {
            imageUrl = null;
          }
          const datas = {
            ...Place,
            name: details?.name,
            lat: details?.geometry.location.lat,
            lng: details?.geometry.location.lng,
            formatted_address: details?.formatted_address.replace(
              "대한민국 ",
              ""
            ),
            photo: imageUrl,
            region:
              regionOneList[details?.formatted_address.split(" ")[1]] +
              " " +
              (regionList[details?.formatted_address.split(" ")[1]] ??
                cityList[details?.formatted_address.split(" ")[2]]),
          };
          setPlaceState(datas);
          dispatch(travelSliceActions.enrollPlace(datas));

          showHourBottomSheet(datas);

          // 필요한 경우 아래 코드 주석 해제
          // dispatch(
          //   travelSliceActions.setDeparture({
          //     search: true,
          //     name: details?.name,
          //     lat: details?.geometry.location.lat,
          //     lng: details?.geometry.location.lng,
          //   })
          // );
        }}
        onFail={(error) => console.log(error)}
        onNotFound={() => console.log("no results")}
      />
    </>
  );
}

type HourBottomSheetContentProps = {
  initialHour: number;
  onConfirm: (newHour: number) => void;
  onCancel: () => void;
  placeType: string;
  placeState: any;
};

function HourBottomSheetContent({
  initialHour,
  onConfirm,
  onCancel,
  placeType,
  placeState,
}: HourBottomSheetContentProps) {
  const [localHour, setLocalHour] = useState(initialHour);

  return (
    <View>
      <ListRow
        contents={
          <ListRow.Texts
            type="2RowTypeA"
            top={placeState?.name}
            bottom={placeState?.formatted_address}
          />
        }
        right={
          <Button type="dark" size="tiny" style="weak" onPress={onCancel}>
            취소
          </Button>
        }
      />
      {placeType == "여행지" && (
        <ListRow
          contents={<ListRow.Texts type="1RowTypeA" top="머무를 시간" />}
          right={
            <NumericSpinner
              size="large"
              number={localHour}
              onNumberChange={(e) => {
                setLocalHour(e);
              }}
              maxNumber={3}
              minNumber={1}
            />
          }
        />
      )}

      <BottomSheet.CTA onPress={() => onConfirm(localHour)}>
        {placeType} 추가하기
      </BottomSheet.CTA>
    </View>
  );
}
const regionOneList = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별시: "세종",
  경기도: "경기",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전라북도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주도: "제주",
};
const regionList = {
  부산광역시: "전체",
  대구광역시: "전체",
  인천광역시: "전체",
  광주광역시: "전체",
  대전광역시: "전체",
  울산광역시: "전체",
  세종특별시: "전체",
};
const cityList = {
  종로구: "도심권",
  중구: "도심권",
  용산구: "도심권",
  강남구: "동남권",
  서초구: "동남권",
  송파구: "동남권",
  강북구: "동북권",
  도봉구: "동북권",
  노원구: "동북권",
  성북구: "동북권",
  동대문구: "동북권",
  중랑구: "동북권",
  성동구: "동북권",
  광진구: "동북권",
  강서구: "서남권",
  양천구: "서남권",
  구로구: "서남권",
  영등포구: "서남권",
  동작구: "서남권",
  관악구: "서남권",
  금천구: "서남권",
  은평구: "서북권",
  서대문구: "서북권",
  마포구: "서북권",
};
