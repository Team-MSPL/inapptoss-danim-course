import React from "react";
import ModuleShell from "./ModuleShell";
import { View } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import { renderDesc, renderListEntries, renderProperties } from "./pdmlHelpers";

/**
 * PMDL_WIFI
 * - Generic but dedicated handler for WIFI/location-like module shapes.
 */
export default function PMDL_WIFI({ moduleKey, moduleData, onOpenMedia }: { moduleKey: string; moduleData: any; onOpenMedia?: (u: string) => void }) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleData.title ?? moduleKey;
  const content = moduleData.content ?? moduleData;

  return (
    <ModuleShell title={title}>
      {/* media at root */}
      {Array.isArray(content.media) && content.media.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          {/* MediaGallery expects media array */}
          {/* @ts-ignore */}
          {React.createElement(require("./MediaGallery").default, { media: content.media, onOpen: onOpenMedia })}
        </View>
      ) : null}

      {/* list entries (daily schedule-like) */}
      {Array.isArray(content.list) && content.list.length > 0 ? renderListEntries(content.list, onOpenMedia) : null}

      {/* properties (latitude/longitude etc) */}
      {content?.properties ? renderProperties(content.properties, onOpenMedia) : null}

      {/* fallback simple fields */}
      {content?.desc ? <Text typography="t6" color={colors.grey800}>{String(content.desc)}</Text> : null}
    </ModuleShell>
  );
}