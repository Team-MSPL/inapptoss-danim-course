import React from "react";
import ModuleShell from "./ModuleShell";
import HtmlRenderer from "./HtmlRenderer";
import MediaGallery from "./MediaGallery";
import { Text, colors } from "@toss-design-system/react-native";
import { View, Linking, Alert } from "react-native";

/**
 * GenericModule
 * - Renders moduleData content with improved text handling:
 *   - HTML blocks (use_html) are rendered by HtmlRenderer (fallback to WebView inside that component).
 *   - Plain text blocks are run through a lightweight RichTextRenderer that:
 *     - decodes common HTML entities (&nbsp;, &amp; ...)
 *     - converts simple list markers and <li> into bullets
 *     - preserves paragraph breaks (renders each paragraph in its own <Text> so line spacing is preserved)
 *     - detects <a href> anchors and inline raw URLs and makes them tappable via Linking.openURL
 *
 * This keeps previous behavior for media but improves line breaks, entity decoding, list bullets and link handling for text-based PDML.
 */

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
  if (!content) return null;

  // If module has HTML and contains complex tags, prefer HtmlRenderer/WebView for fidelity
  if (moduleData?.use_html && content?.type === "text" && content?.desc) {
    const htmlStr = String(content.desc || "");
    const hasComplex = /<(table|img|iframe|script|form|video|audio)\b/i.test(htmlStr);
    if (hasComplex) {
      return (
        <ModuleShell title={title}>
          <HtmlRenderer html={htmlStr} />
        </ModuleShell>
      );
    }

    // For simple HTML blocks, render natively with tokenization (anchors -> clickable links)
    return (
      <ModuleShell title={title}>
        <RichTextRenderer text={String(content.desc)} />
      </ModuleShell>
    );
  }

  // Plain text: use RichTextRenderer instead of raw Text so paragraphs, bullets and links are preserved
  if (content?.type === "text" && content?.desc) {
    return (
      <ModuleShell title={title}>
        <RichTextRenderer text={String(content.desc)} />
      </ModuleShell>
    );
  }

  // Media handling unchanged
  if (content?.media && Array.isArray(content.media) && content.media.length > 0) {
    return (
      <ModuleShell title={title}>
        <MediaGallery media={content.media} onOpen={onOpenMedia} />
      </ModuleShell>
    );
  }

  // List entries: render desc through RichTextRenderer and include media gallery for each entry
  if (Array.isArray(content?.list) && content.list.length > 0) {
    return (
      <ModuleShell title={title}>
        {content.list.map((it: any, idx: number) => {
          const desc = it?.desc ?? "";
          const mediaArr = Array.isArray(it?.media) ? it.media : [];
          return (
            <View key={idx} style={{ marginBottom: 12 }}>
              {desc ? <RichTextRenderer text={String(desc)} /> : null}
              <MediaGallery media={mediaArr} onOpen={onOpenMedia} />
            </View>
          );
        })}
      </ModuleShell>
    );
  }

  // properties -> preserve use_html for 'content' entries, otherwise use RichTextRenderer
  if (content?.type === "properties" && content?.properties) {
    return (
      <ModuleShell title={title}>
        {Object.entries(content.properties).map(([k, v]: any) => {
          if (!v) return null;
          if (v.type === "text" && v.desc) {
            return <RichTextRenderer key={k} text={String(v.desc)} />;
          }
          if (v.type === "list" && Array.isArray(v.list)) {
            return (
              <View key={k} style={{ marginTop: 8 }}>
                {v.title ? <Text typography="t7" color={colors.grey800}>{v.title}</Text> : null}
                {v.list.map((li: any, i: number) => <RichTextRenderer key={i} text={String(li?.desc ?? "")} />)}
              </View>
            );
          }
          if (v.type === "content" && v.desc) {
            return v.use_html ? <HtmlRenderer key={k} html={String(v.desc)} /> : <RichTextRenderer key={k} text={String(v.desc)} />;
          }
          return null;
        })}
      </ModuleShell>
    );
  }

  // fallback: nothing
  return null;
}