import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { BedrockRoute, useNavigation } from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import { recommendApi, recommendTripadvisor } from "../redux/travle-slice";
import {
  BottomSheet,
  Button,
  colors,
  ListRow,
  Text,
  useBottomSheet,
  useToast,
} from "@toss-design-system/react-native";
import { ScrollView } from "@react-native-bedrock/native/react-native-gesture-handler";
import CustomMapViewMarker from "../components/map-view-marker";

export const Route = BedrockRoute("/recommend-place", {
  validateParams: (params) => params,
  component: RecommendPlace,
});

function RecommendPlace() {
  const params = Route.useParams();
  const dispatch = useAppDispatch();
  const { country, regionInfo } = useAppSelector((state) => state.travelSlice);
  const handleCategory = (e: number) => {
    let title = "";
    switch (e) {
      case 0:
        title = country != 0 ? "attractions" : "AT4";
        break;
      case 4:
        title = country != 0 ? "hotels" : "AD5";
        break;
      case 1:
        title = country != 0 ? "restaurants" : "FD6";
        break;
    }
    return title;
  };
  const handleTitle = (e: number) => {
    let title = "";
    switch (e) {
      case 0:
        title = "여행지";
        break;
      case 4:
        title = "숙소";
        break;
      case 1:
        title = "식당/카페";
        break;
    }
    return title;
  };
  const { open } = useToast();
  const navigation = useNavigation();
  useEffect(() => {
    getRecommendList();
  }, []);
  const handleAdd = (e: number) => {
    let copy = [...params?.data];
    let copy2 = [...params?.data[params?.day]];
    copy2[params?.index] = {
      ...copy2[params?.index],
      name: recommendList[e]?.place_name ?? recommendList[e]?.name,
      lat: recommendList[e]?.lat ?? recommendList[e]?.y,
      lng: recommendList[e]?.lng ?? recommendList[e]?.x,
    };
    copy[params?.day] = copy2;
    if (copy2[params?.index]?.category == 4) {
      let copy3 = [...params?.data[params?.day + 1]];
      if (copy3[0]?.category == 4) {
        copy3[0] = {
          ...copy3[0],
          name: recommendList[e]?.place_name ?? recommendList[e]?.name,
          lat: recommendList[e]?.lat ?? recommendList[e]?.y,
          lng: recommendList[e]?.lng ?? recommendList[e]?.x,
        };
        copy[params?.day + 1] = copy3;
      }
    }
    // setSaveData(copy);
    params?.setModify(true);
    params?.setCopyTimetable(copy);
    open(
      `${handleTitle(
        params?.data[params?.day][params?.index]?.category
      )}를 추가했어요`,
      {
        icon: "icon-check-circle-green",
      }
    );
    navigation?.goBack();
  };
  const [recommendList, setRcommendList] = useState([]);
  const getRecommendList = async () => {
    try {
      const tableData = params?.data[params?.day][params?.index - 1];
      let result = await dispatch(
        country != 0
          ? recommendTripadvisor({
              category: handleCategory(
                params?.data[params?.day][params?.index]?.category
              ),
              lat: tableData?.lat ?? regionInfo.lat,
              lng: tableData?.lng ?? regionInfo.lng,
              radius: 10000,
              name: tableData?.name ?? region[0].split("/").at(-1),
            })
          : recommendApi({
              category: handleCategory(
                params?.data[params?.day][params?.index]?.category
              ),
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
                category: handleCategory(
                  params?.data[params?.day][params?.index]?.category
                ),
                lat: tableData?.lat ?? regionInfo.lat,
                lng: tableData?.lng ?? regionInfo.lng,
                radius: 20000,
                name: params?.data[params?.day][params?.index]?.name ?? "",
              })
            : recommendApi({
                category: handleCategory(
                  params?.data[params?.day][params?.index]?.category
                ),
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
      //   dispatch(LoadingSliceActions.offLoading());
    }
  };
  const bottomSheet = useBottomSheet();
  const handleCheck = (e: number) => {
    bottomSheet.open({
      children: (
        <>
          <Text
            typography="t4"
            fontWeight="bold"
            color={colors.grey800}
            style={{ alignSelf: "center" }}
          >
            {recommendList[e]?.place_name ?? recommendList[e]?.name}를
            추가하시겠습니까?
          </Text>
          <Text
            typography="t5"
            fontWeight="regular"
            color={colors.grey600}
            style={{ textAlign: "center" }}
          >
            추가된 후 수정모드로 바뀌어요!
          </Text>
          <BottomSheet.CTA.Double
            leftButton={
              <Button
                type="dark"
                style="weak"
                display="block"
                onPress={() => {
                  bottomSheet.close();
                }}
              >
                {"취소"}
              </Button>
            }
            rightButton={
              <Button
                type="primary"
                style="fill"
                display="block"
                onPress={() => {
                  bottomSheet.close();
                  handleAdd(e);
                }}
              >
                {"선택하기"}
              </Button>
            }
          ></BottomSheet.CTA.Double>
        </>
      ),
    });
  };
  //   const [saveDate, setSaveData] = useState(params?.data);
  return (
    <View style={{ flex: 1 }}>
      {/* <CustomMapViewMarker
        presetData={saveDate}
        selectedIndex={params?.day}
        isWideZoom={false}
      /> */}
      <ScrollView>
        {recommendList.map((item, idx) => {
          return (
            <ListRow
              onPress={() => {
                handleCheck(idx);
                //   showHourBottomSheet(item);
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
      </ScrollView>
    </View>
  );
}
