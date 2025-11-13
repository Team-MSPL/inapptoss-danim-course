import React from "react";
import { View } from "react-native";
import ModuleShell from "./ModuleShell";
import { Text, colors } from "@toss-design-system/react-native";

function stripHtmlTags(html?: string) {
  if (!html) return "";
  return String(html).replace(/<\/?[^>]+(>|$)/g, "").trim();
}

export default function PMDL_REFUND_POLICY({ moduleKey, moduleData }: { moduleKey: string; moduleData: any }) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleKey;
  const content = moduleData.content ?? {};
  const props = content.properties ?? {};

  const policyType = props.policy_type;
  const partial = props.partial_refund;

  return (
    <ModuleShell title={title}>
      {policyType?.title ? <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>{policyType.title}</Text> : null}
      {policyType?.desc ? <Text typography="t6" color={colors.grey800} style={{ marginBottom: 12 }}>{stripHtmlTags(policyType.desc)}</Text> : null}

      {partial && Array.isArray(partial.list) && (
        <View>
          {partial.list.map((it: any, idx: number) => (
            <Text key={`p-${idx}`} typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>• {stripHtmlTags(it?.desc)}</Text>
          ))}
        </View>
      )}
    </ModuleShell>
  );
}