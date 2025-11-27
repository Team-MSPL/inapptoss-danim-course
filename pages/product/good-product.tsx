import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  Pressable,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import axiosAuth from "../../redux/api";
import {
  FixedBottomCTAProvider,
  Button,
  Icon,
  Text,
  colors,
  Badge,
  Skeleton,
  AnimateSkeleton,
  FixedBottomCTA,
} from "@toss-design-system/react-native";
import { parseKkdayCategoryKorean } from "../../kkday/kkdayCategoryToKorean";
import {
  getRefundTag,
  firstNLinesFromPackageDesc,
  formatPrice,
  getPriceInfo,
  earliestBookingText,
} from "../../components/product/good-product-function";
import { useProductStore } from "../../zustand/useProductStore";
import Pdml from "../../components/pdml"; // reuse PDML components as detail
import MapWebView from "../../components/product/map-webview";
import WebView from "@granite-js/native/react-native-webview";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Use import.meta.env directly as requested
const QUERY_PACKAGE_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryPackage`;
const QUERY_PRODUCT_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryProduct`;
const GOOGLE_API_KEY = import.meta.env.GOOGLE_API_KEY ?? "";

export const Route = createRoute("/product/good-product", {
  validateParams: (params) => params,
  component: ProductGoodProduct,
});

function PlanLabel({ index, pkg_name }: { index: number; pkg_name: string }) {
  return (
    <Text numberOfLines={1} fontWeight="semibold" typography="t4" style={{ textAlign: "left" }}>
      {`${pkg_name}`}
    </Text>
  );
}

function stripHtmlTags(html?: string) {
  if (!html) return "";
  const withoutScripts = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  const withBreaks = withoutStyles.replace(/<(\/)?(p|div|br|li|ul|ol|tr|table|h[1-6])[^>]*>/gi, "\n");
  const stripped = withBreaks.replace(/<\/?[^>]+(>|$)/g, "");
  return stripped.replace(/\n\s*\n+/g, "\n").trim();
}

/**
 * Decode a few common HTML entities and numeric entities.
 */
function decodeHTMLEntities(str: string) {
  if (!str) return str;
  let s = String(str);
  const entityMap: { [k: string]: string } = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
  };
  s = s.replace(/&[a-zA-Z0-9#]+;/g, (m) => {
    if (entityMap[m]) return entityMap[m];
    const numMatch = m.match(/^&#(\d+);$/);
    if (numMatch) {
      try {
        return String.fromCharCode(Number(numMatch[1]));
      } catch {
        return m;
      }
    }
    const hexMatch = m.match(/^&#x([0-9a-fA-F]+);$/);
    if (hexMatch) {
      try {
        return String.fromCharCode(parseInt(hexMatch[1], 16));
      } catch {
        return m;
      }
    }
    return m;
  });
  return s;
}

/**
 * Convert HTML introduction into array of cleaned lines.
 */
function formatIntroduction(html?: string): string[] {
  if (!html) return [];
  let s = String(html);

  // convert closing tags to newlines
  s = s.replace(/<\/li>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");

  // remove opening li tags and other tags
  s = s.replace(/<li[^>]*>/gi, "");
  s = s.replace(/<[^>]+>/gi, "");

  // decode entities
  s = decodeHTMLEntities(s);

  // normalize newlines and whitespace
  s = s.replace(/\r\n|\r/g, "\n");
  s = s.replace(/\n\s*\n+/g, "\n"); // collapse multiple newlines
  const lines = s
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return lines;
}

function buildImageUrl(src?: string | null) {
  if (!src) return null;
  const trimmed = String(src).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const cleaned = trimmed.replace(/^\/+/, "");
  return `https://image.kkday.com/v2/${cleaned}`;
}

function extractLocationFromModuleContent(moduleContent?: any) {
  if (!moduleContent) return null;
  const latlng = moduleContent?.latlng ?? null;
  if (latlng && (latlng.latitude || latlng.longitude)) return latlng;
  if (moduleContent?.latitude || moduleContent?.longitude) {
    return {
      latitude: moduleContent.latitude,
      longitude: moduleContent.longitude,
      map_snap_url: moduleContent?.map_snap_url ?? null,
      zoom_lv: moduleContent?.zoom_lv ?? null,
      desc: moduleContent?.location_name ?? moduleContent?.desc ?? null,
    };
  }
  const list = moduleContent?.list;
  if (Array.isArray(list)) {
    for (const entry of list) {
      const cand = entry?.latlng ?? entry?.content?.latlng ?? null;
      if (cand && (cand.latitude || cand.longitude)) return cand;
      const locationInfo = entry?.location_info ?? entry?.location_info?.properties;
      if (locationInfo) {
        const cand2 = locationInfo?.latlng ?? null;
        if (cand2 && (cand2.latitude || cand2.longitude)) return cand2;
      }
    }
  }
  const propsLatlng = moduleContent?.properties?.latlng;
  if (propsLatlng && (propsLatlng.latitude || propsLatlng.longitude)) return propsLatlng;
  return null;
}

/**
 * Native renderer for package description & refund policy.
 * Returns an array of React nodes (Text) formatted using typography="t6" and grey800.
 * This will be used both inline (inside card) and inside modal popup.
 */
function renderPackageNodes(pkg: any): JSX.Element[] {
  const modRoot = pkg?.description_module ?? {};
  const pkgDescModule = modRoot?.PMDL_PACKAGE_DESC ?? null;
  const refundModule = modRoot?.PMDL_REFUND_POLICY ?? null;

  const nodes: JSX.Element[] = [];
  let keyIndex = 0;

  if (pkgDescModule && Array.isArray(pkgDescModule?.content?.list)) {
    for (const entry of pkgDescModule.content.list) {
      const raw = String(entry?.desc ?? "");
      const text = decodeHTMLEntities(stripHtmlTags(raw));
      if (text) {
        nodes.push(
          <Text key={`pkg-desc-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginBottom: 8 }}>
            {text}
          </Text>
        );
      }
    }
  }

  if (refundModule) {
    const props = refundModule?.content?.properties ?? refundModule?.content ?? null;
    if (props) {
      nodes.push(
        <Text key={`refund-title-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginTop: 8, marginBottom: 6, fontWeight: "600" }}>
          취소 규정
        </Text>
      );

      // Try structured partial_refund first (array under properties.partial_refund.list or properties.partial_refund)
      const prList =
        (Array.isArray(props.partial_refund?.list) && props.partial_refund.list) ||
        (Array.isArray(props.partial_refund) && props.partial_refund) ||
        null;

      if (prList && prList.length > 0) {
        for (const it of prList) {
          const d = it?.desc ?? (typeof it === "string" ? it : JSON.stringify(it));
          const text = decodeHTMLEntities(stripHtmlTags(String(d)));
          nodes.push(
            <Text key={`refund-line-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
              {`• ${text}`}
            </Text>
          );
        }
      } else if (props.partial_refund && typeof props.partial_refund === "object") {
        const pr = props.partial_refund;
        if (Array.isArray(pr?.list) && pr.list.length > 0) {
          for (const it of pr.list) {
            const d = it?.desc ?? (typeof it === "string" ? it : JSON.stringify(it));
            nodes.push(
              <Text key={`refund-pr-list-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
                {`• ${decodeHTMLEntities(stripHtmlTags(String(d)))}`}
              </Text>
            );
          }
        } else if (pr?.desc) {
          nodes.push(
            <Text key={`refund-pr-desc-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
              {decodeHTMLEntities(stripHtmlTags(String(pr.desc)))}
            </Text>
          );
        } else {
          if (pr?.fee_type || pr?.display_rule || pr?.fee) {
            const parts: string[] = [];
            if (pr.fee_type) parts.push(String(pr.fee_type));
            if (pr.display_rule) {
              const dr = pr.display_rule;
              if (dr.day_min !== undefined || dr.day_max !== undefined) {
                const min = dr.day_min !== undefined ? `from ${dr.day_min}` : "";
                const max = dr.day_max !== undefined ? `to ${dr.day_max}` : "";
                parts.push(`display_rule ${min} ${max}`.trim());
              } else if (dr.value !== undefined) {
                parts.push(`rule value ${String(dr.value)}`);
              }
            }
            if (parts.length > 0) {
              nodes.push(
                <Text key={`refund-pr-meta-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
                  {parts.join(" · ")}
                </Text>
              );
            } else {
              nodes.push(
                <Text key={`refund-pr-raw-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
                  {JSON.stringify(pr)}
                </Text>
              );
            }
          } else {
            nodes.push(
              <Text key={`refund-none-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
                취소 규정 정보가 제공되지 않았습니다.
              </Text>
            );
          }
        }
      } else if (typeof props.partial_refund === "string") {
        const text = decodeHTMLEntities(stripHtmlTags(String(props.partial_refund)));
        nodes.push(
          <Text key={`refund-str-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
            {text}
          </Text>
        );
      } else {
        if (props.policy_type?.desc || props.policy_type?.title) {
          const title = props.policy_type?.title ?? "";
          const desc = props.policy_type?.desc ?? "";
          nodes.push(
            <Text key={`refund-policy-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginTop: 4 }}>
              {title ? `${title} ` : ""}{desc ? decodeHTMLEntities(stripHtmlTags(String(desc))) : ""}
            </Text>
          );
        } else {
          nodes.push(
            <Text key={`refund-generic-${keyIndex++}`} typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
              취소 규정 정보가 제공되지 않았습니다.
            </Text>
          );
        }
      }
    }
  }

  if (nodes.length === 0) {
    nodes.push(
      <Text key="no-desc" typography="t6" color={colors.grey800}>
        설명 정보가 없습니다.
      </Text>
    );
  }

  return nodes;
}

export default function ProductGoodProduct() {
  // --- HOOKS (always executed, never conditional) ---
  const navigation = useNavigation();
  const params = Route.useParams();

  const [product, setProduct] = useState<any>(params.product ?? null);
  const [pkgList, setPkgList] = useState<any[]>([]);
  const [selectedPkgNo, setSelectedPkgNo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);

  const setPdt = useProductStore((state) => state.setPdt);
  const flatListRef = useRef<FlatList>(null);
  const [imgIndex, setImgIndex] = useState(0);

  const [pdmlExpanded, setPdmlExpanded] = useState(false);

  // modal state for "설명 보기"
  const [pkgModalVisible, setPkgModalVisible] = useState(false);
  const [modalPkg, setModalPkg] = useState<any | null>(null);

  useEffect(() => {
    async function fetchProductDetail() {
      if (product && product.detail_loaded) return;
      setLoading(true);
      try {
        const res = await axiosAuth.post(
          QUERY_PRODUCT_API,
          {
            prod_no: params.product?.prod_no ?? params.prod_no,
          },
          { headers: { "Content-Type": "application/json" } }
        );

        const resData = res?.data ?? {};

        if (resData?.result === "02" || resData?.result_code === "02") {
          Alert.alert("지원 불가", "해당 상품은 현재 어플리케이션에서 지원하지 않는 상품입니다.");
          setLoading(false);
          navigation.goBack();
          return;
        }

        if (resData && resData.prod && resData.pkg) {
          const merged = { ...params.product, ...resData.prod, detail_loaded: true };
          setProduct(merged);
          setPkgList(resData.pkg);

          const firstAvailable = resData.pkg.find((p: any) => !!p.sale_s_date && !!p.sale_e_date) ?? resData.pkg[0];
          setSelectedPkgNo(firstAvailable?.pkg_no ?? null);

          try {
            setPdt(merged);
          } catch (e) {
            /* ignore */
          }
        } else {
          console.warn("[ProductGoodProduct] QueryProduct unexpected response", resData);
        }
      } catch (e: any) {
        console.error("[ProductGoodProduct] QueryProduct error", e);
        Alert.alert("오류", e?.message ?? "상품 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    if (!product || !product.detail_loaded) fetchProductDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, product, setPdt]);

  // NEW: if pkgList is empty after product loaded, show alert + goBack
  useEffect(() => {
    if (!loading && product?.detail_loaded && Array.isArray(pkgList) && pkgList.length === 0) {
      Alert.alert(
        "알림",
        "패키지 수량이 마감되었습니다.",
        [
          {
            text: "확인",
            onPress: () => {
              try {
                navigation.goBack();
              } catch {
                // ignore
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [loading, product, pkgList, navigation]);

  // Derived values (hooks-free)
  const discountPrice = typeof product?.b2b_min_price === "number" ? product.b2b_min_price : Number(product?.b2b_min_price || 0);
  const originalPrice = typeof product?.b2c_min_price === "number" ? product.b2c_min_price : Number(product?.b2c_min_price || 0);
  const discountAmount = originalPrice > discountPrice ? (originalPrice - discountPrice) : 0;

  let guideLabel: string | null = null;
  if (product?.guide_lang_list) {
    const langs = product.guide_lang_list;
    if (langs.includes("ko") && langs.includes("en")) guideLabel = "영어/한국어 가이드";
    else if (langs.includes("ko")) guideLabel = "한국어 가이드";
    else if (langs.includes("en")) guideLabel = "영어 가이드";
  }

  const hasPickupTag = Array.isArray(product?.tag) && product.tag.includes("TAG_5_2");
  const infoList = [
    ...(hasPickupTag ? [{ icon: "icon-car-checkup", text: "픽업 가능" }] : []),
    ...(guideLabel ? [{ icon: "icon-earth", text: guideLabel }] : []),
    ...(product?.is_cancel_free ? [{ icon: "icon-coin-yellow", text: "무료 취소" }] : []),
  ];

  const images = Array.isArray(product?.img_list) && product.img_list.length > 0
    ? product.img_list
    : [product?.prod_img_url || "https://via.placeholder.com/400x240?text=No+Image"];

  const categoryList = parseKkdayCategoryKorean(product?.product_category).filter(Boolean);

  const extractDateSettingPayload = (prod: any) => {
    const ds = prod?.go_date_setting;
    const payload: { date_setting?: string; min_date?: number; max_date?: number } = {};
    if (!ds) return payload;
    if (ds?.type != null) payload.date_setting = String(ds.type);
    const days = ds?.days;
    if (days && typeof days === "object") {
      const rawMin = days?.min;
      const rawMax = days?.max;
      const minNum = Number(rawMin);
      const maxNum = Number(rawMax);
      if (Number.isFinite(minNum)) payload.min_date = Math.max(0, Math.floor(minNum));
      if (Number.isFinite(maxNum)) payload.max_date = Math.max(0, Math.floor(maxNum));
    }
    return payload;
  };

  // Helper to find SKU index for a selection map (used for ticket combos)
  const findSkuIndexForSelection = (skus: any[], selection: Record<string, string>): number | null => {
    const entries = Object.entries(selection);
    if (entries.length === 0) return null;
    for (let i = 0; i < skus.length; i++) {
      const sku = skus[i];
      const refs: Array<{ spec_item_id?: string; spec_value_id?: string }> = sku?.specs_ref ?? [];
      const ok = entries.every(([spec_oid, spec_item_oid]) =>
        refs.some(r => String(r.spec_item_id) === String(spec_oid) && String(r.spec_value_id) === String(spec_item_oid))
      );
      if (ok) return i;
    }
    return null;
  };

  // Reservation handlers kept unchanged
  const handleReservePress = async () => {
    if (!selectedPkgNo) return;
    setReservationLoading(true);
    try {
      const res = await axiosAuth.post(QUERY_PACKAGE_API, {
        prod_no: product?.prod_no ?? params.prod_no,
        pkg_no: selectedPkgNo,
        locale: "kr",
        state: "KR",
      }, { headers: { "Content-Type": "application/json" } });

      const data = res.data ?? {};

      if (data?.result === "02" || data?.result_code === "02") {
        Alert.alert("지원 불가", "해당 상품은 현재 어플리케이션에서 지원하지 않는 상품입니다.");
        setReservationLoading(false);
        return;
      }
      if (data?.result === "03" || data?.result_code === "03") {
        Alert.alert("알림", "해당 여행 상품은 현재 판매가 종료되었습니다.");
        setReservationLoading(false);
        return;
      }
      if (!Array.isArray(data?.item) || data.item.length === 0) {
        Alert.alert("알림", "해당 패키지의 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        setReservationLoading(false);
        return;
      }

      const firstItem = data.item[0];
      const itemUnit =
        firstItem?.unit ??
        firstItem?.unit_price ??
        firstItem?.b2b_price ??
        firstItem?.b2c_price ??
        null;

      const specs = firstItem?.specs ?? [];
      const skus = firstItem?.skus ?? [];
      const payloadDateSetting = extractDateSettingPayload(product ?? {});

      // NEW: If the only spec is the ticket spec ("티켓 종류"), handle it here and DO NOT navigate to select-spec.
      const isOnlyTicketSpec = Array.isArray(specs) && specs.length === 1 && typeof specs[0]?.spec_title === "string" && specs[0].spec_title.trim().toLowerCase() === "티켓 종류";

      if (isOnlyTicketSpec) {
        const ticketSpec = specs[0];
        const combos: Array<{ selectedSpecs: Record<string, string>; matchedSkuIndex: number; matchedSku: any }> = [];

        for (const ticketItem of ticketSpec.spec_items ?? []) {
          const sel: Record<string, string> = { [ticketSpec.spec_oid]: ticketItem.spec_item_oid };
          const skuIndex = findSkuIndexForSelection(skus, sel);
          if (skuIndex != null) {
            combos.push({
              selectedSpecs: sel,
              matchedSkuIndex: skuIndex,
              matchedSku: skus[skuIndex],
            });
          }
        }

        if (combos.length === 0) {
          Alert.alert('조합 없음', '상품의 티켓 조합을 찾을 수 없습니다. 다른 옵션을 선택해주세요.');
          setReservationLoading(false);
          return;
        }

        navigation.navigate("/product/reservation", {
          prod_no: product?.prod_no ?? params.prod_no,
          prod_name: product?.prod_name ?? params.prod_name,
          pkg_no: selectedPkgNo,
          pkgData: data,
          ...(payloadDateSetting.date_setting ? { date_setting: payloadDateSetting.date_setting } : {}),
          ...(payloadDateSetting.min_date !== undefined ? { min_date: payloadDateSetting.min_date } : {}),
          ...(payloadDateSetting.max_date !== undefined ? { max_date: payloadDateSetting.max_date } : {}),
          has_ticket_combinations: true,
          ticket_combinations: combos.map(c => ({
            selectedSpecs: c.selectedSpecs,
            matchedSkuIndex: c.matchedSkuIndex,
            matchedSku: c.matchedSku,
          })),
          ...(itemUnit != null ? { item_unit: itemUnit } : {}),
        });

        setReservationLoading(false);
        return;
      }

      if (Array.isArray(specs) && specs.length === 1) {
        const onlySpec = specs[0];
        if (onlySpec?.spec_oid === "spec-single") {
          navigation.navigate("/product/reservation", {
            prod_no: product?.prod_no ?? params.prod_no,
            prod_name: product?.prod_name ?? params.prod_name,
            pkg_no: selectedPkgNo,
            pkgData: data,
            ...(payloadDateSetting.date_setting ? { date_setting: payloadDateSetting.date_setting } : {}),
            ...(payloadDateSetting.min_date !== undefined ? { min_date: payloadDateSetting.min_date } : {}),
            ...(payloadDateSetting.max_date !== undefined ? { max_date: payloadDateSetting.max_date } : {}),
            ...(itemUnit != null ? { item_unit: itemUnit } : {}),
          });
          setReservationLoading(false);
          return;
        }
      }

      if (Array.isArray(specs) && specs.length >= 1) {
        navigation.navigate("/product/select-spec", {
          prod_no: product?.prod_no ?? params.prod_no,
          prod_name: product?.prod_name ?? params.prod_name,
          pkg_no: selectedPkgNo,
          pkgData: data,
          ...(payloadDateSetting.date_setting ? { date_setting: payloadDateSetting.date_setting } : {}),
          ...(payloadDateSetting.min_date !== undefined ? { min_date: payloadDateSetting.min_date } : {}),
          ...(payloadDateSetting.max_date !== undefined ? { max_date: payloadDateSetting.max_date } : {}),
          ...(itemUnit != null ? { item_unit: itemUnit } : {}),
        });
        setReservationLoading(false);
        return;
      }

      // Fallback
      navigation.navigate("/product/select-spec", {
        prod_no: product?.prod_no ?? params.prod_no,
        prod_name: product?.prod_name ?? params.prod_name,
        pkg_no: selectedPkgNo,
        pkgData: data,
        ...(payloadDateSetting.date_setting ? { date_setting: payloadDateSetting.date_setting } : {}),
        ...(payloadDateSetting.min_date !== undefined ? { min_date: payloadDateSetting.min_date } : {}),
        ...(payloadDateSetting.max_date !== undefined ? { max_date: payloadDateSetting.max_date } : {}),
        ...(itemUnit != null ? { item_unit: itemUnit } : {}),
      });
    } catch (err: any) {
      console.error("[ProductGoodProduct] QueryPackage error", err);
      const msg = err?.response?.data?.result_msg ?? err?.message ?? "패키지 정보를 불러오는 중 오류가 발생했습니다.";
      Alert.alert("오류", msg);
    } finally {
      setReservationLoading(false);
    }
  };

  const goReservation = () => {
    if (!selectedPkgNo) {
      console.log("패키지넘거바없음")
      return;
    }
    handleReservePress();
  };

  const onSelectPkg = (pkg_no: number, soldOut: boolean) => {
    if (soldOut) return;
    if (selectedPkgNo === pkg_no) {
      setSelectedPkgNo(null);
    } else {
      setSelectedPkgNo(pkg_no);
    }
  };

  const openPkgModal = (pkg: any) => {
    setModalPkg(pkg);
    setPkgModalVisible(true);
  };
  const closePkgModal = () => {
    setPkgModalVisible(false);
    setModalPkg(null);
  };

  // PDML root + ordering
  const modulesRoot = product?.description_module_for_render ?? product?.description_module ?? {};
  const orderedModuleKeys = useMemo(() => {
    const prefer = [
      "PMDL_EXPERIENCE_LOCATION",
      "PMDL_EXCHANGE",
      "PMDL_INC_NINC",
      "PMDL_NOTICE",
      "PMDL_PURCHASE_SUMMARY",
      "PMDL_EXCHANGE_LOCATION",
      "PMDL_USE_VALID",
      "PMDL_WIFI",
      "PMDL_GRAPHIC",
    ];
    const allKeys = Object.keys(modulesRoot ?? {});
    const rest = allKeys.filter((k) => !prefer.includes(k));
    return [...prefer.filter((k) => allKeys.includes(k)), ...rest];
  }, [modulesRoot]);

  const renderDots = () => (
    <View style={{ flexDirection: "row", justifyContent: "center", position: "absolute", bottom: 10, width: "100%" }}>
      {images.map((_, idx) => (
        <View
          key={idx}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: idx === imgIndex ? colors.blue500 : colors.grey200,
            marginHorizontal: 4,
          }}
        />
      ))}
    </View>
  );

  // --- RENDER (single return; conditionally show skeleton/content to keep hooks stable) ---
  return (
    <View style={{flex: 1, backgroundColor: "#fff"}}>
      <FixedBottomCTAProvider>
        { /* Top: if loading show skeleton block, otherwise main content.
             Note: we do NOT early-return — this keeps hook order stable */ }
        {loading ? (
          <AnimateSkeleton delay={400} withGradient={true} withShimmer={true}>
            <Skeleton height={291} width={"100%"} style={{ borderRadius: 0 }} />
            <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 8 }}>
              <Skeleton height={26} width={180} style={{ marginBottom: 16, borderRadius: 8 }} />
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 24 }}>
                {[...Array(3)].map((_, idx) => (
                  <Skeleton
                    key={idx}
                    height={24}
                    width={60 + idx * 12}
                    style={{
                      marginRight: 8,
                      marginBottom: 8,
                      borderRadius: 12
                    }}
                  />
                ))}
              </View>
            </View>
            <View style={{ paddingHorizontal: 24, marginBottom: 10 }}>
              <View style={{ flexDirection: "column", alignItems: "flex-end" }}>
                <Skeleton height={20} width={90} style={{ marginBottom: 8, borderRadius: 6 }} />
                <Skeleton height={28} width={120} style={{ borderRadius: 8 }} />
              </View>
            </View>
            <View style={{ paddingHorizontal: 24, marginBottom: 16, marginTop: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {[...Array(2)].map((_, idx) => (
                  <Skeleton
                    key={idx}
                    height={22}
                    width={80 + idx * 20}
                    style={{ marginRight: 18, borderRadius: 10 }}
                  />
                ))}
              </View>
            </View>
            <View style={{padding: 24}}>
              <Skeleton height={60} width={"100%"} style={{ borderRadius: 8 }} />
            </View>
          </AnimateSkeleton>
        ) : (
          <>
            {/* images, header, categories */}
            <View style={{ width: '100%', height: 291, backgroundColor: '#eee' }}>
              <FlatList
                ref={flatListRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                data={images}
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={({ item }) => (
                  <View style={{ width: SCREEN_WIDTH, height: 291 }}>
                    <Image
                      source={{ uri: item }}
                      style={{ width: '100%', height: 291 }}
                      resizeMode="cover"
                    />
                  </View>
                )}
                onMomentumScrollEnd={e => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setImgIndex(idx);
                }}
              />
              {renderDots()}
            </View>

            <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 8 }}>
              <Text typography="t2" color={colors.black} fontWeight='bold' style={{ marginBottom: 16 }}>
                {product?.prod_name || product?.name}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 24 }}>
                {categoryList.length > 0 &&
                  categoryList.map((cat, idx) => (
                    <Badge size="small" type={'blue'} badgeStyle="weak" key={cat + idx}>
                      {cat}
                    </Badge>
                  ))}
              </View>
            </View>

            {/* 가격, info, intro */}
            <View style={{ paddingHorizontal: 24, marginBottom: 10 }}>
              <View style={{ flexDirection: "column", justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                {discountAmount > 0 && (
                  <View style={{alignItems: 'flex-end', marginRight: 24}}>
                    <Text typography='t5' fontWeight='medium' color={colors.red400} style={{textAlign: "right" }}>
                      {(discountAmount).toLocaleString()}원 할인
                    </Text>
                    <Text typography='t5' fontWeight='medium' color={colors.grey400} style={{ textDecorationLine: "line-through", textAlign: "right"}}>
                      {originalPrice.toLocaleString()}원~
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", alignItems: 'flex-end' }}>
                  <Text color={colors.red400} typography='t5' fontWeight='medium' style={{marginRight: 6}}>
                    최저가
                  </Text>
                  <Text color={colors.black} typography='t2' fontWeight='bold' >
                    {discountPrice.toLocaleString()}원~
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ paddingHorizontal: 24, marginBottom: 16, marginTop: 8 }}>
              <View style={{ flexDirection: "column", alignItems: "flex-start", gap: 6}}>
                {infoList.map((item, idx) => (
                  <View key={idx} style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    paddingVertical: 8,
                  }}>
                    <Icon name={item.icon} size={24} />
                    <Text typography="t5" color={colors.black} fontWeight='medium' style={{marginLeft: 8}}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{backgroundColor: colors.grey100, height: 18, width: '100%'}}/>
            <View style={{padding: 24}}>
              {/* Render introduction with bullet handling and HTML entity decoding */}
              {(() => {
                const lines = formatIntroduction(product?.introduction ?? "");
                if (lines.length === 0) return null;
                return lines.map((ln, i) => (
                  <Text key={i} typography="t5" fontWeight="medium" color={colors.grey800} style={{ marginBottom: 8 }}>
                    {`• ${ln}`}
                  </Text>
                ));
              })()}
            </View>

            <View style={{backgroundColor: colors.grey100, height: 18, width: '100%'}}/>

            {/* 옵션(패키지) 선택 UI */}
            <View style={{ padding: 24 }}>
              <Text typography="t4" fontWeight="bold" style={{ marginBottom: 18 }}>
                옵션 선택
              </Text>
              {pkgList.map((pkg, idx) => {
                const isSoldOut = !(pkg.sale_s_date && pkg.sale_e_date);
                const isSelected = selectedPkgNo === pkg.pkg_no && !isSoldOut;

                return (
                  <View key={pkg.pkg_no} style={{ marginBottom: 16 }}>
                    <TouchableOpacity
                      onPress={() => onSelectPkg(pkg.pkg_no, isSoldOut)}
                      style={{
                        borderWidth: 1,
                        borderColor: isSoldOut ? colors.grey200 : (isSelected ? colors.blue500 : colors.grey200),
                        borderRadius: 12,
                        backgroundColor: isSoldOut ? "#fff" : (isSelected ? colors.blue50 : "#fafbfc"),
                        padding: 18,
                        opacity: isSoldOut ? 0.7 : 1,
                      }}
                      activeOpacity={isSoldOut ? 1 : 0.8}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                        <PlanLabel index={idx} pkg_name={pkg.pkg_name} />
                      </View>

                      <View style={{ marginTop: 10 }}>
                        {getRefundTag(pkg) && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Icon name="icon-check" size={24} color={colors.blue500} />
                            <Text typography="t6" color={colors.grey800} style={{ marginLeft: 8 }}>{getRefundTag(pkg)}</Text>
                          </View>
                        )}

                        {earliestBookingText(pkg) && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Icon name="icon-calendar-clock" size={24} />
                            <Text typography="t6" color={colors.grey800} style={{ marginLeft: 8 }}>{earliestBookingText(pkg)}</Text>
                          </View>
                        )}

                        {firstNLinesFromPackageDesc(pkg, 3).length > 0 && (
                          <View style={{ marginTop: 6 }}>
                            {firstNLinesFromPackageDesc(pkg, 3).map((line, i) => (
                              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                                <Text typography="t6" color={colors.grey800} style={{ marginRight: 8 }}>•</Text>
                                <Text typography="t6" color={colors.grey800} style={{ flex: 1 }}>{line}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Inline: 설명 button (opens modal) */}
                        <View style={{ marginTop: 8 }}>
                          <Pressable onPress={() => openPkgModal(pkg)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text typography="t6" color={colors.blue600} fontWeight="bold">설명 보기</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
                        <View style={{ alignItems: 'flex-start' }}>
                          {getPriceInfo(pkg).hasDiscount ? (
                            <>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text typography="t6" color={colors.grey400} style={{ textDecorationLine: 'line-through', marginRight: 8 }}>
                                  {formatPrice(getPriceInfo(pkg).original)}원
                                </Text>
                                <Text typography="t6" color={'#3b5afe'} fontWeight="semibold">
                                  {discountAmount >= 10000
                                    ? `${formatPrice(discountAmount)}원 할인`
                                    : `${getPriceInfo(pkg).discountPercent}% 할인`}
                                </Text>
                              </View>
                              <Text typography="t5" fontWeight="bold" style={{ marginTop: 6 }}>{formatPrice(getPriceInfo(pkg).display)}원</Text>
                            </>
                          ) : (
                            <Text typography="t5" fontWeight="bold">{formatPrice(getPriceInfo(pkg).display)}원</Text>
                          )}
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Button
                            type={isSoldOut ? 'dark' : 'primary'}
                            size="medium"
                            style="fill"
                            onPress={() => { if (!isSoldOut) onSelectPkg(pkg.pkg_no, isSoldOut); }}
                            disabled={isSoldOut}
                          >
                            {isSoldOut ? '매진' : (selectedPkgNo === pkg.pkg_no ? '선택됨' : '선택하기')}
                          </Button>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* divider line + PDML section */}
            <View style={{ height: 12, backgroundColor: colors.grey100, width: '100%' }} />

            {/* PDML toggle and content */}
            <View style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
              <TouchableOpacity
                onPress={() => setPdmlExpanded((v) => !v)}
                style={{
                  alignSelf: "center",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                }}
                activeOpacity={0.8}
              >
                <Text typography="t5" color={colors.blue600} fontWeight="bold" style={{ textAlign: "center" }}>
                  {pdmlExpanded ? "상품 설명 접기" : "상품 설명 전체보기"}
                </Text>
                <Icon
                  name={pdmlExpanded ? "icon-chevron-up" : "icon-chevron-down"}
                  size={18}
                  color={colors.teal400}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>

            {pdmlExpanded ? (
              <View>
                {orderedModuleKeys.map((key) => {
                  const moduleData = modulesRoot[key];
                  if (!moduleData) return null;

                  const PdmlComponent = (Pdml as any)[key];
                  if (PdmlComponent) {
                    return <PdmlComponent key={key} moduleKey={key} moduleData={moduleData} googleApiKey={GOOGLE_API_KEY} />;
                  }

                  const normalizedKey = key.replace(/\./g, "_");
                  const PdmlComponent2 = (Pdml as any)[normalizedKey];
                  if (PdmlComponent2) {
                    return <PdmlComponent2 key={key} moduleKey={key} moduleData={moduleData} googleApiKey={GOOGLE_API_KEY} />;
                  }

                  // fallback: simple safe render for text/list/media
                  const moduleTitle = moduleData.module_title ?? moduleData.title ?? key;
                  const content = moduleData.content ?? moduleData;
                  if (moduleData?.use_html && content?.type === "text" && content?.desc) {
                    const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body>${content.desc}</body></html>`;
                    return (
                      <View style={{ paddingHorizontal: 20, marginBottom: 40 }} key={key}>
                        <Text typography="t6" style={{ marginBottom: 8, color: colors.grey800, fontSize: 16, lineHeight: 22, fontWeight: "600" }}>{moduleTitle}</Text>
                        <View style={{ height: 200, marginTop: 8, borderRadius: 8, overflow: "hidden", backgroundColor: colors.grey50 }}>
                          <WebView originWhitelist={["*"]} source={{ html }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled />
                        </View>
                      </View>
                    );
                  }

                  if (content?.type === "text" && content?.desc) {
                    return (
                      <View style={{ paddingHorizontal: 20, marginBottom: 40 }} key={key}>
                        <Text typography="t6" style={{ marginBottom: 8, color: colors.grey800, fontSize: 16, lineHeight: 22, fontWeight: "600" }}>{moduleTitle}</Text>
                        <Text typography="t7" color={colors.grey700}>{stripHtmlTags(content.desc)}</Text>
                      </View>
                    );
                  }

                  if (Array.isArray(content?.list) && content.list.length > 0) {
                    return (
                      <View key={key} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                        <Text typography="t6" style={{ marginBottom: 8, color: colors.grey800, fontSize: 16, lineHeight: 22, fontWeight: "600" }}>{moduleTitle}</Text>
                        {content.list.map((it: any, idx: number) => {
                          const desc = it?.desc ?? "";
                          const mediaArr = Array.isArray(it?.media) ? it.media : [];
                          const first = mediaArr[0]?.source_content ?? null;
                          const uri = buildImageUrl(first);
                          return (
                            <View key={idx} style={{ marginBottom: 16 }}>
                              {desc ? <Text typography="t7" color={colors.grey800} style={{ marginBottom: 8 }}>{stripHtmlTags(desc)}</Text> : null}
                              {uri ? <Image source={{ uri }} style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 8, backgroundColor: colors.grey50 }} resizeMode="cover" /> : null}
                            </View>
                          );
                        })}
                      </View>
                    );
                  }

                  return null;
                })}
              </View>
            ) : null}
          </>
        )}

        <FixedBottomCTA onPress={goReservation}>
          {reservationLoading ? '로딩 중...' : '예약하기'}
        </FixedBottomCTA>

        {/* 중앙 카드형 Package Modal: 기존 모달 블록을 이 코드로 교체하세요 */}
        <Modal visible={pkgModalVisible} animationType="fade" transparent onRequestClose={closePkgModal}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 16 }}>
            {/* 배경 탭으로 닫기 */}
            <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={closePkgModal} />

            {/* 중앙 카드 */}
            <View
              style={{
                width: "92%",
                maxHeight: "80%",
                borderWidth: 1,
                borderColor: (() => {
                  if (!modalPkg) return colors.grey200;
                  const isSoldOut = !(modalPkg.sale_s_date && modalPkg.sale_e_date);
                  const isSelected = selectedPkgNo === modalPkg.pkg_no && !isSoldOut;
                  return isSoldOut ? colors.grey200 : (isSelected ? colors.blue500 : colors.grey200);
                })(),
                borderRadius: 12,
                backgroundColor: (() => {
                  return "#fff"
                })(),
                padding: 18,
                opacity: (() => {
                  if (!modalPkg) return 1;
                  const isSoldOut = !(modalPkg.sale_s_date && modalPkg.sale_e_date);
                  return 1;
                })(),
              }}
            >
              {/* 헤더 */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text typography="t5" fontWeight="bold" color={colors.grey900}>옵션 설명</Text>
                <Pressable onPress={closePkgModal} hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}>
                  <Icon name="icon-close" size={20} />
                </Pressable>
              </View>

              <View style={{ height: 1, backgroundColor: colors.grey100, marginBottom: 12 }} />

              {/* 내용 영역 (스크롤) */}
              <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
                {modalPkg ? (
                  // renderPackageNodes는 반드시 React element(예: <View>...</View>) 를 반환하도록 구현되어 있어야 합니다.
                  renderPackageNodes(modalPkg)
                ) : (
                  <Text typography="t6" color={colors.grey800}>불러오는 중...</Text>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
      </FixedBottomCTAProvider>
    </View>
  );
}