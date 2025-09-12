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
    PartnerNavigation,
    Tab,
    Text,
    useBottomSheet,
    useToast,
} from "@toss-design-system/react-native";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import {
    BedrockRoute,
    closeView,
    Stack,
    useBackEvent,
    useNavigation,
} from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import CustomMapViewMarker from "../components/map-view-marker";
import { FlatList } from "@react-native-bedrock/native/react-native-gesture-handler";
import {
    saveTravel,
    travelSliceActions,
    updateTravelCourse,
} from "../redux/travle-slice";

const categoryTitle = [
    "여행지", "식당", "", "카페", "숙소", "필수여행지", "여행 시작", "여행 종료",
];

const categoryColor = [
    "green", "yellow", "", "yellow", "red", "green", "blue", "blue",
];

export const Route = BedrockRoute("/timetable", {
    validateParams: (params) => params,
    component: Timetable,
});

function Timetable() {
    const {
        nDay, day, travelName, timetable, userId, region,
        transit, tendency, travelId,
    } = useAppSelector(state => state.travelSlice);
    const dispatch = useAppDispatch();
    const navigation = useNavigation();
    const bottomSheet = useBottomSheet();
    const backEvent = useBackEvent();
    const openToast = useToast().open;

    const [tabValue, setTabValue] = useState("0");
    const scrollRef = useRef(null);
    const [timeOutVisible, setTimeOutVisible] = useState(true);
    const [modify, setModify] = useState(false);
    const [tooltips, setTooltips] = useState({ day: 0, index: 0, status: false });
    const [copyTimetable, setCopyTimetable] = useState(timetable);

    const [handler, setHandler] = useState<{ callback: () => void } | undefined>(
        navigation.getState()?.routes.at(-2)?.name === "/my-travle-list"
            ? undefined
            : {
                callback: () =>
                    bottomSheet.open({
                        children: (
                            <>
                                <Text
                                    typography="t4"
                                    fontWeight="bold"
                                    color={colors.grey800}
                                    style={{ alignSelf: "center", marginTop: 35 }}
                                >
                                    일정을 저장할까요?
                                </Text>
                                <Text
                                    typography="t5"
                                    fontWeight="regular"
                                    color={colors.grey600}
                                    style={{ textAlign: "center" }}
                                >
                                    저장된 일정은 오른쪽 상단 {"\n"}비행기 아이콘에서 볼 수 있어요.
                                </Text>
                                <BottomSheet.CTA.Double
                                    leftButton={
                                        <Button type="dark" style="weak" display="block" onPress={closeView}>
                                            나가기
                                        </Button>
                                    }
                                    rightButton={
                                        <Button
                                            type="primary"
                                            style="fill"
                                            display="block"
                                            onPress={() => {
                                                bottomSheet.close();
                                                firstSave();
                                                navigation.reset({ index: 0, routes: [{ name: "/" }] });
                                            }}
                                        >
                                            저장 후 나가기
                                        </Button>
                                    }
                                />
                            </>
                        ),
                    }),
            }
    );

    useEffect(() => {
        if (handler?.callback) {
            backEvent.addEventListener(handler.callback);
            return () => backEvent.removeEventListener(handler.callback);
        }
        return;
    }, [backEvent, handler]);

    useEffect(() => {
        const timer = setTimeout(() => setTimeOutVisible(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    const onViewableItemsChanged = useRef(items => {
        setTabValue(String(items?.changed[0]?.index));
    });

    const handleRemove = () => {
        const copy = [...copyTimetable];
        copy[tooltips.day] = copy[tooltips.day]?.filter((_, idx) => idx !== tooltips.index);
        setCopyTimetable(copy);
        setTooltips(prev => ({ ...prev, status: false }));
    };

    const goModify = (e: number) => {
        const dayArr = copyTimetable[tooltips.day];
        const changeCopy = [...copyTimetable];
        const originalItem = dayArr[tooltips.index];

        const originalTakenTime = originalItem.takenTime;
        const newTakenTime = e * 60;
        const diffMinutes = newTakenTime - originalTakenTime;
        const newItem = {
            ...originalItem,
            takenTime: newTakenTime,
        };

        // 24시 이전까지만 허용
        const startMinute = (originalItem.y ?? 0) * 30;
        const newEndMinute = startMinute + newTakenTime;
        if (newEndMinute > 24 * 60) {
            openToast(`24시 이전의 시간만 선택이 가능해요`, { icon: "icon-warning-circle" });
            return;
        }


        let updatedDayArr = [...dayArr];
        updatedDayArr[tooltips.index] = newItem;

        if (diffMinutes !== 0) {
            for (let i = tooltips.index + 1; i < updatedDayArr.length; i++) {
                const prevItem = updatedDayArr[i - 1];
                const item = updatedDayArr[i];
                // y는 30분 단위 인덱스
                // 각 item의 y를 이전 item의 끝 다음(분)으로 맞추고, 기존 takenTime은 유지
                const prevEndMinute = (prevItem.y ?? 0) * 30 + prevItem.takenTime;
                updatedDayArr[i] = {
                    ...item,
                    y: prevEndMinute / 30,
                };
            }
        }

        changeCopy[tooltips.day] = updatedDayArr;
        setCopyTimetable(changeCopy);
    };

    const firstSave = async () => {
        try {
            if (travelId !== "") {
                await dispatch(updateTravelCourse({ travelId, timetable }));
            } else {
                await dispatch(saveTravel({
                    userId, region, day: day.slice(0, nDay + 1), nDay: nDay + 1, transit,
                    timetable, tendency, travelName: travelName || "신나는여행",
                }));
            }
        } catch (err) {
            openToast(`잠시후 다시 시도해주세요`, { icon: "icon-warning-circle" });
        }
    };

    const handleModifySave = () => {
        dispatch(travelSliceActions.enrollTimetable(copyTimetable));
        setModify(false);
    };

    const handleRemoveCheck = () => {
        bottomSheet.open({
            children: (
                <>
                    <Text
                        typography="t4"
                        fontWeight="bold"
                        color={colors.grey800}
                        style={{
                            alignSelf: "center",
                            marginHorizontal: 40,
                            textAlign: "center",
                        }}
                    >
                        '{copyTimetable[tooltips.day][tooltips.index]?.name}'일정을 삭제할까요?
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
                            <Button type="dark" style="weak" display="block" onPress={() => bottomSheet.close()}>
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
                    />
                </>
            ),
        });
    };

    const showHourBottomSheet = () => {
        bottomSheet.open({
            children: (
                <HourBottomSheetContent
                    onConfirm={e => {
                        goModify(e);
                        bottomSheet.close();
                        setTooltips(prev => ({ ...prev, status: false }));
                    }}
                    placeState={copyTimetable[tooltips.day][tooltips.index]}
                    onCancel={() => bottomSheet.close()}
                />
            ),
        });
    };

    const moveScroll = (e) => {
        scrollRef.current?.scrollToIndex({ index: Number(e), animated: false });
        setTabValue(e);
    };

    const screenHeight = Dimensions.get("window").height;

    const renderItem = ({ item, index }) => (
        <Stack.Vertical
            style={{
                position: "relative",
                borderRadius: 13,
                paddingVertical: 20,
                marginTop: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.grey200,
            }}
        >
            {item?.map((value, idx) => (
                <View key={idx}>
                    <ListRow
                        onPress={() => {
                            if (!modify && value?.name?.includes("추천")) {
                                navigation.navigate("/recommend-place", {
                                    data: copyTimetable, day: index, index: idx,
                                    setCopyTimetable, setModify,
                                });
                            } else {
                                setTooltips({ day: index, index: idx, status: !tooltips.status });
                            }
                        }}
                        left={
                            !value?.name?.includes("추천") ? (
                                <ListRow.Icon
                                    name={`icon-number-${
                                        item.filter(fil => !fil.name?.includes("추천"))
                                            .findIndex(find => find.name === value?.name) + 1
                                    }-square`}
                                />
                            ) : (
                                <ListRow.Icon name={`icon-number--1-squar`} />
                            )
                        }
                        contents={
                            <ListRow.Texts
                                type="2RowTypeA"
                                top={
                                    `${Math.floor(((value.y ?? 0) * 30 + 360) / 60)}:` +
                                    `${String(((value.y ?? 0) * 30 + 360) % 60).padStart(2, "0")}` +
                                    " ~ " +
                                    (Math.floor((((value.y ?? 0) + value.takenTime / 30) * 30 + 360) / 60) < 25
                                        ? `${Math.floor((((value.y ?? 0) + value.takenTime / 30) * 30 + 360) / 60)}:` +
                                        `${String((((value.y ?? 0) + value.takenTime / 30) * 30 + 360) % 60).padStart(2, "0")}`
                                        : "")
                                }
                                bottom={value?.name}
                                topProps={{ color: colors.grey800 }}
                                bottomProps={{ color: colors.grey600 }}
                            />
                        }
                        right={
                            modify ? (
                                <ListRow.Icon name="icon-dots-mono" />
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
                    {tooltips.status && tooltips.day === index && tooltips.index === idx && (
                        <View
                            style={{
                                position: "absolute", right: 30, width: 182, gap: 10,
                                borderRadius: 12, backgroundColor: colors.white,
                                borderWidth: 1, borderColor: colors.grey100, padding: 10,
                            }}
                        >
                            <Text
                                typography="t5"
                                fontWeight="medium"
                                color={colors.grey700}
                                onPress={showHourBottomSheet}
                            >
                                편집
                            </Text>
                            <Text
                                typography="t5"
                                fontWeight="medium"
                                color={colors.grey700}
                                onPress={handleRemoveCheck}
                            >
                                삭제
                            </Text>
                        </View>
                    )}
                    {modify && value?.category !== 4 && (
                        <ListRow
                            onPress={() => {
                                navigation.navigate("/add-place", {
                                    day: index, index: idx, data: copyTimetable, setCopyTimetable,
                                });
                            }}
                            left={<ListRow.Icon name="icon-plus-circle-blue" />}
                            contents={
                                <ListRow.Texts
                                    type="1RowTypeA"
                                    top="일정 추가하기"
                                    topProps={{ color: colors.grey800 }}
                                />
                            }
                        />
                    )}
                </View>
            ))}
        </Stack.Vertical>
    );

    return (
        <View style={{ flex: 1 }}>
            <PartnerNavigation
                title="가고싶은 여행코스 AI 추천"
                icon={{
                    source: {
                        uri: "https://static.toss.im/appsintoss/561/454aa293-9dc9-4c77-9662-c42d09255859.png",
                    },
                }}
            />
            <FixedBottomCTAProvider>
                {!modify && (
                    <>
                        <ListRow
                            contents={
                                <ListRow.Texts
                                    type="2RowTypeA"
                                    top={`${moment(day[0]).format("YYYY-MM-DD")} ~ ${moment(day[nDay]).format("YYYY-MM-DD")}`}
                                    bottom={travelName}
                                    topProps={{ color: colors.grey800, typography: "t7", fontWeight: "regular" }}
                                    bottomProps={{ color: colors.grey600, typography: "t5", fontWeight: "bold" }}
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
                    fluid size="large"
                    onChange={moveScroll}
                    value={tabValue}
                    style={{ marginTop: 5 }}
                >
                    {timetable.map((_, idx) => (
                        <Tab.Item key={idx} value={String(idx)}>
                            DAY {idx + 1}
                        </Tab.Item>
                    ))}
                </Tab>
                <FlatList
                    keyExtractor={(_, index) => index.toString()}
                    style={{ height: screenHeight * (modify ? 0.8 : 0.4) }}
                    ref={scrollRef}
                    onScrollBeginDrag={() => tooltips.status && setTooltips(prev => ({ ...prev, status: false }))}
                    data={modify ? copyTimetable : timetable}
                    onScrollToIndexFailed={info => {
                        setTimeout(() => {
                            scrollRef.current?.scrollToIndex({ index: info.index, animated: true });
                        }, 500);
                    }}
                    showsVerticalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged.current}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
                    renderItem={renderItem}
                />
                {timeOutVisible && (
                    <View
                        style={{
                            position: "absolute", right: 38, bottom: 148, padding: 20,
                            borderRadius: 12, backgroundColor: colors.white, elevation: 1,
                        }}
                    >
                        <Text typography="t6" fontWeight="bold" color={colors.grey800}>
                            수정하려면 클릭하세요
                        </Text>
                    </View>
                )}
                {!modify && (
                    <View
                        style={{
                            position: "absolute",
                            right: 30, bottom: 100, width: 48, height: 48,
                            borderRadius: 12, backgroundColor: colors.grey200,
                        }}
                    >
                        <IconButton
                            name="icon-pencil-mono"
                            variant="clear"
                            onPress={() => setModify(true)}
                        />
                    </View>
                )}
                {modify && (
                    <FixedBottomCTA.Double containerStyle={{ backgroundColor: "white" }}
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
                                               <Button display="block" onPress={handleModifySave}>
                                                   수정완료
                                               </Button>
                                           }
                    />
                )}
            </FixedBottomCTAProvider>
        </View>
    );
}

type HourBottomSheetContentProps = {
    initialHour?: number;
    onConfirm: (newHour: number) => void;
    onCancel: () => void;
    placeType?: string;
    placeState: any;
    maxHour?: number;
};

function HourBottomSheetContent({
                                    onConfirm,
                                    onCancel,
                                    placeState,
                                    maxHour = 4,
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
                        onNumberChange={setLocalHour}
                        maxNumber={maxHour}
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