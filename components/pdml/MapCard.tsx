import React from "react";
import { View, Text } from "react-native";
import MapWebView from "../product/map-webview";

export default function MapCard({
                                  lat,
                                  lng,
                                  desc,
                                  googleApiKey,
                                  zoom = 12,
                                }: {
  lat: number;
  lng: number;
  desc?: string | null;
  googleApiKey?: string;
  zoom?: number;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      {desc ? <Text style={{ color: "#1E90FF", marginBottom: 6 }}>{desc}</Text> : null}
      <MapWebView lat={lat} lng={lng} googleApiKey={googleApiKey ?? ""} zoom={zoom} range={1} />
    </View>
  );
}