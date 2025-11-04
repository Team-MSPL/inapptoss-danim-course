import React from "react";
import ModuleShell from "./ModuleShell";
import MediaGallery from "./MediaGallery";
import { View } from "react-native";
import { Text } from "@toss-design-system/react-native";

/**
 * PMDL_SCHEDULE
 * - schedule entries can include media under daily_schedule_list.list[].media.media[].source_content
 * - normalize media via MediaGallery (which uses buildImageUrl)
 */
export default function PMDL_SCHEDULE({ moduleKey, moduleData }: { moduleKey: string; moduleData: any }) {
  if (!moduleData) return null;
  const content = moduleData.content ?? moduleData;
  const props = content?.properties ?? {};
  const scheduleList = props?.schedule_list?.list ?? [];

  if (!Array.isArray(scheduleList) || scheduleList.length === 0) return null;

  return (
    <ModuleShell title={moduleData?.module_title ?? moduleKey}>
      {scheduleList.map((day: any, idx: number) => {
        const dailyTitle = day?.daily_title?.desc ?? day?.daily_title ?? null;
        const dailySchedule = day?.daily_schedule_list ?? {};
        const rows = dailySchedule?.list ?? [];
        return (
          <View key={idx} style={{ marginBottom: 12 }}>
            {dailyTitle ? <Text typography="t7" style={{ marginBottom: 8 }}>{dailyTitle}</Text> : null}
            {rows.map((r: any, rIdx: number) => {
              const mediaArr = r?.media?.media ?? [];
              return (
                <View key={rIdx} style={{ marginBottom: 8 }}>
                  <Text typography="t7" color="grey">{r?.time?.desc ?? r?.time ?? ""} {r?.content ?? r?.desc ?? ""}</Text>
                  {mediaArr && mediaArr.length > 0 ? <MediaGallery media={mediaArr} /> : null}
                </View>
              );
            })}
          </View>
        );
      })}
    </ModuleShell>
  );
}