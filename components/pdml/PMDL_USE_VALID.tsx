import React from "react";
import ModuleShell from "./ModuleShell";
import { View } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import { renderListEntries, renderProperties } from "./pdmlHelpers";

/**
 * PMDL_USE_VALID
 * - Shows usage/validity info, typically similar shape to WIFI or schedule modules.
 */
export default function PMDL_USE_VALID({ moduleKey, moduleData, onOpenMedia }: { moduleKey: string; moduleData: any; onOpenMedia?: (u: string) => void }) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleData.title ?? moduleKey;
  const content = moduleData.content ?? moduleData;

  return (
    <ModuleShell title={title}>
      {content?.desc ? <Text typography="t6" color={colors.grey800}>{String(content.desc)}</Text> : null}
      {Array.isArray(content.list) ? renderListEntries(content.list, onOpenMedia) : null}
      {content?.properties ? renderProperties(content.properties, onOpenMedia) : null}
    </ModuleShell>
  );
}