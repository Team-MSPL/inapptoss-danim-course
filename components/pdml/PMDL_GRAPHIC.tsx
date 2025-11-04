import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import ModuleShell from "./ModuleShell";
import { Text, colors } from "@toss-design-system/react-native";
import { buildImageUrl } from "../../utill/imageUrl";

/**
 * PMDL_GRAPHIC (updated)
 * - uses buildImageUrl for all images
 * - onError logging
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

  return (
    <ModuleShell title={title}>
      <View style={{ marginTop: 4 }}>
        {list.map((item: any, idx: number) => {
          const desc = item?.desc ?? "";
          const mediaArr = Array.isArray(item?.media) ? item.media : [];
          const firstMedia = mediaArr[0] ?? null;
          const src = firstMedia?.source_content ?? null;
          const uri = buildImageUrl(src);
          return (
            <View key={idx} style={{ marginBottom: 20 }}>
              {desc ? <Text typography="t7" color={colors.grey800} style={{ marginBottom: 12 }}>{stripHtmlTags(desc)}</Text> : null}
              {uri ? (
                <TouchableOpacity activeOpacity={0.9} onPress={() => onOpenMedia?.(uri)}>
                  <Image
                    source={{ uri }}
                    style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 10, backgroundColor: colors.grey50 }}
                    resizeMode="cover"
                    onError={(e) => console.warn("[PMDL_GRAPHIC] image load error:", uri, e.nativeEvent)}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </View>
    </ModuleShell>
  );
}