import React, { useState } from "react";
import { View, Image, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import ModuleShell from "./ModuleShell";
import MapCard from "./MapCard";
import { Text, colors, Icon } from "@toss-design-system/react-native";
import { buildImageUrl } from "../../utill/imageUrl";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  // @ts-ignore
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PMDL_EXCHANGE_LOCATION({ moduleKey, moduleData }: { moduleKey: string; moduleData: any }) {
  if (!moduleData) return null;
  const content = moduleData.content ?? moduleData;
  const locations = content?.properties?.locations?.list ?? [];
  if (!Array.isArray(locations) || locations.length === 0) return null;

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  function toggle(idx: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => ({ ...p, [idx]: !p[idx] }));
  }

  return (
    <ModuleShell title={moduleData?.module_title ?? moduleKey}>
      {locations.map((entry: any, idx: number) => {
        const info = entry?.location_info?.properties ?? entry?.location_info ?? {};
        const storeName = info?.store_name?.desc ?? info?.store_name ?? "";
        const latlng = info?.latlng ?? null;
        const lat = latlng ? Number(latlng.latitude ?? latlng.lat) : null;
        const lng = latlng ? Number(latlng.longitude ?? latlng.lng) : null;
        const desc = latlng?.desc ?? info?.location_name?.desc ?? null;

        const stationList = entry?.station_list?.list ?? [];
        const firstStation = Array.isArray(stationList) && stationList.length > 0 ? stationList[0] : null;
        const photoPath = firstStation?.photo?.media?.[0]?.source_content ?? null;
        const photoUri = buildImageUrl(photoPath);
        const provideService = firstStation?.provide_service?.desc ?? null;
        const activeTimeList = firstStation?.active_time?.list ?? [];

        const isExpanded = Boolean(expanded[idx]);

        return (
          <View key={idx} style={{ backgroundColor: "#fff", borderRadius: 10, padding: 0, marginBottom: 12, borderWidth: 1, borderColor: colors.grey100, overflow: "hidden" }}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => toggle(idx)} style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <View style={{ backgroundColor: "#ff4929", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 10 }}>
                    <Text typography="t8" color={colors.white}>{firstStation?.provide_service?.desc ?? "교환 가능"}</Text>
                  </View>
                  <Text typography="t6" fontWeight="bold" numberOfLines={2} style={{ flexShrink: 1 }}>{storeName}</Text>
                </View>
                {desc ? <Text typography="t8" color={colors.grey500}>{desc}</Text> : null}
              </View>
              <View style={{ marginLeft: 8 }}>
                <Icon name={isExpanded ? "icon-chevron-up" : "icon-chevron-down"} size={20} color={colors.grey500} />
              </View>
            </TouchableOpacity>

            {isExpanded ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View style={{ height: 1, backgroundColor: colors.grey100, marginBottom: 12 }} />

                <View style={{ flexDirection: "row" }}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={{ width: 92, height: 68, borderRadius: 8 }} resizeMode="cover" onError={(e) => console.warn("[PMDL_EXCHANGE_LOCATION] photo load error:", photoUri, e.nativeEvent)} />
                  ) : (
                    <View style={{ width: 0, height: 0, borderRadius: 8, backgroundColor: colors.grey50 }} />
                  )}

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                      <Text typography="t7" color={colors.grey800}>서비스 제공</Text>
                      <Text typography="t7">{provideService ?? "-"}</Text>
                    </View>

                    <View style={{ height: 12 }} />

                    {Array.isArray(activeTimeList) && activeTimeList.length > 0 ? (
                      <View style={{ marginTop: 8 }}>
                        <Text typography="t7" color={colors.grey800} style={{ marginBottom: 8 }}>운영 시간</Text>
                        <View style={{ borderWidth: 1, borderColor: colors.grey100, borderRadius: 8, overflow: "hidden" }}>
                          <View style={{ flexDirection: "row", backgroundColor: colors.grey50, paddingVertical: 10 }}>
                            <View style={{ flex: 1, paddingLeft: 12 }}><Text typography="t8" color={colors.grey700}>주</Text></View>
                            <View style={{ width: 100, alignItems: "center" }}><Text typography="t8" color={colors.grey700}>운영시간</Text></View>
                            <View style={{ width: 100, alignItems: "center" }}><Text typography="t8" color={colors.grey700}>마감시간</Text></View>
                            <View style={{ width: 96, alignItems: "center", paddingRight: 12 }}><Text typography="t8" color={colors.grey700}>운영 여부</Text></View>
                          </View>

                          {activeTimeList.map((row: any, rIdx: number) => (
                            <View key={rIdx} style={{ flexDirection: "row", paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.grey100, alignItems: "center" }}>
                              <View style={{ flex: 1, paddingLeft: 12 }}>
                                <Text typography="t8" color={colors.grey700}>{row?.week_title?.desc ?? ""}</Text>
                              </View>
                              <View style={{ width: 100, alignItems: "center" }}><Text typography="t8" color={colors.grey700}>{row?.start_time?.desc ?? "-"}</Text></View>
                              <View style={{ width: 100, alignItems: "center" }}><Text typography="t8" color={colors.grey700}>{row?.end_time?.desc ?? "-"}</Text></View>
                              <View style={{ width: 96, alignItems: "center", paddingRight: 12 }}><Text typography="t8" color={colors.grey700}>{row?.close_desc?.desc ?? "-"}</Text></View>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>

                {lat != null && lng != null ? (
                  <View style={{ marginTop: 12 }}>
                    <MapCard lat={lat} lng={lng} desc={desc} googleApiKey={(import.meta as any).env?.GOOGLE_API_KEY ?? ""} zoom={latlng?.zoom_lv ? Number(latlng.zoom_lv) : 16} />
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </ModuleShell>
  );
}