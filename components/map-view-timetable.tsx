import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import WebView from '@granite-js/native/react-native-webview';
import { cityViewList } from '../utill/city-list';
import { useAppSelector } from 'store';

interface CustomMapViewProps {
  select: number;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
}

export default function CustomMapViewTimetable({
  select,
  onTouchStart,
  onTouchEnd,
}: CustomMapViewProps) {
  const { timetable, country, cityIndex } = useAppSelector((state) => state.travelSlice);
  const selectedRoute = timetable[select] || [];

  const filteredMarkers = selectedRoute.filter(
    (v) => v.name !== '점심 추천' && v.name !== '저녁 추천' && v.name !== '숙소 추천',
  );

  const markerCoordinates = filteredMarkers.map((v, idx) => ({
    lat: v.lat,
    lng: v.lng,
    category: v.category,
    title: v.name,
  }));

  const polylineCoordinates = markerCoordinates.map((coord) => ({
    lat: coord.lat,
    lng: coord.lng,
  }));

  const fallbackLat = cityViewList[country]?.sub?.[cityIndex]?.lat ?? 37.5665;
  const fallbackLng = cityViewList[country]?.sub?.[cityIndex]?.lng ?? 126.978;

  const centerLat = markerCoordinates.length > 0 ? markerCoordinates[0].lat : fallbackLat;
  const centerLng = markerCoordinates.length > 0 ? markerCoordinates[0].lng : fallbackLng;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Map</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        html, body, #map {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }
      </style>
      <script src="https://maps.googleapis.com/maps/api/js?key=${import.meta.env.GOOGLE_API_KEY}"></script>
      <script>
        function initMap() {
          const center = { lat: ${centerLat}, lng: ${centerLng} };
          const map = new google.maps.Map(document.getElementById("map"), {
            center: center,
            zoom: 13,
            disableDefaultUI: true,
          });

          const routePath = new google.maps.Polyline({
            path: ${JSON.stringify(polylineCoordinates)},
            geodesic: true,
            strokeColor: "#3182F6",
            strokeOpacity: 1.0,
            strokeWeight: 3
          });
          routePath.setMap(map);

          const markerData = ${JSON.stringify(markerCoordinates)};
          markerData.forEach((data, idx) => {
            new google.maps.Marker({
              position: { lat: data.lat, lng: data.lng },
              map: map,
              title: data.title,
              label: {
                text: String(idx + 1),
                color: "white",
                fontSize: "12px",
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 13,
                fillColor: getCategoryColor(data.category),
                fillOpacity: 1,
                strokeWeight: 0,
              },
            });
          });

          function getCategoryColor(category) {
            switch (category) {
              case 1:
              case 3:
                return "#FFA500"; // Orange
              case 4:
                return "#FF69B4"; // Pink
              case 6:
              case 7:
                return "#3182F6"; // Blue
              default:
                return "#00A86B"; // Green default
            }
          }
        }
        window.onload = initMap;
      </script>
    </head>
    <body>
      <div id="map"></div>
    </body>
    </html>
  `;

  return (
    <View style={styles.wrapper} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.container}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flex: 1,
  },
  container: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.42,
  },
});
