import React, { useState } from "react";
import { View, Image, TouchableOpacity } from "react-native";
import ModuleShell from "./ModuleShell";
import { Text, colors } from "@toss-design-system/react-native";
import { buildImageUrl } from "../../utill/imageUrl";

/**
 * PMDL_GRAPHIC (updated)
 * - shows a centered white placeholder box with "이미지 로드 실패" text when image fails to load
 * - no console warnings on image load failure
 */

function stripHtmlTags(html?: string) {
  if (!html) return "";
  return String(html).replace(/<\/?[^>]+(>|$)/g, "").trim();
}

export default function PMDL_GRAPHIC({
                                       moduleKey,
                                       moduleData,
                                       onOpenMedia,
                                     }: {
  moduleKey: string;
  moduleData: any;
  onOpenMedia?: (url: string) => void;
}) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleData.title ?? moduleKey;
  const content = moduleData.content ?? moduleData;
  const list = Array.isArray(content?.list) ? content.list : [];
  if (list.length === 0) return null;

  // track failed image loads by index
  const [failedMap, setFailedMap] = useState<Record<number, boolean>>({});

  return (
    <ModuleShell title={title}>
      <View style={{ marginTop: 4 }}>
        {list.map((item: any, idx: number) => {
          const desc = item?.desc ?? "";
          const mediaArr = Array.isArray(item?.media) ? item.media : [];
          const firstMedia = mediaArr[0] ?? null;
          const src = firstMedia?.source_content ?? null;
          const uri = buildImageUrl(src);

          const isFailed = Boolean(failedMap[idx]);

          return (
            <View key={idx} style={{ marginBottom: 20 }}>
              {desc ? (
                <Text typography="t7" color={colors.grey800} style={{ marginBottom: 12 }}>
                  {stripHtmlTags(desc)}
                </Text>
              ) : null}

              {uri ? (
                isFailed ? (
                  // placeholder box shown when image failed to load
                  <View
                    style={{
                      width: "100%",
                      aspectRatio: 16 / 9,
                      borderRadius: 10,
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: colors.grey100,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text typography="t7" color={colors.grey500}>
                      이미지 로드 실패
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onOpenMedia?.(uri)}
                  >
                    <Image
                      source={{ uri }}
                      style={{
                        width: "100%",
                        aspectRatio: 16 / 9,
                        borderRadius: 10,
                        backgroundColor: colors.grey50,
                      }}
                      resizeMode="cover"
                      onError={() => {
                        // mark this index as failed (no console logs)
                        setFailedMap((prev) => ({ ...prev, [idx]: true }));
                      }}
                    />
                  </TouchableOpacity>
                )
              ) : null}
            </View>
          );
        })}
      </View>
    </ModuleShell>
  );
}