import {
  Button,
  colors,
  FixedBottomCTA,
  FixedBottomCTAProvider, Icon,
  ListRow,
  Tab,
  useBottomSheet,
  useToast,
} from '@toss-design-system/react-native';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, TouchableOpacity, View, Alert, StyleSheet } from 'react-native';
import { createRoute, useBackEvent, useNavigation } from '@granite-js/react-native';
import { useAppDispatch, useAppSelector } from 'store';
import CustomMapViewMarker from '../components/map-view-marker';
import { FlatList } from '@granite-js/native/react-native-gesture-handler';
import { saveTravel, travelSliceActions, updateTravelCourse } from '../redux/travle-slice';
import { defaultTimetableItem, TimetableDay, TimetableState } from '../components/timetable/type';
import { SaveBottomSheet } from '../components/timetable/save-bottom-sheet';
import { EditButton } from '../components/timetable/edit-button';
import { DayList } from '../components/timetable/DayList';
import { RemoveBottomSheet } from '../components/timetable/remove-bottom-sheet';
import { HourBottomSheetContent } from '../components/timetable/hour-bottom-sheet';
import ArrowToggleButton from '../components/timetable/arrow-toggle-button';
import axiosAuth from '../redux/api';

export const Route = createRoute('/timetable', {
  validateParams: (params) => params,
  component: Timetable,
});

function Timetable() {
  const { nDay, day, travelName, timetable, userId, region, transit, tendency, travelId } =
    useAppSelector((state) => state.travelSlice);

  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const bottomSheet = useBottomSheet();
  const backEvent = useBackEvent();
  const openToast = useToast().open;

  const [tabValue, setTabValue] = useState<string>('0');
  const [modify, setModify] = useState<boolean>(false);
  const [tooltips, setTooltips] = useState<{ day: number; index: number; status: boolean }>({
    day: 0,
    index: 0,
    status: false,
  });
  const [copyTimetable, setCopyTimetable] = useState<TimetableState>(timetable);
  const [showTooltip, setShowTooltip] = useState(true);

  const flatListRef = useRef<FlatList<any>>(null);

  const showSaveSheet = navigation.getState()?.routes.at(-2)?.name !== '/my-travle-list';

  const defaultHeight = (Dimensions.get('window').height * 240) / 812;
  const [isMapOpen, setIsMapOpen] = useState(true);
  const animatedHeight = useRef(new Animated.Value(defaultHeight)).current;

  useEffect(() => {
    if (showSaveSheet) {
      const handler = () =>
        bottomSheet.open({
          children: (
            <SaveBottomSheet
              onSave={firstSave}
              navigation={navigation}
              bottomSheet={bottomSheet}
              isBack={true}
            />
          ),
        });
      backEvent.addEventListener(handler);
      return () => backEvent.removeEventListener(handler);
    }
    return;
  }, [backEvent, showSaveSheet, bottomSheet, navigation]);

  useEffect(() => {
    setShowTooltip(true);
    const timer = setTimeout(() => setShowTooltip(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const [tabPressed, setTabPressed] = useState(false);

  const moveScroll = (e: string) => {
    setTabPressed(true);
    flatListRef.current?.scrollToIndex({ index: Number(e), animated: false });
    setTabValue(e);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (tabPressed) {
      setTabPressed(false);
      return;
    }
    if (viewableItems?.length > 0) {
      setTabValue(String(viewableItems[0].index));
    }
  });

  const handleRemove = () => {
    const updatedTimetable = [...copyTimetable];
    updatedTimetable[tooltips.day] = (updatedTimetable[tooltips.day] || []).filter(
      (_, idx) => idx !== tooltips.index,
    );
    setCopyTimetable(updatedTimetable);
    setTooltips((prev) => ({ ...prev, status: false }));
  };

  const goModify = (newHour: number) => {
    const dayArr = copyTimetable[tooltips.day];
    if (!dayArr) return;

    const changeCopy = [...copyTimetable];
    const originalItem = dayArr[tooltips.index];
    if (!originalItem) return;

    const originalTakenTime = originalItem.takenTime;
    const newTakenTime = newHour * 60;
    const diffMinutes = newTakenTime - originalTakenTime;

    const startMinute = (originalItem.y ?? 0) * 30;
    const newEndMinute = startMinute + newTakenTime;
    if (newEndMinute > 24 * 60) {
      openToast('24시 이전의 시간만 선택이 가능해요', { icon: 'icon-warning-circle' });
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
          formatted_address: item.formatted_address ?? '',
        };
      }
    }

    changeCopy[tooltips.day] = updatedDayArr;
    setCopyTimetable(changeCopy);
  };

  const firstSave = async () => {
    try {
      const safeTimetable: TimetableDay[] = timetable ?? [];
      if (travelId !== '') {
        // @ts-ignore
        await dispatch(
          updateTravelCourse({
            travelId: travelId ?? '',
            timetable: safeTimetable,
          }),
        );
      } else {
        // @ts-ignore
        await dispatch(
          saveTravel({
            userId: userId ?? '',
            region: region ?? [],
            day: day ?? [],
            nDay: typeof nDay === 'number' ? nDay + 1 : 1,
            transit: transit ?? 0,
            timetable: safeTimetable,
            tendency: tendency ?? [],
            travelName: travelName || '신나는여행',
          }),
        );
      }
    } catch {
      openToast('잠시후 다시 시도해주세요', { icon: 'icon-warning-circle' });
    }
  };

  const handleModifySave = () => {
    dispatch(travelSliceActions.enrollTimetable(copyTimetable));
    setModify(false);
    bottomSheet.open({
      children: (
        <SaveBottomSheet
          onSave={firstSave}
          navigation={navigation}
          bottomSheet={bottomSheet}
          isBack={false}
        />
      ),
    });
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
          onConfirm={(hour) => {
            goModify(hour);
            bottomSheet.close();
            setTooltips((prev) => ({ ...prev, status: false }));
          }}
          placeState={copyTimetable[tooltips.day]?.[tooltips.index] ?? defaultTimetableItem}
          onCancel={() => bottomSheet.close()}
        />
      ),
    });
  };

  const [itemLayouts, setItemLayouts] = useState<number[]>([]);
  const handleItemLayout = (event: any, idx: number) => {
    const { height } = event.nativeEvent.layout;
    setItemLayouts((prev) => {
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

  const handleToggleMapHeight = () => {
    const toValue = isMapOpen ? 0 : defaultHeight;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 350,
      useNativeDriver: false,
    }).start();
    setIsMapOpen(!isMapOpen);
  };

  const [setPressed] = useState(false);

  // deleting state for the "shopping bag" icon action
  const [deleting, setDeleting] = useState(false);

  // delete current travel and reset to main (index 0)
  const handleDeleteTravelAndExit = () => {
    if (!travelId) {
      openToast('삭제할 여행이 없습니다.', { icon: 'icon-warning-circle' });
      return;
    }

    Alert.alert(
      '삭제',
      '현재 일정을 삭제하시겠습니까? 삭제 후 메인 화면으로 이동합니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await axiosAuth.delete('/travelCourse/deleteTravelCourse', {
                data: { travelId },
              });
              openToast('여행이 삭제되었습니다.', { icon: 'icon-check-circle' });
              // reset navigation stack to main (index 0) — adjust route name if your main route is different
              navigation.reset({ index: 0, routes: [{ name: '/' }] });
            } catch (err) {
              console.error('deleteTravelCourse error', err);
              openToast('삭제 중 오류가 발생했습니다. 잠시후 다시 시도해주세요.', { icon: 'icon-warning-circle' });
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FixedBottomCTAProvider>
        <>
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={`${moment(day[0]).format('YYYY-MM-DD')} ~ ${moment(day[nDay]).format('YYYY-MM-DD')}`}
                bottom={travelName}
                topProps={{ color: colors.grey500, typography: 't7', fontWeight: 'regular' }}
                bottomProps={{ color: colors.grey900, typography: 't5', fontWeight: 'bold' }}
              />
            }
            right={
              <TouchableOpacity
                onPress={() => {
                  // if deletion in progress show toast / ignore
                  if (deleting) return;
                  handleDeleteTravelAndExit();
                }}
                style={styles.iconButton}
              >
                {deleting ? (
                  <Animated.View style={{ width: 24, height: 24 }} />
                ) : (
                  <ListRow.Icon name="icon-bin-mono" />
                )}
              </TouchableOpacity>
            }
          />
        </>
        <Animated.View style={{ height: animatedHeight, overflow: 'hidden' }}>
          <CustomMapViewMarker
            presetData={timetable}
            selectedIndex={tabValue}
            isWideZoom={false}
            height={null}
          />
        </Animated.View>
        <View>
          <View
            // this outer view is clickable to toggle map height via the arrow button,
            // keep ArrowToggleButton as before
            style={{
              width: Dimensions.get('window').width,
              height: 40,
              backgroundColor: 'white',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowToggleButton expanded={isMapOpen} onPress={handleToggleMapHeight} />
          </View>

          {/* NEW: recommend-product quick button inserted between the toggle and Tab as requested */}
          <View style={styles.recommendWrapper}>
            <Button
              display="block"
              style="weak"
              onPress={() => {
                // navigate to recommend-product with current region
                navigation.navigate('/recommend-product', { timetable });
              }}
            >
              이 코스에 필요한 옵션 살펴보기
            </Button>
          </View>

          <Tab fluid size="large" onChange={moveScroll} value={tabValue} style={{ marginTop: 5 }}>
            {timetable.map((_, idx) => (
              <Tab.Item key={idx} value={String(idx)}>
                DAY {idx + 1}
              </Tab.Item>
            ))}
          </Tab>
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              style={isMapOpen ? { flex: 1, height: 400 } : { flex: 1 }}
              keyExtractor={(_, index) => index.toString()}
              onScrollBeginDrag={() =>
                tooltips.status && setTooltips((prev) => ({ ...prev, status: false }))
              }
              onScroll={handleScroll}
              data={modify ? copyTimetable : timetable}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                }, 500);
              }}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged.current}
              viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
              renderItem={({ item, index }) => {
                if (__DEV__) {
                  // console.debug(`[Timetable] renderItem dayIndex=${index} itemsCount=${Array.isArray(item) ? item.length : 0}`);
                }

                return (
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
                    onLayout={(e) => handleItemLayout(e, index)}
                  />
                );
              }}
              ListFooterComponent={<View style={{ height: 200 }} />}
            />
          </View>
          {modify && (
            <FixedBottomCTA.Double
              containerStyle={{ backgroundColor: 'white' }}
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
                  저장하기
                </Button>
              }
            />
          )}
        </View>
      </FixedBottomCTAProvider>
      {!modify && (
        <EditButton
          onPress={() => {
            setShowTooltip(false);
            setModify(true);
          }}
          showTooltip={showTooltip}
        />
      )}
    </View>
  );
}

export default Timetable;

const styles = StyleSheet.create({
  recommendWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  iconButton: {
    padding: 8,
  },
});