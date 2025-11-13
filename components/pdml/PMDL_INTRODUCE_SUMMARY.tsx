import React from "react";
import ModuleShell from "./ModuleShell";
import HtmlRenderer from "./HtmlRenderer";
import { Text, colors } from "@toss-design-system/react-native";

/**
 * PMDL_INTRODUCE_SUMMARY
 * - Dedicated renderer for "상품 설명 / INTRODUCE_SUMMARY".
 * - These modules commonly provide a large HTML string in content.desc.
 * - Use HtmlRenderer for fidelity (it falls back to WebView if needed).
 */

export default function PMDL_INTRODUCE_SUMMARY({
                                                 moduleKey,
                                                 moduleData,
                                                 googleApiKey,
                                               }: {
  moduleKey: string;
  moduleData: any;
  googleApiKey?: string;
}) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleData.title ?? moduleKey;
  const content = moduleData.content ?? moduleData;
  const raw = content?.desc ?? "";

  // If there's nothing, show placeholder so wrapper is visible
  if (!raw || String(raw).trim().length === 0) {
    return (
      <ModuleShell title={title}>
        <Text typography="t6" color={colors.grey500}>(내용 없음)</Text>
      </ModuleShell>
    );
  }

  // Prefer HtmlRenderer for full HTML blocks
  return (
    <ModuleShell title={title}>
      <HtmlRenderer html={String(raw)} onOpenMedia={() => { /* delegate if needed */ }} />
    </ModuleShell>
  );
}