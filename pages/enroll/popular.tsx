import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { Image } from "@granite-js/react-native";
import { colors, Slider, Text } from "@toss-design-system/react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import { useAppDispatch, useAppSelector } from "store";
import { travelSliceActions } from "../../redux/travle-slice";
import { RouteButton } from "../../components/route-button";

function usePreloadImages(urls: string[]) {
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;

    if (!urls || urls.length === 0) return;

    const prefetchSupported = typeof (Image as any).prefetch === "function";

    if (prefetchSupported) {
      const jobs = urls.map((url) =>
        (Image as any)
          .prefetch(url)
          .then(() => {
            if (!mounted) return;
            setLoadedMap((s) => ({ ...s, [url]: true }));
          })
          .catch(() => {
            if (!mounted) return;
            setLoadedMap((s) => ({ ...s, [url]: false }));
          })
      );

      Promise.all(jobs).catch(() => {});
    } else {
      const map: Record<string, boolean> = {};
      urls.forEach((u) => (map[u] = false));
      if (mounted) setLoadedMap(map);
    }

    return () => {
      mounted = false;
    };
  }, [urls]);

  return [loadedMap, setLoadedMap] as const;
}

type EnrollPopularProps = {
  contentRatio?: number;
};

export const Route = createRoute("/enroll/popular", {
  validateParams: (params) => params,
  component: EnrollPopular,
});

export function EnrollPopular({ contentRatio = 0.88 }: EnrollPopularProps) {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { popular } = useAppSelector((state) => state.travelSlice);

  const [value, setValue] = useState<number>(popular ?? 1);

  const imageList = useMemo(
    () => [
      "https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2Fasd.png?alt=media&token=3df1ca25-0ab7-4289-aec1-268172db19be",
      "https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F2.png?alt=media&token=a99b1cc7-2885-4051-8624-228f5e374de6",
      "https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F3.png?alt=media&token=cc71b542-6c97-4e91-b935-2fc9da9842fe",
      "https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F4.png?alt=media&token=4d270043-8980-4846-bd17-cdd9a4a5df12",
      "https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F5.png?alt=media&token=4952eea8-3f5c-44f6-bfca-45906ff9cc0c",
    ],
    []
  );

  const [loadedMap, setLoadedMap] = usePreloadImages(imageList);

  const currentIdx = Math.max(0, Math.min(imageList.length - 1, Math.ceil(value / 2) - 1));
  const currentUrl = imageList[currentIdx];

  const isCurrentLoaded = Boolean(loadedMap[currentUrl]);

  const handleHiddenImageLoad = (url: string) => {
    setLoadedMap((s) => ({ ...s, [url]: true }));
  };

  const allAttempted = imageList.length > 0 && imageList.every((u) => Object.prototype.hasOwnProperty.call(loadedMap, u));
  const allSucceeded = imageList.length > 0 && imageList.every((u) => loadedMap[u] === true);

  const [timedOut, setTimedOut] = useState(false);
  const MAX_WAIT_MS = 8000;

  useEffect(() => {
    setTimedOut(false);
    const t = setTimeout(() => {
      setTimedOut(true);
    }, MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  const shouldShowBlockingLoader = !allAttempted && !timedOut;

  // debounce dispatch for slider changes
  const debounceRef = useRef<number | null>(null);
  const DISPATCH_DEBOUNCE_MS = 300;

  const handleSliderChange = useCallback(
    (v: number) => {
      setValue(v);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current as unknown as number);
      }
      debounceRef.current = (setTimeout(() => {
        dispatch(travelSliceActions.updatePopluar(v));
        debounceRef.current = null;
      }, DISPATCH_DEBOUNCE_MS) as unknown) as number;
    },
    [dispatch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current as unknown as number);
    };
  }, []);

  if (shouldShowBlockingLoader) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color={colors.green300} />
        <Text style={{ marginTop: 12 }} typography="t6" color={colors.grey600}>
          이미지 로딩 중입니다...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginHorizontal: 24, backgroundColor: "#ffffff" }}>
      <View
        style={{
          position: "relative",
          width: 300 * contentRatio,
          height: 300 * contentRatio,
          alignSelf: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
        }}
      >
        {isCurrentLoaded ? (
          <Image
            source={{ uri: currentUrl }}
            style={{
              width: 300 * contentRatio,
              height: 300 * contentRatio,
              backgroundColor: "#ffffff",
            }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{
              width: 300 * contentRatio,
              height: 300 * contentRatio,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
            }}
          >
            <ActivityIndicator size="small" color={colors.green300} />
            <Image
              source={{ uri: currentUrl }}
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                opacity: 0,
                backgroundColor: "#ffffff",
              }}
              onLoad={() => handleHiddenImageLoad(currentUrl)}
              onError={() => setLoadedMap((s) => ({ ...s, [currentUrl]: false }))}
            />
          </View>
        )}

        {imageList.map((url) => {
          if (Object.prototype.hasOwnProperty.call(loadedMap, url)) return null;
          return (
            <Image
              key={`warm-${url}`}
              source={{ uri: url }}
              style={{ position: "absolute", width: 1, height: 1, opacity: 0, backgroundColor: "#ffffff" }}
              onLoad={() => handleHiddenImageLoad(url)}
              onError={() => setLoadedMap((s) => ({ ...s, [url]: false }))}
            />
          );
        })}
      </View>

      <Text style={{ marginTop: 8 }}>인기도: {value}</Text>

      <Slider value={value} onChange={handleSliderChange} min={1} max={10} step={1} color={colors.green300} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
        <Text typography="t5" fontWeight="medium" color={colors.grey700}>
          가장 덜 알려진
        </Text>
        <Text typography="t5" fontWeight="medium" color={colors.grey700}>
          가장 유명한
        </Text>
      </View>

      {navigation.getState()?.routes?.at(-1)?.name.includes("popular") && (
        <RouteButton
          onPress={() => {
            dispatch(travelSliceActions.updatePopluar(value));
          }}
        />
      )}
    </View>
  );
}