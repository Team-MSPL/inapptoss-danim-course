import React from "react";
import ModuleShell from "./ModuleShell";
import HtmlRenderer from "./HtmlRenderer";
import MediaGallery from "./MediaGallery";
import { Text, colors } from "@toss-design-system/react-native";
import { View, Linking, Alert } from "react-native";

/* ---------- Small RichTextRenderer (self-contained) ---------- */
function decodeHtmlEntities(str: string) {
  if (!str) return "";
  return String(str)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "");
}

/** Convert anchor tags to token [[[URL|LABEL]]] so we keep label+href after stripping tags */
function extractAndTokenizeAnchors(html: string) {
  if (!html) return html;
  return html.replace(/<a\b[^>]*href=(["']?)(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_, _q, href, label) => {
    const safeLabel = (label || "").replace(/<\/?[^>]+(>|$)/g, "").trim();
    const safeHref = String(href || "").trim();
    return `[[[${safeHref}|${safeLabel}]]]`;
  });
}

const URL_REGEX = /((https?:\/\/|www\.)[^\s<>()]+)/gi;

function ensureProtocol(u: string) {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

/** Split input into paragraph/list blocks while preserving tokens */
function splitToBlocksWithAnchors(text: string) {
  if (!text) return [];
  let t = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = decodeHtmlEntities(t);
  t = extractAndTokenizeAnchors(t);

  // map some HTML-ish markers to plain text markers/newlines
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<\/p>/gi, "\n\n");
  t = t.replace(/<li>/gi, "\n• ");

  // strip remaining tags
  t = t.replace(/<\/?[^>]+(>|$)/g, "");
  // collapse multiple spaces
  t = t.replace(/[ \t]{2,}/g, " ");
  // normalize newlines
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.trim();
  return t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

/** Split plain chunk into text + raw URL parts using URL_REGEX */
function splitRawUrlsInto(acc: Array<{ text: string; url?: string }>, chunk: string) {
  let last = 0;
  chunk.replace(URL_REGEX, (match: string, _p1: string, _p2: string, offset: number) => {
    if (offset > last) {
      acc.push({ text: chunk.slice(last, offset) });
    }
    acc.push({ text: match, url: ensureProtocol(match) });
    last = offset + match.length;
    return match;
  });
  if (last < chunk.length) acc.push({ text: chunk.slice(last) });
}

/** Break a piece of text into parts; detects tokenized anchors and raw URLs */
function tokenizeLinkParts(text: string): Array<{ text: string; url?: string }> {
  const parts: Array<{ text: string; url?: string }> = [];
  if (!text) return parts;

  // handle anchor tokens: [[[url|label]]]
  const anchorTokenRe = /\[\[\[\s*(.*?)\|(.*?)\s*\]\]\]/g;
  let lastIndex = 0;
  let m;
  while ((m = anchorTokenRe.exec(text)) !== null) {
    const offset = m.index;
    const whole = m[0];
    const url = m[1];
    const label = m[2];
    if (offset > lastIndex) {
      splitRawUrlsInto(parts, text.slice(lastIndex, offset));
    }
    parts.push({ text: label, url: ensureProtocol(url) });
    lastIndex = offset + whole.length;
  }
  if (lastIndex < text.length) {
    const rest = text.slice(lastIndex);
    splitRawUrlsInto(parts, rest);
  }
  if (parts.length === 0) parts.push({ text });
  return parts;
}

/** The renderer component using toss-design Text styling requested by user */
function RichTextRenderer({ text }: { text: string }) {
  const blocks = splitToBlocksWithAnchors(text);

  return (
    <View>
      {blocks.map((blk, idx) => {
        const isList = /^•\s+/.test(blk);
        if (isList) {
          const lines = blk.split(/\n+/).map((l) => l.replace(/^•\s+/, "").trim()).filter(Boolean);
          return (
            <View key={idx} style={{ marginBottom: 8 }}>
              {lines.map((line, li) => (
                <View key={li} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                  <Text typography="t7" color={colors.grey800} style={{ marginBottom: 12, marginRight: 8 }}>•</Text>
                  <Text typography="t7" color={colors.grey800} style={{ marginBottom: 12, flex: 1 }}>
                    {tokenizeLinkParts(line).map((part, pi) =>
                      part.url ? (
                        <Text
                          key={pi}
                          typography="t7"
                          color={colors.blue500}
                          style={{ marginBottom: 12 }}
                          onPress={() => {
                            try {
                              Linking.openURL(part.url!);
                            } catch {
                              Alert.alert("링크 열기 실패", "브라우저를 열 수 없습니다.");
                            }
                          }}
                        >
                          {part.text}
                        </Text>
                      ) : (
                        <Text key={pi} typography="t7" color={colors.grey800} style={{ marginBottom: 12 }}>
                          {part.text}
                        </Text>
                      )
                    )}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        return (
          <Text key={idx} typography="t7" color={colors.grey800} style={{ marginBottom: 12, lineHeight: 22 }}>
            {tokenizeLinkParts(blk).map((part, pi) =>
              part.url ? (
                <Text
                  key={pi}
                  typography="t7"
                  color={colors.blue500}
                  style={{ marginBottom: 12 }}
                  onPress={() => {
                    try {
                      Linking.openURL(part.url!);
                    } catch {
                      Alert.alert("링크 열기 실패", "브라우저를 열 수 없습니다.");
                    }
                  }}
                >
                  {part.text}
                </Text>
              ) : (
                <Text key={pi} typography="t7" color={colors.grey800} style={{ marginBottom: 12 }}>
                  {part.text}
                </Text>
              )
            )}
          </Text>
        );
      })}
    </View>
  );
}

/* ------------------ GenericModule main export ------------------ */
export default function GenericModule({
                                        moduleKey,
                                        moduleData,
                                        googleApiKey,
                                        onOpenMedia,
                                      }: {
  moduleKey: string;
  moduleData: any;
  googleApiKey?: string;
  onOpenMedia?: (url: string) => void;
}) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleData.title ?? moduleKey;
  const content = moduleData.content ?? moduleData;

  // Ensure ModuleShell always rendered so wrappers that just delegate to GenericModule show up.
  // Show a helpful placeholder if content is empty to aid debugging.
  const hasContent =
    !!(content && (
      (content.type === "text" && content.desc) ||
      (content.media && Array.isArray(content.media) && content.media.length > 0) ||
      (Array.isArray(content.list) && content.list.length > 0) ||
      (content.type === "properties" && content.properties && Object.keys(content.properties).length > 0) ||
      (content.properties && typeof content.properties === "object" && Object.keys(content.properties).length > 0) // <-- handle server data without explicit type
    ));

  // Debug: light log to help track empty-wrapper cases (won't spam in production unless dev console enabled)
  try {
    if (!hasContent) {
      console.debug(`[GenericModule] No renderable content for moduleKey=${moduleKey}`);
    }
  } catch {
    /* noop */
  }

  // Simple helper to open media or fallback to onOpenMedia
  const openUrl = (url?: string) => {
    if (!url) return;
    if (onOpenMedia) {
      try {
        onOpenMedia(url);
        return;
      } catch {
        // fallthrough to Linking
      }
    }
    Linking.openURL(url).catch(() => Alert.alert("링크 열기 실패", "브라우저를 열 수 없습니다."));
  };

  // Helper to render a property value (recursive-ish)
  const renderPropertyValue = (value: any, key?: string) => {
    if (!value) return null;

    // If value is object that looks like a text/content block
    if (value.type === "text" && value.desc) {
      return <RichTextRenderer text={String(value.desc)} />;
    }

    // If it's a content block with use_html
    if (value.type === "content" && value.desc) {
      return value.use_html ? <HtmlRenderer html={String(value.desc)} onOpenMedia={openUrl} /> : <RichTextRenderer text={String(value.desc)} />;
    }

    // If it's a list
    if (Array.isArray(value.list) && value.list.length > 0) {
      return (
        <View>
          {value.title ? <Text typography="t7" color={colors.grey800} style={{ marginBottom: 8 }}>{value.title}</Text> : null}
          {value.list.map((it: any, idx: number) => {
            const desc = it?.desc ?? "";
            const mediaArr = Array.isArray(it?.media) ? it.media : [];
            // If this list entry is a location object (location_info) try to print store_name / latlng.desc etc.
            if (it?.location_info?.properties) {
              const props = it.location_info.properties;
              return (
                <View key={idx} style={{ marginBottom: 12 }}>
                  {props.store_name?.desc ? <Text typography="t7" color={colors.grey800} style={{ marginBottom: 6 }}>{props.store_name.desc}</Text> : null}
                  {props.latlng?.desc ? <Text typography="t7" color={colors.grey700} style={{ marginBottom: 6 }}>{props.latlng.desc}</Text> : null}
                  {it?.station_list?.list ? renderPropertyValue(it.station_list, `station_list-${idx}`) : null}
                  {mediaArr.length > 0 ? <MediaGallery media={mediaArr} onOpen={(m) => openUrl(m)} /> : null}
                </View>
              );
            }

            return (
              <View key={idx} style={{ marginBottom: 12 }}>
                {desc ? <RichTextRenderer text={String(desc)} /> : null}
                {mediaArr.length > 0 ? <MediaGallery media={mediaArr} onOpen={(m) => openUrl(m)} /> : null}
                {/* render nested properties if present */}
                {it?.properties ? Object.entries(it.properties).map(([k, v]) => <View key={k}>{renderPropertyValue(v, k)}</View>) : null}
              </View>
            );
          })}
        </View>
      );
    }

    // If it's a properties-like object (nested)
    if (value && typeof value === "object" && !Array.isArray(value)) {
      // If it has title/desc directly
      if (value.desc && !value.list) {
        return <RichTextRenderer text={String(value.desc)} />;
      }

      // If it has properties nested
      if (value.properties) {
        return (
          <View>
            {Object.entries(value.properties).map(([k, v]) => (
              <View key={k} style={{ marginBottom: 8 }}>
                {v?.title ? <Text typography="t7" color={colors.grey800} style={{ marginBottom: 6 }}>{v.title}</Text> : null}
                {renderPropertyValue(v, k)}
              </View>
            ))}
          </View>
        );
      }
    }

    // Fallback: stringify small objects or show nothing
    try {
      if (typeof value === "string") return <RichTextRenderer text={value} />;
      if (typeof value === "number" || typeof value === "boolean") return <Text typography="t7" color={colors.grey700}>{String(value)}</Text>;
      // last resort for other shapes
      return <Text typography="t7" color={colors.grey700} numberOfLines={6}>{JSON.stringify(value)}</Text>;
    } catch {
      return null;
    }
  };

  return (
    <ModuleShell title={title}>
      {/* If there is no content, show a small placeholder so wrapper components are visible */}
      {!hasContent ? (
        <View style={{ paddingVertical: 8 }}>
          <Text typography="t7" color={colors.grey500}>(내용 없음)</Text>
        </View>
      ) : null}

      {/* Html text handling */}
      {moduleData?.use_html && content?.type === "text" && content?.desc ? (
        (() => {
          const htmlStr = String(content.desc || "");
          const hasComplex = /<(table|img|iframe|script|form|video|audio)\b/i.test(htmlStr);
          if (hasComplex) {
            return <HtmlRenderer html={htmlStr} onOpenMedia={openUrl} />;
          }
          return <RichTextRenderer text={String(content.desc)} />;
        })()
      ) : null}

      {/* Plain text fallback */}
      {!moduleData?.use_html && content?.type === "text" && content?.desc ? (
        <RichTextRenderer text={String(content.desc)} />
      ) : null}

      {/* Media */}
      {content?.media && Array.isArray(content.media) && content.media.length > 0 ? (
        <MediaGallery media={content.media} onOpen={(m) => openUrl(m)} />
      ) : null}

      {/* List entries */}
      {Array.isArray(content?.list) && content.list.length > 0 ? (
        <>
          {content.list.map((it: any, idx: number) => {
            const desc = it?.desc ?? "";
            const mediaArr = Array.isArray(it?.media) ? it.media : [];
            return (
              <View key={idx} style={{ marginBottom: 12 }}>
                {desc ? <RichTextRenderer text={String(desc)} /> : null}
                {mediaArr.length > 0 ? <MediaGallery media={mediaArr} onOpen={(m) => openUrl(m)} /> : null}
                {it?.properties ? Object.entries(it.properties).map(([k, v]) => <View key={k}>{renderPropertyValue(v, k)}</View>) : null}
              </View>
            );
          })}
        </>
      ) : null}

      {/* Properties — handle even when content.type is not explicitly "properties" */}
      {content?.properties && typeof content.properties === "object" && Object.keys(content.properties).length > 0 ? (
        <>
          {Object.entries(content.properties).map(([propKey, propVal]: any) => {
            // propVal can be { title, desc } or { list: [...], title } or nested structure
            return (
              <View key={propKey} style={{ marginBottom: 12 }}>
                {propVal?.title ? <Text typography="t7" color={colors.grey800} style={{ marginBottom: 6 }}>{propVal.title}</Text> : null}
                {renderPropertyValue(propVal, propKey)}
              </View>
            );
          })}
        </>
      ) : null}
    </ModuleShell>
  );
}