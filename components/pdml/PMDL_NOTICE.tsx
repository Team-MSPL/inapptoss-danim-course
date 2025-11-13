import React from "react";
import ModuleShell from "./ModuleShell";
import HtmlRenderer from "./HtmlRenderer";
import { View, Alert } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";

/**
 * PMDL_NOTICE
 * - Dedicated renderer for "유의사항 / NOTICE" modules.
 * - Handles content.properties.cust_reminds.list entries which commonly contain desc strings.
 * - Uses HtmlRenderer when the desc looks like HTML (keeps links, <br>, <p> intact).
 * - Falls back to simple native Text rendering (with basic HTML tag stripping) otherwise.
 */

function stripHtmlTags(html?: string) {
  if (!html) return "";
  return String(html).replace(/<\/?[^>]+(>|$)/g, "").trim();
}

function looksLikeHtml(s?: string) {
  if (!s) return false;
  return /<\/?[a-z][\s\S]*>/i.test(s) || /&nbsp;|&amp;|<br|<p|<a /i.test(s);
}

export default function PMDL_NOTICE({
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

  const reminders = content?.properties?.cust_reminds;
  const list = Array.isArray(reminders?.list) ? reminders.list : null;

  return (
    <ModuleShell title={title}>
      {Array.isArray(list) && list.length > 0 ? (
        <View>
          {list.map((it: any, idx: number) => {
            const desc = it?.desc ?? "";
            // prefer HtmlRenderer for HTML-like content so anchors and <br> are preserved
            if (looksLikeHtml(desc)) {
              return <HtmlRenderer key={idx} html={String(desc)} onOpenMedia={(u: string) => { try { /* delegate to app linking handlers if needed */ } catch { Alert.alert("링크 열기 실패"); } }} />;
            }
            // plain text fallback: preserve newlines
            const paragraphs = String(desc).split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
            return (
              <View key={idx} style={{ marginBottom: 8 }}>
                {paragraphs.map((p, pi) => (
                  <Text key={pi} typography="t6" color={colors.grey800} style={{ marginBottom: 6, lineHeight: 20 }}>
                    {stripHtmlTags(p)}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      ) : (
        <Text typography="t6" color={colors.grey500}>(내용 없음)</Text>
      )}
    </ModuleShell>
  );
}