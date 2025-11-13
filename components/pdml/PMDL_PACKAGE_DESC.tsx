import React from "react";
import ModuleShell from "./ModuleShell";
import { Text, colors } from "@toss-design-system/react-native";
import { renderListEntries } from "./pdmlHelpers";

/**
 * PMDL_PACKAGE_DESC
 * - package description often contains list of features; show list prominently
 */
export default function PMDL_PACKAGE_DESC({ moduleKey, moduleData, onOpenMedia }: { moduleKey: string; moduleData: any; onOpenMedia?: (u: string) => void }) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleData.title ?? moduleKey;
  const content = moduleData.content ?? moduleData;

  return (
    <ModuleShell title={title}>
      {content?.desc ? <Text typography="t6" color={colors.grey800} style={{ marginBottom: 8 }}>{String(content.desc)}</Text> : null}
      {Array.isArray(content.list) ? renderListEntries(content.list, onOpenMedia) : null}
    </ModuleShell>
  );
}