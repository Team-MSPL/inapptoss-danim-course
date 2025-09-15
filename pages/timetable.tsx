import {
    Button,
    colors,
    FixedBottomCTA,
    FixedBottomCTAProvider,
    ListRow,
    PartnerNavigation,
    Tab,
    useBottomSheet,
    useToast,
} from "@toss-design-system/react-native";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import {
    BedrockRoute,
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
import {defaultTimetableItem, TimetableDay, TimetableState} from "../components/timetable/type";
import {SaveBottomSheet} from "../components/timetable/SaveBottomSheet";
import {EditButton} from "../components/timetable/EditButton";
import {DayList} from "../components/timetable/DayList";
import {RemoveBottomSheet} from "../components/timetable/RemoveBottomSheet";
import {HourBottomSheetContent} from "../components/timetable/HourBottomSheet";

export const Route = BedrockRoute("/timetable", {
    validateParams: (params) => params,
    component: Timetable,
});

function Timetable() {
    //Redux
    const {
        nDay, day, travelName, timetable, userId, region,
        transit, tendency, travelId,
    } = useAppSelector(state => state.travelSlice);

    const dispatch = useAppDispatch();
    const navigation = useNavigation();
    const bottomSheet = useBottomSheet();
    const backEvent = useBackEvent();
    const openToast = useToast().open;

    //Local
    const [tabValue, setTabValue] = useState<string>("0");
    const [timeOutVisible, setTimeOutVisible] = useState<boolean>(true);
    const [modify, setModify] = useState<boolean>(false);
    const [tooltips, setTooltips] = useState<{ day: number; index: number; status: boolean }>({ day: 0, index: 0, status: false });
    const [copyTimetable, setCopyTimetable] = useState<TimetableState>(timetable);

    const scrollRef = useRef<FlatList<any>>(null);

    const showSaveSheet = navigation.getState()?.routes.at(-2)?.name !== "/my-travle-list";

    useEffect(() => {
        if (showSaveSheet) {
            const handler = () => bottomSheet.open({
                children: <SaveBottomSheet onSave={firstSave} navigation={navigation} bottomSheet={bottomSheet} />,
            });
            backEvent.addEventListener(handler);
            return () => backEvent.removeEventListener(handler);
        }
        return;
    }, [backEvent, showSaveSheet, bottomSheet, navigation]);

    const [showTooltip, setShowTooltip] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowTooltip(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems?.length > 0) {
            setTabValue(String(viewableItems[0].index));
        }
    });

    const handleRemove = () => {
        const updatedTimetable = [...copyTimetable];
        updatedTimetable[tooltips.day] =
            (updatedTimetable[tooltips.day] || []).filter((_, idx) => idx !== tooltips.index);
        setCopyTimetable(updatedTimetable);
        setTooltips(prev => ({ ...prev, status: false }));
    };

    const goModify = (newHour: number) => {
        const dayArr = copyTimetable[tooltips.day];
        if (!dayArr) return; // dayArr이 없으면 종료

        const changeCopy = [...copyTimetable];
        const originalItem = dayArr[tooltips.index];
        if (!originalItem) return; // originalItem이 없으면 종료

        const originalTakenTime = originalItem.takenTime;
        const newTakenTime = newHour * 60;
        const diffMinutes = newTakenTime - originalTakenTime;

        const startMinute = (originalItem.y ?? 0) * 30;
        const newEndMinute = startMinute + newTakenTime;
        if (newEndMinute > 24 * 60) {
            openToast("24시 이전의 시간만 선택이 가능해요", { icon: "icon-warning-circle" });
            return;
        }

        let updatedDayArr = [...dayArr];
        updatedDayArr[tooltips.index] = { ...originalItem, takenTime: newTakenTime };

        if (diffMinutes !== 0) {
            for (let i = tooltips.index + 1; i < updatedDayArr.length; i++) {
                const prevItem = updatedDayArr[i - 1];
                const item = updatedDayArr[i];
                if (!prevItem || !item) continue;

                const prevEndMinute = (prevItem.y ?? 0) * 30 + (prevItem.takenTime ?? 0);

                updatedDayArr[i] = {
                    ...item,
                    y: prevEndMinute / 30,
                    name: item.name ?? '',
                    takenTime: item.takenTime ?? 0,
                    category: item.category ?? 0,
                    formatted_address: item.formatted_address ?? ''
                };
            }
        }

        changeCopy[tooltips.day] = updatedDayArr;
        setCopyTimetable(changeCopy);
    };

    const firstSave = async () => {
        try {
            // 아래 safeTimetable 등은 타입이 명확해야 함!
            const safeTimetable: TimetableDay[] = timetable ?? [];
            if (travelId !== "") {
                // @ts-ignore -> Redux 타입선언 필요
                await dispatch(updateTravelCourse({
                    travelId: travelId ?? "",
                    timetable: safeTimetable
                }));
            } else {
                // @ts-ignore -> Redux 타입선언 필요
                await dispatch(saveTravel({
                    userId: userId ?? "",
                    region: region ?? [],
                    day: day ?? [],
                    nDay: typeof nDay === "number" ? nDay + 1 : 1,
                    transit: transit ?? 0,
                    timetable: safeTimetable,
                    tendency: tendency ?? [],
                    travelName: travelName || "신나는여행",
                }));
            }
        } catch {
            openToast("잠시후 다시 시도해주세요", { icon: "icon-warning-circle" });
        }
    };

    const handleModifySave = () => {
        dispatch(travelSliceActions.enrollTimetable(copyTimetable));
        setModify(false);
    };

    const handleRemoveCheck = () => {
        bottomSheet.open({
            children: (
                <RemoveBottomSheet
                    timetable={copyTimetable}
                    tooltips={tooltips}
                    onDelete={handleRemove}
                    bottomSheet={bottomSheet}
                />
            ),
        });
    };

    const showHourBottomSheet = () => {
        bottomSheet.open({
            children: (
                <HourBottomSheetContent
                    onConfirm={hour => {
                        goModify(hour);
                        bottomSheet.close();
                        setTooltips(prev => ({ ...prev, status: false }));
                    }}
                    placeState={copyTimetable[tooltips.day]?.[tooltips.index] ?? defaultTimetableItem}
                    onCancel={() => bottomSheet.close()}
                />
            ),
        });
    };

    const moveScroll = (e: string) => {
        scrollRef.current?.scrollToIndex({ index: Number(e), animated: false });
        setTabValue(e);
    };

    const screenHeight = Dimensions.get("window").height;

    const [itemLayouts, setItemLayouts] = useState<number[]>([]);
    const handleItemLayout = (event: any, idx: number) => {
        const { height } = event.nativeEvent.layout;
        setItemLayouts(prev => {
            const copy = [...prev];
            copy[idx] = height;
            return copy;
        });
    };

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        let sum = 0;
        let index = 0;
        for (let i = 0; i < itemLayouts.length; i++) {
            sum += itemLayouts[i] || 0;
            if (offsetY < sum) {
                index = i;
                break;
            }
        }
        setTabValue(String(index));
    };

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
                    fluid
                    size="large"
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
                    onScroll={handleScroll}
                    data={modify ? copyTimetable : timetable}
                    onScrollToIndexFailed={info => {
                        setTimeout(() => {
                            scrollRef.current?.scrollToIndex({ index: info.index, animated: true });
                        }, 500);
                    }}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged.current}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
                    renderItem={({ item, index }) => (
                        <DayList
                            dayItems={item}
                            dayIndex={index}
                            modify={modify}
                            tooltips={tooltips}
                            setTooltips={setTooltips}
                            copyTimetable={copyTimetable}
                            navigation={navigation}
                            showHourBottomSheet={showHourBottomSheet}
                            handleRemoveCheck={handleRemoveCheck}
                            setCopyTimetable={setCopyTimetable}
                            setModify={setModify}
                            onLayout={e => handleItemLayout(e, index)}
                        />
                    )}
                />
                {!modify && (
                    <EditButton onPress={() => setModify(true)} showTooltip={showTooltip}/>
                )}
                {modify && (
                    <FixedBottomCTA.Double
                        containerStyle={{ backgroundColor: "white" }}
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