import React, { useCallback, useState } from "react";
import { View, Image, TouchableOpacity, ImageLoadEventData, StyleSheet, Dimensions } from "react-native";
import ModuleShell from "./ModuleShell";
import { Text, colors, Icon } from "@toss-design-system/react-native";
import { buildImageUrl } from "../../utill/imageUrl";
import YoutubePlayer from "react-native-youtube-iframe";

/**
 * PMDL_GRAPHIC (inline youtube player)
 *
 * - 기존 기능 유지: 이미지 원본 비율 유지, 실패 시 placeholder 표시, 콘솔 로그 없음
 * - 유튜브 id 또는 유튜브 URL 처리: 썸네일을 보여주고 사용자가 눌렀을 때 해당 위치에서 바로 react-native-youtube-iframe 플레이어로 재생
 * - 모달이 아닌 "기존 자리에서 바로 재생" 요구사항을 반영 (inline player)
 *
 * 설치:
 *   npm install react-native-youtube-iframe
 *   npm install react-native-webview
 *
 * 사용법 요약:
 * - source_content가 "FbSzggfpaYg" 같은 11자리 유튜브 id 이거나 youtube url이면 유튜브로 판단하여 썸네일 노출
 * - 썸네일 클릭하면 해당 리스트 항목 자리에서 YoutubePlayer가 마운트되어 재생됨
 */

function stripHtmlTags(html?: string) {
  if (!html) return "";
  return String(html).replace(/<\/?[^>]+(>|$)/g, "").trim();
}

function looksLikeYoutubeId(s?: string) {
  if (!s || typeof s !== "string") return false;
  return /^[A-Za-z0-9_-]{11}$/.test(s);
}

function extractYoutubeIdFromUrl(url?: string) {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/");
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        const cand = parts[embedIdx + 1];
        if (/^[A-Za-z0-9_-]{11}$/.test(cand)) return cand;
      }
    } else if (u.hostname === "youtu.be") {
      const cand = u.pathname.replace(/^\//, "");
      if (/^[A-Za-z0-9_-]{11}$/.test(cand)) return cand;
    }
  } catch (e) {
    // not a URL
  }
  return null;
}

function youtubeThumbnailUrl(id: string) {
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PMDL_GRAPHIC({
                                       moduleKey,
                                       moduleData,
                                       onOpenMedia,
                                     }: {
  moduleKey: string;
  moduleData: any;
  onOpenMedia?: (url: string) => void;
}) {
  if (!moduleData) return null;
  const title = moduleData.module_title ?? moduleData.title ?? moduleKey;
  const content = moduleData.content ?? moduleData;
  const list = Array.isArray(content?.list) ? content.list : [];
  if (list.length === 0) return null;

  const [failedMap, setFailedMap] = useState<Record<number, boolean>>({});
  const [aspectMap, setAspectMap] = useState<Record<number, number>>({});
  const [thumbFallbackMap, setThumbFallbackMap] = useState<Record<number, boolean>>({});
  const [playingMap, setPlayingMap] = useState<Record<number, boolean>>({}); // which index is playing

  const handleImageLoad = useCallback((idx: number, e: { nativeEvent: ImageLoadEventData }) => {
    try {
      const srcInfo = (e && (e as any).nativeEvent && (e as any).nativeEvent.source) || null;
      const w = srcInfo?.width;
      const h = srcInfo?.height;
      if (w && h && Number.isFinite(w) && Number.isFinite(h) && h > 0) {
        const ratio = Number(w) / Number(h);
        setAspectMap((prev) => {
          if (prev[idx] && Math.abs(prev[idx] - ratio) < 0.0001) return prev;
          return { ...prev, [idx]: ratio };
        });
      }
    } catch (err) {
      // silent
    }
  }, []);

  const handleImageError = useCallback((idx: number) => {
    setFailedMap((prev) => ({ ...prev, [idx]: true }));
  }, []);

  const handleYoutubeThumbError = useCallback((idx: number) => {
    setThumbFallbackMap((prev) => ({ ...prev, [idx]: true }));
  }, []);

  const onPressPlayInline = useCallback((idx: number) => {
    setPlayingMap((prev) => ({ ...prev, [idx]: true }));
  }, []);

  const onStopInline = useCallback((idx: number) => {
    setPlayingMap((prev) => ({ ...prev, [idx]: false }));
  }, []);

  return (
    <ModuleShell title={title}>
      <View style={{ marginTop: 4 }}>
        {list.map((item: any, idx: number) => {
          const desc = item?.desc ?? "";
          const mediaArr = Array.isArray(item?.media) ? item.media : [];
          const firstMedia = mediaArr[0] ?? null;
          const src = firstMedia?.source_content ?? null;

          const isHttp = typeof src === "string" && /^https?:\/\//i.test(src);
          let youtubeId: string | null = null;
          if (typeof src === "string") {
            if (isHttp) {
              youtubeId = extractYoutubeIdFromUrl(src);
            } else if (looksLikeYoutubeId(src)) {
              youtubeId = src;
            }
          }

          const isImage = isHttp && !youtubeId;
          const isYouTube = !!youtubeId;
          const uriFromBuild = isHttp ? src : buildImageUrl(src);
          const thumbUrl = isYouTube ? (thumbFallbackMap[idx] ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : youtubeThumbnailUrl(youtubeId!)) : uriFromBuild || null;

          const isFailed = Boolean(failedMap[idx]);
          const aspectRatio = aspectMap[idx] ?? (16 / 9);
          const isPlaying = Boolean(playingMap[idx]);

          // click handler
          const handlePress = () => {
            if (isYouTube && youtubeId) {
              // play inline
              onPressPlayInline(idx);
            } else if (uriFromBuild) {
              onOpenMedia?.(uriFromBuild);
            }
          };

          return (
            <View key={idx} style={{ marginBottom: 20 }}>
              {desc ? (
                <Text typography="t7" color={colors.grey800} style={{ marginBottom: 12 }}>
                  {stripHtmlTags(desc)}
                </Text>
              ) : null}

              {thumbUrl ? (
                isFailed ? (
                  <View style={[styles.placeholder, { aspectRatio }]}>
                    <Text typography="t7" color={colors.grey500}>이미지 로드 실패</Text>
                  </View>
                ) : isYouTube ? (
                  // YouTube: either show thumbnail with play button, or inline player when playing
                  isPlaying ? (
                    <View style={{ width: "100%", alignItems: "center" }}>
                      <YoutubePlayer
                        height={(SCREEN_WIDTH - 32) / aspectRatio} // 너비에 맞춘 높이 계산
                        width={SCREEN_WIDTH - 32}
                        play={false}                       // 자동 재생 OFF (사용자 조작으로 재생)
                        videoId={youtubeId!}
                        onChangeState={(state) => {
                          if (state === "ended") {
                            // 필요시 재생 종료 처리
                            onStopInline(idx);
                          }
                        }}
                        webViewStyle={{ opacity: 0.99 }}
                        webViewProps={{
                          allowsInlineMediaPlayback: true,
                          mediaPlaybackRequiresUserAction: true, // 정책에 맞게 사용자가 조작해야 재생
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
                      <Image
                        source={{ uri: thumbUrl }}
                        style={[styles.image, { aspectRatio }]}
                        resizeMode="cover"
                        onLoad={(e) => handleImageLoad(idx, e)}
                        onError={() => {
                          if (!thumbFallbackMap[idx] && youtubeId) {
                            handleYoutubeThumbError(idx);
                            return;
                          }
                          handleImageError(idx);
                        }}
                      />
                      <View style={styles.playOverlay}>
                        <View style={styles.playCircle}>
                          <Icon name="icon-play" size={20} color="#fff" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                ) : (
                  // regular image
                  <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
                    <Image
                      source={{ uri: thumbUrl }}
                      style={[styles.image, { aspectRatio }]}
                      resizeMode="cover"
                      onLoad={(e) => handleImageLoad(idx, e)}
                      onError={() => handleImageError(idx)}
                    />
                  </TouchableOpacity>
                )
              ) : null}
            </View>
          );
        })}
      </View>
    </ModuleShell>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    borderRadius: 10,
    backgroundColor: colors.grey50,
  },
  placeholder: {
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.grey100,
    justifyContent: "center",
    alignItems: "center",
  },
  playOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});