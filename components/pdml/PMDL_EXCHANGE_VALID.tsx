import React from "react";
import ModuleShell from "./ModuleShell";
import { Text } from "@toss-design-system/react-native";

export default function PMDL_EXCHANGE_VALID({ moduleKey, moduleData }: { moduleKey: string; moduleData: any }) {
  const content = moduleData?.content ?? moduleData;
  const props = content?.properties ?? {};
  return (
    <ModuleShell title={moduleData?.module_title ?? moduleKey}>
      <Text typography="t6">{props?.exchange?.desc ?? ""}</Text>
      {props?.exchange_description?.desc ? <Text typography="t6" style={{ marginTop: 6 }}>{props.exchange_description.desc}</Text> : null}
      {props?.expired?.desc ? <Text typography="t6" style={{ marginTop: 6 }}>{props.expired.desc}</Text> : null}
    </ModuleShell>
  );
}