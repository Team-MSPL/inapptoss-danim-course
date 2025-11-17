import WebView from '@granite-js/native/react-native-webview';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

export default function CustomMapViewMarker({
                                              presetData,
                                              selectedIndex,
                                              isWideZoom = false,
                                              height, // height prop (optional)
                                            }: {
  presetData: any;
  selectedIndex: number | string;
  isWideZoom?: boolean;
  height?: number | null;
}) {
  const selectedRoute = presetData[Number(selectedIndex)] ?? [];

  const filteredMarkers = selectedRoute.filter(
    (v: any) => v.name !== '점심 추천' && v.name !== '저녁 추천' && v.name !== '숙소 추천',
  );

  const markerCoordinates = filteredMarkers.map((v: any, idx: number) => ({
    lat: Number(v.lat),
    lng: Number(v.lng),
    category: v.category,
    title: v.name,
    index: idx + 1,
  }));

  // simplify polyline if there are many points (reduce rendering cost)
  const polylineCoordinates = (function (coords: any[]) {
    if (!coords || coords.length <= 300) return coords;
    // downsample uniformly to max 300 points
    const max = 300;
    const out = [];
    for (let i = 0; i < coords.length; i += Math.ceil(coords.length / max)) {
      out.push(coords[i]);
    }
    return out;
  })(markerCoordinates.map((coord: any) => ({ lat: coord.lat, lng: coord.lng })));

  // Fallback center (Seoul) if no coords
  const centerLat = polylineCoordinates.length > 0 ? polylineCoordinates[0].lat : 37.5665;
  const centerLng = polylineCoordinates.length > 0 ? polylineCoordinates[0].lng : 126.978;

  // Build HTML with performance-minded map initialization:
  // - minimal UI controls
  // - optimized markers (optimized: true)
  // - add markers in small chunks using requestIdleCallback / setTimeout to avoid blocking
  // - optional marker clustering for large counts
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Map</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            background: #ffffff;
            -webkit-tap-highlight-color: rgba(0,0,0,0);
          }
        </style>

        <script src="https://maps.googleapis.com/maps/api/js?key=${import.meta.env.GOOGLE_API_KEY}"></script>
        <!-- MarkerClusterer (lazy load only used if many markers) -->
        <script>
          // small helper: requestIdleCallback polyfill
          window.requestIdleCallback = window.requestIdleCallback || function (cb) {
            return setTimeout(function () {
              const start = Date.now();
              cb({
                didTimeout: false,
                timeRemaining: function () {
                  return Math.max(0, 50 - (Date.now() - start));
                }
              });
            }, 1);
          };

          function initMap() {
            try {
              const markerData = ${JSON.stringify(markerCoordinates)};
              const routeCoords = ${JSON.stringify(polylineCoordinates)};

              // temporary center while fitting bounds
              const tmpCenter = { lat: ${centerLat}, lng: ${centerLng} };

              const map = new google.maps.Map(document.getElementById("map"), {
                center: tmpCenter,
                zoom: ${isWideZoom ? 9 : 12},
                disableDefaultUI: true,
                gestureHandling: 'auto',
                clickableIcons: false,
                fullscreenControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                tilt: 0,
                styles: [] // keep default or inject lightweight style if needed
              });

              // draw simplified polyline (if points exist)
              if (routeCoords && routeCoords.length > 0) {
                const routePath = new google.maps.Polyline({
                  path: routeCoords,
                  geodesic: true,
                  strokeColor: "#3182F6",
                  strokeOpacity: 1.0,
                  strokeWeight: 3
                });
                routePath.setMap(map);
              }

              // build bounds
              const bounds = new google.maps.LatLngBounds();
              markerData.forEach(d => {
                bounds.extend(new google.maps.LatLng(Number(d.lat), Number(d.lng)));
              });

              // fit camera to bounds with padding. If only one marker, center it with reasonable zoom.
              if (markerData.length === 1) {
                map.setCenter(bounds.getCenter());
                map.setZoom(${isWideZoom ? 10 : 14});
              } else if (markerData.length > 1) {
                const padding = { top: 40, right: 40, bottom: 120, left: 40 };
                try {
                  map.fitBounds(bounds, padding);
                } catch (e) {
                  // fallback to manual center if fitBounds fails
                  map.setCenter(bounds.getCenter());
                }
                google.maps.event.addListenerOnce(map, 'idle', function() {
                  const maxZoom = 16;
                  if (map.getZoom() > maxZoom) map.setZoom(maxZoom);
                });
              } else {
                map.setCenter(tmpCenter);
              }

              // marker creation optimized: add in chunks to avoid blocking UI thread
              function createMarker(d, idx) {
                return new google.maps.Marker({
                  position: { lat: Number(d.lat), lng: Number(d.lng) },
                  map: map,
                  title: d.title || '',
                  optimized: true,
                  label: {
                    text: String(d.index || (idx + 1)),
                    color: "white",
                    fontSize: "12px"
                  },
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#3182F6",
                    fillOpacity: 1,
                    strokeWeight: 0
                  }
                });
              }

              // If many markers, lazy-load markerclusterer script and use clustering
              const CLUSTER_THRESHOLD = 80;
              if (markerData.length >= CLUSTER_THRESHOLD) {
                // dynamic script load
                var s = document.createElement('script');
                s.src = 'https://unpkg.com/@googlemaps/markerclustererplus@4.0.1/dist/markerclustererplus.min.js';
                s.onload = function() {
                  // add markers in chunks and cluster them
                  const allMarkers = [];
                  let i = 0;
                  function addChunk() {
                    const end = Math.min(i + 16, markerData.length);
                    for (; i < end; i++) {
                      try {
                        const m = createMarker(markerData[i], i);
                        allMarkers.push(m);
                      } catch(e) { /* ignore single marker errors */ }
                    }
                    if (i < markerData.length) {
                      requestIdleCallback(addChunk);
                    } else {
                      // create clusterer
                      try {
                        new MarkerClusterer(map, allMarkers, { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });
                      } catch (e) {
                        // fallback: just leave markers if clusterer fails
                      }
                    }
                  }
                  addChunk();
                };
                document.head.appendChild(s);
              } else {
                // small number of markers: add in smaller chunks to avoid blocking
                const markers = [];
                let i = 0;
                function addChunkSmall() {
                  const end = Math.min(i + 12, markerData.length);
                  for (; i < end; i++) {
                    try {
                      const m = createMarker(markerData[i], i);
                      markers.push(m);
                    } catch (e) { /* ignore marker errors */ }
                  }
                  if (i < markerData.length) {
                    requestIdleCallback(addChunkSmall);
                  }
                }
                addChunkSmall();
              }

              // minimize runtime work: avoid attaching many event listeners on each marker
              // (if you need click handling, consider delegating via cluster click or a single listener)
            } catch (err) {
              // surface error for remote debugging
              try {
                console.error('initMap error', err && err.message ? err.message : err);
              } catch (e) {}
            }
          } // initMap

          // initialize as soon as possible, but allow the page to be interactive first
          if (document.readyState === 'complete' || document.readyState === 'interactive') {
            requestIdleCallback(initMap);
          } else {
            window.addEventListener('DOMContentLoaded', function() {
              requestIdleCallback(initMap);
            });
          }
        </script>
      </head>
      <body>
        <div id="map"></div>
      </body>
    </html>
  `;

  // height prop이 undefined/null이면 기본값으로
  const defaultHeight = (Dimensions.get('window').height * 240) / 812;
  const mapHeight =
    typeof height === 'number' && !isNaN(height) && height > 0 ? height : defaultHeight;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      style={[styles.container, { height: mapHeight }]}
      javaScriptEnabled
      domStorageEnabled
      // Ensure hardware acceleration is enabled on Android - explicitly set the prop to false
      // (prop name is androidHardwareAccelerationDisabled; setting to false means hardware accel ON)
      androidHardwareAccelerationDisabled={false}
      // Reduce extra reflows: startInLoadingState true shows native loader until ready
      startInLoadingState={true}
      // allow mixed content if needed for HTTP resources
      mixedContentMode="compatibility"
      // disable expensive features if your WebView implementation supports them
      // other props can be added here depending on your WebView package/version
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: Dimensions.get('window').width,
    backgroundColor: '#ffffff',
  },
});