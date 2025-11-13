import React from "react";
import ModuleShell from "./ModuleShell";
import { Text, colors } from "@toss-design-system/react-native";
import { renderProperties } from "./pdmlHelpers";

/**
 * PMDL_PRODUCT_INFO
 * - Product-specific structured info; often under properties
 */
export default function PMDL_PRODUCT_INFO({ moduleKey, moduleData, onOpenMedia }: { moduleKey: string; moduleData: any; onOpenMedia?: (u: string) => void }) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleData.title ?? moduleKey;
  const content = moduleData.content ?? moduleData;

  return (
    <ModuleShell title={title}>
      {content?.desc ? <Text typography="t6" color={colors.grey800}>{String(content.desc)}</Text> : null}
      {content?.properties ? renderProperties(content.properties, onOpenMedia) : null}
    </ModuleShell>
  );
}