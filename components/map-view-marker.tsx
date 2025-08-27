import WebView from "@react-native-bedrock/native/react-native-webview";
import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";

export default function CustomMapViewMarker({
  presetData,
  selectedIndex,
  isWideZoom = false,
}) {
  const selectedRoute = presetData[selectedIndex];

  const filteredMarkers = selectedRoute.filter(
    (v) =>
      v.name !== "점심 추천" && v.name !== "저녁 추천" && v.name !== "숙소 추천"
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

  const centerLat =
    polylineCoordinates.length > 0 ? polylineCoordinates[0].lat : 37.5665;
  const centerLng =
    polylineCoordinates.length > 0 ? polylineCoordinates[0].lng : 126.978;

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
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA_nsvAajvyiWj-FeJO6u1-yZYsOBkoPOk"></script>
        <script>
          function initMap() {
            const center = { lat: ${centerLat}, lng: ${centerLng} };
            const map = new google.maps.Map(document.getElementById("map"), {
              center: center,
              zoom: ${isWideZoom ? 9 : 12},
              disableDefaultUI: true,
            });

            // Draw polyline
            const routePath = new google.maps.Polyline({
              path: ${JSON.stringify(polylineCoordinates)},
              geodesic: true,
              strokeColor: "#3182F6",
              strokeOpacity: 1.0,
              strokeWeight: 3
            });
            routePath.setMap(map);

            // Draw markers
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
                  fillColor: data.category == 4 ? "#3182F6" : "#3182F6",
                  fillOpacity: 1,
                  strokeWeight: 0,
                },
              });
            });

         
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
    <WebView
      originWhitelist={["*"]}
      source={{ html: htmlContent }}
      style={styles.container}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: Dimensions.get("window").width,
    height: (Dimensions.get("window").height * 240) / 812,
  },
});
