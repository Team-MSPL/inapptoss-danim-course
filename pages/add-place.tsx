import {
  Badge,
  BottomSheet,
  Button,
  colors,
  FixedBottomCTAProvider,
  GridList,
  Icon,
  ListRow,
  NumericSpinner,
  SegmentedControl,
  Text,
  useBottomSheet,
  useToast,
} from "@toss-design-system/react-native";
import React, { MutableRefObject, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { BedrockRoute, Lottie, useNavigation } from "react-native-bedrock";
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from "react-native-google-places-autocomplete";
import { useAppDispatch, useAppSelector } from "store";
import {
  googleDetailApi,
  recommendApi,
  recommendTripadvisor,
  travelSliceActions,
} from "../redux/travle-slice";
import { cityList, regionList, regionOneList } from "./enroll/essential-search";
import NavigationBar from "../components/navigation-bar";
export const Route = BedrockRoute("/add-place", {
  validateParams: (params) => params,
  component: AddPlace,
});

function AddPlace() {
  const params = Route.useParams();
  const [value1, setValue1] = useState("여행지");
  const navigation = useNavigation();
  const autocompleteRef = useRef<GooglePlacesAutocompleteRef | null>();
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const INPUT_WIDTH = SCREEN_WIDTH - 24 * 2; // 양쪽 여백 24씩
  const { Place, country, regionInfo } = useAppSelector(
    (state) => state.travelSlice
  );
  const dispatch = useAppDispatch();
  const bottomSheet = useBottomSheet();
  const handleCategory = (e: string) => {
    let title = "";
    switch (e) {
      case "여행지":
        title = country != 0 ? "attractions" : "AT4";
        break;
      case "숙소":
        title = country != 0 ? "hotels" : "AD5";
        break;
      case "식당":
        title = country != 0 ? "restaurants" : "FD6";
        break;
    }
    return title;
  };
  const handleCategoryIndex = (e: string) => {
    let title = 0;
    switch (e) {
      case "여행지":
        title = 0;
        break;
      case "숙소":
        title = 4;
        break;
      case "식당":
        title = 1;
        break;
    }
    return title;
  };
  const { open } = useToast();
  const [recommendList, setRcommendList] = useState([]);
  const [loading, setLoading] = useState(false);
  const getRecommendList = async () => {
    try {
      //   setLoading(true);
      const tableData = params?.data[params?.day][params?.index - 1];
      let result = await dispatch(
        country != 0
          ? recommendTripadvisor({
              category: handleCategory(value1),
              lat: tableData?.lat ?? regionInfo.lat,
              lng: tableData?.lng ?? regionInfo.lng,
              radius: 10000,
              name: tableData?.name ?? region[0].split("/").at(-1),
            })
          : recommendApi({
              category: handleCategory(value1),
              lat: tableData?.lat ?? regionInfo.lat,
              lng: tableData?.lng ?? regionInfo.lng,
              radius: 1000,
            })
      ).unwrap();
      result = country != 0 ? result.data : result;
      if (result.length == 0) {
        result = await dispatch(
          country != 0
            ? recommendTripadvisor({
                category: handleCategory(value1),
                lat: tableData?.lat ?? regionInfo.lat,
                lng: tableData?.lng ?? regionInfo.lng,
                radius: 20000,
                name: params?.data[params?.day][params?.index]?.name ?? "",
              })
            : recommendApi({
                category: handleCategory(value1),
                lat: tableData?.lat ?? regionInfo.lat,
                lng: tableData?.lng ?? regionInfo.lng,
                radius: 20000,
              })
        ).unwrap();
        // departure.current.lat = route.params.lat;
        // departure.current.lng = route.params.lng;
        result = country != 0 ? result.data : result;
        result.length == 0 &&
          (open("동선 상에 추천할 수 있는 장소가 없습니다 ㅠㅠ"),
          navigation.goBack());
      }
      setRcommendList(result);
    } catch (err) {
      open("추천 아이템이 없습니다!");
      navigation.goBack();
    } finally {
      setLoading(false);
      //   dispatch(LoadingSliceActions.offLoading());
    }
  };

  const handleAdd = (e, time) => {
    let copy = [...params?.data];
    let copy2 = [...params?.data[params?.day]];
    let changeFlag = null;
    const newY =
      isNaN(copy2[params?.index]?.y + copy2[params?.index]?.takenTime / 30) ||
      copy2[params?.index]?.y == 36
        ? 6
        : copy2[params?.index]?.y + copy2[params?.index]?.takenTime / 30;
    const newEnd = newY + time * 2;
    for (let i = 0; i < copy2.length; i++) {
      if (
        ((newY <= copy2[i]?.y && newEnd > copy2[i]?.y) ||
          (newY <= copy2[i]?.y + copy2[i].takenTime / 30 - 1 &&
            newEnd > copy2[i]?.y + copy2[i].takenTime / 30 - 1)) &&
        copy2[i].id != params?.data[params?.day][params?.index]?.id
      ) {
        changeFlag = copy2[i];
        break;
      }
    }
    if (changeFlag) {
      open(`${changeFlag.name}과 시간이 겹쳐요`, {
        icon: "icon-warning-circle",
      });
    } else {
      copy2.push({
        ...e,
        category: handleCategoryIndex(value1),
        x: params?.day,
        y:
          isNaN(
            copy2[params?.index]?.y + copy2[params?.index]?.takenTime / 30
          ) || copy2[params?.index]?.y == 36
            ? 6
            : copy2[params?.index]?.y + copy2[params?.index]?.takenTime / 30,
        id: (e?.name ?? e?.place_name) + e?.lat,
        takenTime: time * 60,
        lat: Number(e?.lat ?? e.y),
        lng: Number(e?.lng ?? e.x),
        name: e?.name ?? e?.place_name,
      });
      copy2 = copy2.sort((a, b) => a.y - b.y);
      copy[params?.day] = copy2;
      console.log(copy);
      params?.setCopyTimetable(copy);
      open(`${value1}를 추가했어요`, {
        icon: "icon-check-circle-green",
      });
      navigation.goBack();
    }
  };
  const showHourBottomSheet = (datas: any) => {
    bottomSheet.open({
      children: (
        <HourBottomSheetContent
          initialHour={1}
          onConfirm={(newHour) => {
            bottomSheet.close();
            handleAdd(datas, newHour);
            // addPlace(newHour, datas);
            // 여기서 원하는 로직 추가 가능 (예: dispatch)
          }}
          onCancel={() => {
            bottomSheet.close();
            autocompleteRef.current?.setAddressText("");
          }}
          placeType={value1}
          placeState={datas}
        />
      ),
    });
  };
  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <Lottie
          height={"100%"}
          src="https://firebasestorage.googleapis.com/v0/b/danim-image/o/loading-json%2Floading.json?alt=media&token=93dc5b78-a489-413f-bc77-29444985e83b"
          autoPlay={true}
          loop={true}
          onAnimationFailure={() => {
            console.log("Animation Failed");
          }}
          onAnimationFinish={() => {
            console.log("Animation Finished");
          }}
        />
      )}
      <NavigationBar />
      <FixedBottomCTAProvider>
        <SegmentedControl.Root
          size={"large"}
          name="segmented"
          value={value1}
          onChange={(e) => {
            setValue1(e);
            setRcommendList([]);
          }}
        >
          <SegmentedControl.Item value="여행지">여행지</SegmentedControl.Item>
          <SegmentedControl.Item value="숙소">숙소</SegmentedControl.Item>
          <SegmentedControl.Item value="식당">식당</SegmentedControl.Item>
          {/* <SegmentedControl.Item value="오늘의커피">오늘의커피</SegmentedControl.Item> */}
        </SegmentedControl.Root>
        <GooglePlacesAutocomplete
          placeholder={value1 + "를 검색해보세요"}
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
          renderRightButton={() => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: 44,
              }}
            >
              <Button
                size="medium"
                type="primary"
                style="weak"
                onPress={() => {
                  getRecommendList();
                }}
              >
                AI추천
              </Button>
            </View>
          )}
          styles={{
            container: { alignItems: "center" },
            textInputContainer: {
              width: INPUT_WIDTH,
              height: 44,
              borderRadius: 12,
              backgroundColor: colors.grey100,
              alignItems: "center",
              paddingLeft: 20,
              marginTop: 20,
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
        ></GooglePlacesAutocomplete>
        {recommendList.map((item, idx) => {
          return (
            <ListRow
              onPress={() => {
                showHourBottomSheet(item);
              }}
              left={
                <ListRow.Icon name={`icon-plus-circle-blue`}></ListRow.Icon>
              }
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={item?.place_name ?? item?.name}
                  topProps={{ color: colors.grey800 }}
                  bottom={
                    (params?.data[params?.day][params?.index - 1]?.name ??
                      "중심지") +
                    "로 부터 " +
                    (country != 0
                      ? Math.floor(Number(item?.distance) * 1000)
                      : item?.distance + "m")
                  }
                  bottomProps={{ color: colors.grey600 }}
                />
              }
            />
          );
        })}
      </FixedBottomCTAProvider>
    </View>
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
            top={placeState?.name ?? placeState?.place_name}
            bottom={placeState?.formatted_address}
          />
        }
        right={
          <Button type="dark" size="tiny" style="weak" onPress={onCancel}>
            취소
          </Button>
        }
      />
      {placeType != "숙소" && (
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
