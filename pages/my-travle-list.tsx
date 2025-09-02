import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import {
  BedrockRoute,
  Flex,
  Image,
  Lottie,
  useNavigation,
} from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import {
  getMyTravelList,
  getOneTravelCourse,
  getRegionInfo,
  travelSliceActions,
} from "../redux/travle-slice";
import {
  Asset,
  Badge,
  Button,
  colors,
  Icon,
  Text,
  Top,
  useToast,
} from "@toss-design-system/react-native";
import { FlatList } from "@react-native-bedrock/native/react-native-gesture-handler";
import moment from "moment";
import { cityViewList } from "../utill/city-list";

export const Route = BedrockRoute("/my-travle-list", {
  validateParams: (params) => params,
  component: MyTravleList,
});

function MyTravleList() {
  const dispatch = useAppDispatch();
  const [list, setList] = useState([]);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const { userId, userJwtToken } = useAppSelector((state) => state.travelSlice);
  const getTravelList = async () => {
    try {
      //아이디
      setLoading(true);
      console.log(userId);
      const data = await dispatch(getMyTravelList({ userId: userId })).unwrap();
      setList(data);
    } catch (err) {
      console.log("qq", err, userId);
      //   dispatch(travelSliceActions.setMyTravelList([]));
    } finally {
      setLoading(false);
      //   dispatch(LoadingSliceActions.offLoading());
    }
  };
  useEffect(() => {
    getTravelList();
  }, []);
  const { open } = useToast();
  const findCityFromPath = (path: string) => {
    const pathParts = path?.split("/");
    const targetCity = pathParts[2];
    const countryIndex = {
      Japan: 1,
      China: 2,
      Vietnam: 3,
      Tailand: 4,
      Philippines: 5,
      Singapore: 6,
    };
    for (const region of cityViewList[countryIndex[`${pathParts[1]}`]]) {
      for (const city of region.sub) {
        if (city.subTitle === targetCity) {
          console.log(region.title);
          if (region.title != "인기")
            return path?.replace(
              targetCity,
              `${region.title.normalize("NFD")} ${
                region?.eng?.normalize("NFD") ?? ""
              }${region?.eng ? " " : ""}!${targetCity}`
            );
        }
      }
    }
  };
  const goMyTravelDetail = async (e: any) => {
    try {
      const data = await dispatch(
        getOneTravelCourse({ travelId: e._id })
      ).unwrap();
      dispatch(
        getRegionInfo({
          region: data?.region[0].includes("해외")
            ? findCityFromPath(data?.region[0])
            : data.region[0].replace(
                /도심권| 동남권| 동북권|서남권|서북권|서귀포시|제주시'/g,
                "전체"
              ),
        })
      );
      navigation.navigate("/timetable");
    } catch (err) {
      console.log(err);
      open("코스 가져오던 중 문제가 생겼어요. 잠시후 시도해주세요");
    } finally {
      // dispatch(LoadingSliceActions.offLoading());
    }
  };
  const dDayCalculate = useCallback((e: any) => {
    //e.startDay=시작날짜e.endDay=끝나느날짜
    // 0~1 당일  -1 미래 1과거
    //여행 전, 여행 당일 ,여행 중, 여행 끝나는날, 여행 끝나고
    let startSign = Math.sign(
      moment.duration(moment(e.startDay).hours(0).diff(moment())).asDays()
    );
    let endSign = Math.sign(
      moment.duration(moment(e.endDay).hours(0).diff(moment())).asDays()
    );
    let result = "";
    let startStatus =
      moment.duration(moment(e.startDay).hours(0).diff(moment())).asDays() * -1;
    let endStatus =
      moment.duration(moment(e.endDay).hours(0).diff(moment())).asDays() * -1;
    let endFlag = false;
    if (startStatus > 0 && startStatus < 1) {
      result = "여행을 떠나는 날이에요";
    } else if (startSign == 1) {
      result =
        "여행가기" +
        Math.ceil(
          moment.duration(moment(e.startDay).hours(0).diff(moment())).asDays()
        ) +
        "일 전";
    } else if (startSign == -1 && endSign == 1) {
      result = "신나는 여행 중이에요!";
    } else if (endStatus > 0 && endStatus < 1) {
      result = "여행의 마지막 날이에요!";
    } else if (endSign == -1) {
      result =
        "여행 후" +
        (Math.floor(
          moment.duration(moment(e.endDay).hours(0).diff(moment())).asDays()
        ) +
          1) *
          -1 +
        "일";
      endFlag = true;
    }
    let data = { result: result, endFlag: endFlag };
    return data;
  }, []);
  const monthRef = useRef(moment().add(1, "month").format("MM"));
  const renderItem = (item: any) => {
    let after = monthRef.current;
    monthRef.current = moment(item.item.day[0]).format("MM");
    return (
      <>
        {(monthRef.current != after || item.index == 0) && (
          <Top.Root
            title={
              <Top.TitleParagraph typography="t7" color={colors.grey700}>
                {moment(item.item.day[item.item.nDay - 1]).format(
                  "YYYY년 MM월"
                )}
              </Top.TitleParagraph>
            }
          />
        )}
        <Pressable
          onPress={() => {
            goMyTravelDetail(item.item);
          }}
        >
          <Top.Root
            right={<Icon name="icon-arrow-right-mono" color={colors.grey400} />}
            title={
              <Top.TitleParagraph typography="t3">
                {item.item.travelName}
              </Top.TitleParagraph>
            }
            subtitle1={
              <Top.SubtitleParagraph
                typography="t7"
                color={colors.grey700}
                fontWeight="regular"
              >
                {moment(item.item.day[0]).format("YYYY년 MM월 DD일") +
                  " ~ " +
                  moment(item.item.day[item.item.nDay - 1]).format("MM월 DD일")}
              </Top.SubtitleParagraph>
            }
            subtitle2={
              <Top.SubtitleParagraph
                typography="t6"
                color={colors.blue600}
                fontWeight="medium"
              >
                {
                  dDayCalculate({
                    startDay: item.item.day[0],
                    endDay: item.item.day[item.item.nDay - 1],
                  }).result
                }
                {`\n`}
                <Badge type="teal" badgeStyle="weak">
                  {item.item.region[0].split("/").at(-1)}
                </Badge>
              </Top.SubtitleParagraph>
            }
          />
        </Pressable>
      </>
    );
  };

  return loading ? (
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
  ) : (
    <View>
      {list.length == 0 ? (
        <View style={{ top: 240 }}>
          <Top.Root
            upper={
              <Top.UpperAssetContent
                content={
                  <Image
                    style={{
                      width: 68,
                      height: 68,
                    }}
                    source={{
                      uri: "https://static.toss.im/2d-emojis/png/4x/u1F3DC.png",
                    }}
                  />
                }
              />
            }
            title={
              <Top.TitleParagraph typography="t3">
                지금 바로 여행 일정을 추천받아{`\n`}신나는 여행을 떠나보세요!
              </Top.TitleParagraph>
            }
            subtitle1={
              <Top.SubtitleParagraph
                typography="t7"
                color={colors.grey700}
                fontWeight="regular"
              >
                나그네님을 위한 일정이 곧 채워질 거에요
              </Top.SubtitleParagraph>
            }
          />
          <Button
            viewStyle={{ alignSelf: "center" }}
            size="tiny"
            style="weak"
            onPress={() => {
              dispatch(
                travelSliceActions.reset({
                  userId: userId,
                  userJwtToken: userJwtToken,
                })
              );
              navigation.replace("/enroll/title");
            }}
          >
            여행 일정 추천 받으러 가기
          </Button>
        </View>
      ) : (
        <FlatList
          data={list}
          renderItem={renderItem}
          initialNumToRender={20}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item?._id}
          nestedScrollEnabled
        ></FlatList>
      )}
    </View>
  );
}
