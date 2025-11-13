import React from "react";
import { View } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import HtmlRenderer from "./HtmlRenderer";
import MediaGallery from "./MediaGallery";

/**
 * Common PDML helpers for rendering:
 * - renderDesc: choose HtmlRenderer if looks like HTML, else plain Text
 * - renderList: render content.list entries with optional media
 * - renderProperties: render content.properties object with titles/lists
 */

export function stripHtmlTags(html?: string) {
  if (!html) return "";
  return String(html).replace(/<\/?[^>]+(>|$)/g, "").trim();
}

export function looksLikeHtml(s?: string) {
  if (!s) return false;
  // 태그 또는 엔티티/브레이크/앵커가 있으면 HTML로 판단
  return /<\/?[a-z][\s\S]*>/i.test(s) || /&nbsp;|&amp;|<br|<p|<a\s+/i.test(s);
}


export function renderDesc(desc: any, key?: string, onOpenMedia?: (u: string) => void) {
  if (!desc && desc !== 0) return null;
  const raw = String(desc ?? "");
  if (looksLikeHtml(raw)) {
    return <HtmlRenderer key={key} html={raw} onOpenMedia={onOpenMedia} />;
  }
  // plain text (기존의 RichTextRenderer 호출 혹은 간단 Text)
  return (
    <View key={key} style={{ marginBottom: 8 }}>
      <Text typography="t6" color={colors.grey800}>{raw}</Text>
    </View>
  );
}

export function renderListEntries(list: any[], onOpenMedia?: (u: string) => void) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return (
    <View>
      {list.map((it: any, idx: number) => {
        const desc = it?.desc ?? it?.content ?? "";
        const mediaArr = Array.isArray(it?.media) ? it.media : [];
        return (
          <View key={idx} style={{ marginBottom: 12 }}>
            {desc ? renderDesc(desc, `desc-${idx}`, onOpenMedia) : null}
            {mediaArr.length > 0 ? <MediaGallery media={mediaArr} onOpen={onOpenMedia} /> : null}
            {/* nested lists/properties within list item */}
            {it?.properties ? (
              <View style={{ marginTop: 8 }}>
                {Object.entries(it.properties).map(([k, v]: any) => (
                  <View key={k} style={{ marginBottom: 6 }}>
                    {v?.title ? <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>{v.title}</Text> : null}
                    {v?.desc ? renderDesc(v.desc, `prop-${k}-${idx}`, onOpenMedia) : null}
                    {Array.isArray(v?.list) ? renderListEntries(v.list, onOpenMedia) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function renderProperties(properties: any, onOpenMedia?: (u: string) => void) {
  if (!properties || typeof properties !== "object") return null;
  return (
    <View>
      {Object.entries(properties).map(([k, v]: any) => {
        // v can be { title, desc } or { list, title } or nested structure
        const title = v?.title ?? k;
        return (
          <View key={k} style={{ marginBottom: 12 }}>
            {title ? <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>{title}</Text> : null}
            {v?.desc ? renderDesc(v.desc, `prop-desc-${k}`, onOpenMedia) : null}
            {Array.isArray(v?.list) ? renderListEntries(v.list, onOpenMedia) : null}
            {v?.properties ? renderProperties(v.properties, onOpenMedia) : null}
          </View>
        );
      })}
    </View>
  );
}