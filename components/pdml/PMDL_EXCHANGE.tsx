import React from "react";
import { View } from "react-native";
import ModuleShell from "./ModuleShell";
import { Text, colors } from "@toss-design-system/react-native";

function stripHtmlTags(html?: string) {
  if (!html) return "";
  return String(html).replace(/<\/?[^>]+(>|$)/g, "").trim();
}

export default function PMDL_EXCHANGE({ moduleKey, moduleData }: { moduleKey: string; moduleData: any }) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleKey;
  const content = moduleData.content ?? {};

  // properties.exchange_type.desc (예시)
  const exchangeType = content?.properties?.exchange_type;
  const desc = exchangeType?.desc ?? "";

  return (
    <ModuleShell title={title}>
      {desc ? <Text typography="t6" color={colors.grey800}>{stripHtmlTags(desc)}</Text> : <Text typography="t6" color={colors.grey500}>(내용 없음)</Text>}
    </ModuleShell>
  );
}