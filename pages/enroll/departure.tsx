import { Checkbox, colors, Icon, ListRow } from '@toss-design-system/react-native';
import React, { MutableRefObject, useEffect, useRef } from 'react';
import { BedrockRoute } from 'react-native-bedrock';
import { useAppDispatch, useAppSelector } from 'store';
import { handleNearBySearch, travelSliceActions } from '../../redux/travle-slice';
import { cityViewList } from '../../utill/city-list';
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
import { Dimensions, TouchableOpacity } from 'react-native';

export const Route = BedrockRoute('/enroll/departure', {
  validateParams: (params) => params,
  component: Departure,
});

function Departure() {
  const {
    cityIndex,
    country,
    region,
    departureAirport,
    departureTrain,
    departureSelected,
    departure,
  } = useAppSelector((staet) => staet.travelSlice);
  const dispatch = useAppDispatch();
  const handleNearBySearchApi = async () => {
    try {
      const e = await dispatch(
        handleNearBySearch({
          region: cityViewList[country][cityIndex].title + region[0],
          name: '공항',
        }),
      ).unwrap();
      dispatch(
        travelSliceActions.updateFiled({
          field: 'departureAirport',
          value: {
            name: e.data?.name,
            lat: e.data?.geometry.location.lat,
            lng: e.data?.geometry.location.lng,
          },
        }),
      );
      const e2 = await dispatch(
        handleNearBySearch({
          region: cityViewList[country][cityIndex].title + region[0],
          name: '고속철도',
        }),
      ).unwrap();
      dispatch(
        travelSliceActions.updateFiled({
          field: 'departureTrain',
          value: {
            name: e2.data?.name,
            lat: e2.data?.geometry.location.lat,
            lng: e2.data?.geometry.location.lng,
          },
        }),
      );
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    handleNearBySearchApi();
  }, [cityIndex]);

  const moveList = [
    {
      name: '공항',
      text: departureAirport,
      title: 'departureAirport',
      icon: 'https://static.toss.im/2d-emojis/png/4x/u1F6EC.png',
    },
    {
      name: '기차역',
      text: departureTrain,
      title: 'departureTrain',
      icon: 'icon-train-mono',
    },
  ];
  // const autocompleteRef = useRef<GooglePlacesAutocompleteRef | null>();
  const autocompleteRef = useRef<GooglePlacesAutocompleteRef | null>();
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const INPUT_WIDTH = SCREEN_WIDTH - 24 * 2; // 양쪽 여백 24씩

  return (
    <>
      <GooglePlacesAutocomplete
        placeholder="지역을 검색해보세요"
        disableScroll={false}
        enablePoweredByContainer={false}
        keepResultsAfterBlur={true}
        ref={autocompleteRef as MutableRefObject<GooglePlacesAutocompleteRef | null>}
        query={{
          key: import.meta.env.GOOGLE_API_KEY,
          language: 'ko',
        }}
        textInputProps={{
          placeholderTextColor: colors.grey500,
          allowFontScaling: false,
        }}
        renderLeftButton={() => <Icon name="icon-search-mono" />}
        styles={{
          container: { alignItems: 'center' },
          textInputContainer: {
            width: INPUT_WIDTH,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.grey100,
            alignItems: 'center',
            paddingLeft: 20,
          },
          listView: { width: INPUT_WIDTH, maxHeight: 250, zIndex: 1000 },
          textInput: {
            position: 'relative',
            top: 2,
            color: colors.grey500,
            backgroundColor: 'transparent',
            fontSize: 16,
            height: 44,
            alignSelf: 'center',
            lineHeight: 22,
            paddingVertical: 0,
            textAlignVertical: 'center',
            paddingTop: 0,
            paddingBottom: 0,
          },
          description: { color: 'black' },
        }}
        fetchDetails={true}
        onPress={async (data, details) => {
          dispatch(
            travelSliceActions.setDeparture({
              search: true,
              name: details?.name,
              lat: details?.geometry.location.lat,
              lng: details?.geometry.location.lng,
            }),
          );
          dispatch(
            travelSliceActions.setDepartureSelected(
              'departure' == departureSelected ? '' : 'departure',
            ),
          );
        }}
        onFail={(error) => console.log(error)}
        onNotFound={() => console.log('no results')}
      ></GooglePlacesAutocomplete>

      {/* 
onPress={() => {
								dispatch(
									travelSliceActions.setDepartureSelected(
										'departure' == departureSelected ? '' : 'departure',
									),
								);
							}}

               */}
      {departure.name != '' && (
        <ListRow
          left={
            <ListRow.Icon
              name="icon-search-mono"
              style={{
                backgroundColor: colors.grey100,
              }}
              color="#93C9FF"
              type="border"
            />
          }
          right={
            <Checkbox.Line
              checked={'departure' == departureSelected}
              onPress={() => {
                dispatch(
                  travelSliceActions.setDepartureSelected(
                    'departure' == departureSelected ? '' : 'departure',
                  ),
                );
              }}
            />
          }
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top={departure.name}
              topProps={{
                typography: 't5',
                fontWeight: 'medium',
                color: colors.grey800,
              }}
            />
          }
        />
      )}

      {moveList.map((item, index) => {
        return (
          <TouchableOpacity
            onPress={() => {
              dispatch(
                travelSliceActions.setDepartureSelected(
                  departureSelected == item.title ? '' : item.title,
                ),
              );
            }}
          >
            <ListRow
              left={
                item.icon.includes('icon') ? (
                  <ListRow.Icon
                    name={item.icon}
                    style={{
                      backgroundColor: colors.grey100,
                    }}
                    color="#93C9FF"
                    type="border"
                  />
                ) : (
                  <ListRow.Image
                    type="circle"
                    style={{
                      backgroundColor: colors.grey100,
                      padding: 8,
                    }}
                    source={{ uri: item.icon }}
                  />
                )
              }
              right={
                item.text.name != '' && <Checkbox.Line checked={item.title == departureSelected} />
              }
              contents={
                <ListRow.Texts
                  type="1RowTypeA"
                  top={item.text.name == '' ? `근처 ${item.name}을 찾지 못했어요 ` : item.text.name}
                  topProps={{
                    typography: 't5',
                    fontWeight: 'medium',
                    color: item.text.name == '' ? colors.grey600 : colors.grey800,
                  }}
                />
              }
            />
          </TouchableOpacity>
        );
      })}
    </>
  );
}
