import { Badge, colors, ListRow, Text, useToast } from '@toss-design-system/react-native';
import React from 'react';
import { View } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { useAppSelector } from 'store';

export const Route = createRoute('/enroll/essential', {
  validateParams: (params) => params,
  component: Essential,
});

export function Essential() {
  const { nDay, essentialPlaces, day, accommodations, timeLimitArray, minuteLimitArray } =
    useAppSelector((state) => state.travelSlice);
  const navigation = useNavigation();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const { open } = useToast();
  return (
    <>
      {[...Array(nDay + 1)].map((item, idx) => {
        const filteredPlaces = essentialPlaces.filter((place) => place?.day === idx + 1);

        return (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginHorizontal: 24,
              }}
            >
              <Text typography="t5" fontWeight="semibold" color={colors.grey700}>
                {'DAY' + (idx + 1)}
              </Text>
              <Text typography="t6" fontWeight="regular" color="#6B7684">
                {day[idx].format('YY.MM.DD') + ' (' + weekdays[day[idx].days()] + ')'}
              </Text>
            </View>

            {filteredPlaces.map((data, index) => {
              const refKey = `${idx}_${index}_key`;
              return (
                <ListRow
                  key={refKey}
                  contents={
                    <ListRow.Texts
                      type="1RowTypeA"
                      top={data?.name}
                      topProps={{
                        typography: 't5',
                        fontWeight: 'semibold',
                        color: colors.grey800,
                      }}
                    />
                  }
                  right={
                    <Badge size="small" type={'green'} badgeStyle="weak" fontWeight="bold">
                      {'여행지'}
                    </Badge>
                  }
                />
              );
            })}
            {accommodations[idx + 1].name && (
              <ListRow
                contents={
                  <ListRow.Texts
                    type="1RowTypeA"
                    top={accommodations[idx + 1].name}
                    topProps={{
                      typography: 't5',
                      fontWeight: 'semibold',
                      color: colors.grey800,
                    }}
                  />
                }
                right={
                  <Badge size="small" type={'red'} badgeStyle="weak" fontWeight="bold">
                    {'숙소'}
                  </Badge>
                }
              />
            )}
            <ListRow
              onPress={() => {
                if (accommodations[idx + 1]?.name != '' && filteredPlaces.length == 3) {
                  open('숙소는 1개, 여행지는 3개까지 추가 할 수 있어요.', {
                    icon: 'icon-warning-circle',
                  });
                } else {
                  navigation.navigate('/enroll/essential-search', { idx: idx });
                }
              }}
              left={
                <ListRow.Icon
                  name="icon-plus-mono"
                  style={{
                    backgroundColor: colors.grey100,
                  }}
                  color={colors.blue500}
                  type="border"
                />
              }
              right={<ListRow.Icon name="icon-arrow-right-mono" color={colors.grey400} />}
              contents={
                <ListRow.Texts
                  type="1RowTypeA"
                  top={'추가하기'}
                  topProps={{
                    typography: 't5',
                    fontWeight: 'medium',
                    color: colors.grey800,
                  }}
                />
              }
            />
          </>
        );
      })}
    </>
  );
}
