import {
  Badge,
  BottomSheet,
  Button,
  colors,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  IconButton,
  ListRow,
  NumericSpinner,
  Tab,
  Text,
  Tooltip,
  useBottomSheet,
  useToast,
} from "@toss-design-system/react-native";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, View } from "react-native";
import {
  BedrockRoute,
  ImpressionArea,
  Stack,
  useNavigation,
} from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import CustomMapViewMarker from "../components/map-view-marker";
import { FlatList } from "@react-native-bedrock/native/react-native-gesture-handler";
import CustomMapViewTimetable from "../components/map-view-timetable";
import { travelSliceActions } from "../redux/travle-slice";

export const Route = BedrockRoute("/timetable", {
  validateParams: (params) => params,
  component: Timetable,
});

function Timetable() {
  const { nDay, day, travelName, timetable } = useAppSelector(
    (state) => state.travelSlice
  );
  const dispatch = useAppDispatch();
  const categoryTitle = [
    "여행지",
    "식당",
    "",
    "카페",
    "숙소",
    "필수여행지",
    "여행 시작",
    "여행 종료",
  ];
  const categoryColor = [
    "green",
    "yellow",
    "",
    "yellow",
    "red",
    "green",
    "blue",
    "blue",
  ];
  const [tabValue, setTabalue] = useState("0");
  const onViewableItemsChanged = useRef((items) => {
    setTabalue(String(items?.changed[0]?.index));
  });
  const scrollRef = useRef(null);
  const [timeOutVisible, setTiemOutVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setTiemOutVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  const [modify, setModify] = useState(false);
  const [tooltips, setTooltips] = useState({ day: 0, index: 0, status: false });
  const [copyTimetable, setCopyTimetable] = useState(timetable);
  const handleRemove = () => {
    let copy = [...copyTimetable];
    copy[tooltips.day] = copy[tooltips.day]?.filter(
      (item, idx) => idx != tooltips.index
    );
    setCopyTimetable(copy);
    setTooltips({ ...tooltips, status: false });
  };
  const navigation = useNavigation();
  const bottomSheet = useBottomSheet();
  const { open } = useToast();
  const goModify = (e: number) => {
    const newY = copyTimetable[tooltips?.day][tooltips?.index].y;
    const newEnd = newY + e / 0.5;
    console.log(newY, newEnd, e);
    if (newEnd >= 49) {
      open(`24시가 넘었습니다 다시 설정해주세요`, {
        icon: "icon-warning-circle",
      });
    } else {
      let copy = [...copyTimetable[tooltips?.day]];
      let changeCopy = [...copyTimetable];
      let changeFlag = null;
      for (let i = 0; i < copy.length; i++) {
        if (
          ((newY <= copy[i]?.y && newEnd > copy[i]?.y) ||
            (newY <= copy[i]?.y + copy[i].takenTime / 30 - 1 &&
              newEnd > copy[i]?.y + copy[i].takenTime / 30 - 1)) &&
          copy[i].id != copyTimetable[tooltips?.day][tooltips?.index]?.id
        ) {
          changeFlag = copy[i];
          break;
        }
      }
      let changeInputIndex = copy.findIndex((item) => item.y >= newY);
      changeInputIndex =
        changeInputIndex == -1 ? copy.length : changeInputIndex;
      if (changeFlag) {
        open(`${changeFlag.name}과 겹치는 시간입니다!`, {
          icon: "icon-warning-circle",
        });
      } else {
        let copyValue = {
          ...changeCopy[tooltips?.day][tooltips?.index],
          y: newY,
          x: tooltips?.day,
          takenTime: (newEnd - newY) * 30,
        };
        let deleteCopy = [...timetable[tooltips?.day]];
        deleteCopy.splice(tooltips?.index, 1);
        changeCopy[tooltips?.day] = deleteCopy;
        let addCopy = [...changeCopy[tooltips?.day]];
        addCopy.splice(changeInputIndex, 0, copyValue);
        changeCopy[tooltips?.day] = addCopy;
        console.log(changeCopy);
        setCopyTimetable(changeCopy);
        // dispatch(travelSliceActions.changeTimetable(changeCopy));
      }
    }
  };
  const showHourBottomSheet = () => {
    bottomSheet.open({
      children: (
        <HourBottomSheetContent
          onConfirm={(e: number) => {
            goModify(e);
            bottomSheet.close();
            setTooltips({ ...tooltips, status: false });
            // addPlace(newHour, datas);
            // 여기서 원하는 로직 추가 가능 (예: dispatch)
          }}
          placeState={copyTimetable[tooltips?.day][tooltips?.index]}
          onCancel={() => {
            bottomSheet.close();
          }}
        />
      ),
    });
  };
  const handleSave = () => {
    bottomSheet.open({
      children: (
        <>
          <Text
            typography="t4"
            fontWeight="bold"
            color={colors.grey800}
            style={{ alignSelf: "center" }}
          >
            일정을 저장할까요?
          </Text>
          <Text
            typography="t5"
            fontWeight="regular"
            color={colors.grey600}
            style={{ textAlign: "center" }}
          >
            저장된 일정은 오른쪽 상단 비행기 아이콘에서{`\n`} 볼 수 있어요.
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
                닫기
              </Button>
            }
            rightButton={
              <Button
                type="primary"
                style="fill"
                display="block"
                onPress={() => {
                  dispatch(travelSliceActions.enrollTimetable(copyTimetable));
                  setModify(false);
                  bottomSheet.close();
                }}
              >
                저장하기
              </Button>
            }
          ></BottomSheet.CTA.Double>
        </>
      ),
    });
  };
  const handleRemoveCheck = () => {
    bottomSheet.open({
      children: (
        <>
          <Text
            typography="t4"
            fontWeight="bold"
            color={colors.grey800}
            style={{ alignSelf: "center" }}
          >
            '{copyTimetable[tooltips?.day][tooltips?.index]?.name}'일정을
            삭제할까요?
          </Text>
          <Text
            typography="t5"
            fontWeight="regular"
            color={colors.grey600}
            style={{ textAlign: "center" }}
          >
            삭제한 일정은 나중에 직접 추가할 수 있어요.
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
                닫기
              </Button>
            }
            rightButton={
              <Button
                type="primary"
                style="fill"
                display="block"
                onPress={() => {
                  handleRemove();
                  bottomSheet.close();
                }}
              >
                삭제하기
              </Button>
            }
          ></BottomSheet.CTA.Double>
        </>
      ),
    });
  };
  const moveScroll = (e) => {
    scrollRef.current?.scrollToIndex({
      index: Number(e),
      animated: false,
    });
    setTabalue(e);
  };
  const screenHeight = Dimensions.get("window").height;
  const renderItem = ({ item, index }) => {
    return (
      <Stack.Vertical
        style={{
          position: "relative", // ← 이걸 추가
          borderRadius: 13,
          paddingVertical: 20,
          marginTop: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.grey200,
        }}
      >
        {item?.map((value, idx) => (
          <View>
            <ListRow
              onPress={() => {
                setTooltips({
                  day: index,
                  index: idx,
                  status: !tooltips?.status,
                });
              }}
              left={
                !value?.name?.includes("추천") ? (
                  <ListRow.Icon
                    name={`icon-number-${
                      item
                        ?.filter((filItem) => !filItem.name?.includes("추천"))
                        .findIndex((findItem) => findItem.name == value?.name) +
                      1
                    }-square`}
                  />
                ) : (
                  <ListRow.Icon name={`icon-number-${-1}-squar`}></ListRow.Icon>
                )
              }
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={
                    Math.floor(((value.y ?? 0) * 30 + 360) / 60) +
                    ":" +
                    String(((value.y ?? 0) * 30 + 360) % 60).padStart(2, "0") +
                    " ~ " +
                    (Math.floor(
                      (((value.y ?? 0) + value.takenTime / 30) * 30 + 360) / 60
                    ) < 25
                      ? Math.floor(
                          (((value.y ?? 0) + value.takenTime / 30) * 30 + 360) /
                            60
                        ) +
                        ":" +
                        String(
                          (((value.y ?? 0) + value.takenTime / 30) * 30 + 360) %
                            60
                        ).padStart(2, "0")
                      : "")
                  }
                  // bottom={calculateTendency(presetTendencyList[params.index])}
                  bottom={value?.name}
                  topProps={{ color: colors.grey800 }}
                  bottomProps={{ color: colors.grey600 }}
                />
              }
              right={
                modify ? (
                  <ListRow.Icon name="icon-dots-mono"></ListRow.Icon>
                ) : (
                  <Badge
                    size="small"
                    badgeStyle="weak"
                    type={categoryColor[value?.category ?? 0]}
                  >
                    {categoryTitle[value?.category ?? 0]}
                  </Badge>
                )
              }
            />
            {tooltips.status &&
              tooltips.day == index &&
              tooltips.index == idx && (
                <View
                  style={{
                    position: "absolute",
                    right: 30,
                    width: 182,
                    gap: 10,
                    borderRadius: 12,
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.grey100,
                    padding: 10,
                  }}
                >
                  <Text
                    typography="t5"
                    fontWeight="medium"
                    color={colors.grey700}
                    onPress={() => {
                      showHourBottomSheet();
                    }}
                  >
                    편집
                  </Text>
                  <Text
                    typography="t5"
                    fontWeight="medium"
                    color={colors.grey700}
                    onPress={() => {
                      handleRemoveCheck();
                    }}
                  >
                    삭제
                  </Text>
                </View>
              )}
            {modify && value?.category != 4 && (
              <ListRow
                onPress={() => {
                  navigation.navigate("/add-place", {
                    day: index,
                    index: idx,
                    data: copyTimetable,
                  });
                }}
                left={
                  <ListRow.Icon name={`icon-plus-circle-blue`}></ListRow.Icon>
                }
                contents={
                  <ListRow.Texts
                    type="1RowTypeA"
                    top={"일정 추가하기"}
                    topProps={{ color: colors.grey800 }}
                  />
                }
              />
            )}
          </View>
        ))}
      </Stack.Vertical>
    );
  };
  return (
    <View style={{ flex: 1 }}>
      <FixedBottomCTAProvider>
        {!modify && (
          <>
            <ListRow
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={
                    moment(day[0]).format("YYYY-MM-DD") +
                    " ~ " +
                    moment(day[nDay - 1]).format("YYYY-MM-DD")
                  }
                  // bottom={calculateTendency(presetTendencyList[params.index])}
                  bottom={travelName}
                  topProps={{
                    color: colors.grey800,
                    typography: "t7",
                    fontWeight: "regular",
                  }}
                  bottomProps={{
                    color: colors.grey600,
                    typography: "t5",
                    fontWeight: "bold",
                  }}
                />
              }
            />

            <CustomMapViewMarker
              presetData={timetable}
              selectedIndex={tabValue}
              isWideZoom={false}
            />
          </>
        )}
        <Tab
          fluid
          size="large"
          onChange={(e) => {
            moveScroll(e);
          }}
          value={tabValue}
          style={{ marginTop: 5 }}
        >
          {[
            ...Array.from({ length: timetable.length }, (item, index) => index),
          ].map((item, idx) => {
            return <Tab.Item value={String(idx)}>DAY {idx + 1}</Tab.Item>;
          })}
        </Tab>
        <FlatList
          keyExtractor={(_, index) => index.toString()}
          style={{ height: screenHeight * (modify ? 0.8 : 0.4) }}
          ref={scrollRef}
          // onTouchStart={() => {
          //   tooltips.status && setTooltips({ ...tooltips, status: false });
          // }}
          onScrollBeginDrag={() => {
            tooltips.status && setTooltips({ ...tooltips, status: false });
          }}
          data={modify ? copyTimetable : timetable}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              scrollRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            }, 500); // 일정 시간 후 재시도
          }}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 70, // 50% 이상 보이면 감지
          }}
          renderItem={renderItem}
        ></FlatList>
        {timeOutVisible && (
          <View
            style={{
              position: "absolute",
              right: 38,
              bottom: 148,
              padding: 20,
              borderRadius: 12,
              backgroundColor: colors.white,
              elevation: 1,
            }}
          >
            <Text typography="t6" fontWeight="bold" color={colors.grey800}>
              수정하려면 클릭하세요
            </Text>
            {/* <View
            style={{
              position: "absolute",
              right: 10,
              bottom: -5,
              backgroundColor: colors.white,
              borderLeftWidth: 8,
              borderTopWidth: 12,
              borderRightWidth: 8,
              borderBottomWidth: 0,
              borderTopColor: "white",
              borderRightColor: "transparent",
              borderLeftColor: "transparent",
              elevation: 1,
            }}
          ></View> */}
          </View>
        )}
        {!modify && (
          <View
            style={{
              position: "absolute",
              right: 30,
              bottom: 100,
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: colors.grey200,
            }}
          >
            <IconButton
              name="icon-pencil-mono"
              variant="clear"
              onPress={() => {
                setModify(true);
              }}
            />
          </View>
        )}
        {modify && (
          <FixedBottomCTA.Double
            leftButton={
              <Button
                type="dark"
                style="weak"
                display="block"
                onPress={() => {
                  setCopyTimetable(timetable);
                  setModify(false);
                }}
              >
                이전으로
              </Button>
            }
            rightButton={
              <Button
                display="block"
                onPress={() => {
                  handleSave();
                }}
              >
                저장하기
              </Button>
            }
          />
        )}
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
  onConfirm,
  onCancel,
  placeState,
}: HourBottomSheetContentProps) {
  const [localHour, setLocalHour] = useState(placeState?.takenTime / 60);

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

      <ListRow
        contents={<ListRow.Texts type="1RowTypeA" top="머무를 시간" />}
        right={
          <NumericSpinner
            size="large"
            number={localHour}
            onNumberChange={(e) => {
              setLocalHour(e);
            }}
            maxNumber={4}
            minNumber={1}
          />
        }
      />

      <BottomSheet.CTA.Double
        leftButton={
          <Button type="dark" style="weak" display="block" onPress={onCancel}>
            닫기
          </Button>
        }
        rightButton={
          <Button display="block" onPress={() => onConfirm(localHour)}>
            수정 완료
          </Button>
        }
      />
    </View>
  );
}
