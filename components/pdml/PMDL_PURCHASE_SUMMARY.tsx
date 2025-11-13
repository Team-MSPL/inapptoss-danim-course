import React from "react";
import ModuleShell from "./ModuleShell";
import { Text, colors } from "@toss-design-system/react-native";
import { renderProperties, renderDesc } from "./pdmlHelpers";

/**
 * PMDL_PURCHASE_SUMMARY
 * - Shows purchase summary info (may have properties)
 * - Use renderDesc to detect HTML and render via HtmlRenderer when needed.
 * - Keep ModuleShell visible even if content is empty; show small placeholder for debugging.
 */
export default function PMDL_PURCHASE_SUMMARY({
                                                moduleKey,
                                                moduleData,
                                                onOpenMedia,
                                              }: {
  moduleKey: string;
  moduleData: any;
  onOpenMedia?: (u: string) => void;
}) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleData.title ?? moduleKey;
  const content = moduleData.content ?? moduleData;

  const hasContent =
    !!(
      (content && content.type === "text" && content.desc) ||
      (content && content.media && Array.isArray(content.media) && content.media.length > 0) ||
      (content && Array.isArray(content.list) && content.list.length > 0) ||
      (content && content.properties && typeof content.properties === "object" && Object.keys(content.properties).length > 0)
    );

  return (
    <ModuleShell title={title}>
      {!hasContent ? (
        <Text typography="t6" color={colors.grey500}>
          (내용 없음)
        </Text>
      ) : null}

      {/* desc: use renderDesc so HTML will be rendered by HtmlRenderer when present */}
      {content?.desc ? renderDesc(content.desc, "purchase-summary-desc", onOpenMedia) : null}

      {/* properties: delegate to shared renderer */}
      {content?.properties ? renderProperties(content.properties, onOpenMedia) : null}
    </ModuleShell>
  );
}