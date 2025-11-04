import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  ScrollView,
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
  AnimateSkeleton, FixedBottomCTA,
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
import Pdml from "../../components/pdml"; // reuse PDML components from detail
import MapWebView from "../../components/product/map-webview";
import WebView from "@granite-js/native/react-native-webview";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Use import.meta.env as requested
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

export default function ProductGoodProduct() {
  // Hooks (top-level)
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
  // end hooks

  useEffect(() => {
    async function fetchProductDetail() {
      if (product && product.detail_loaded) return;
      setLoading(true);
      try {
        const res = await axiosAuth.post(
          QUERY_PRODUCT_API,
          {
            prod_no: params.product?.prod_no ?? params.prod_no,
            locale: "kr",
            state: "KR",
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
  }, [params, product]);

  // Derived values
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

  // Reservation handlers
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
        return;
      }
      if (data?.result === "03" || data?.result_code === "03") {
        Alert.alert("알림", "해당 여행 상품은 현재 판매가 종료되었습니다.");
        return;
      }
      if (!Array.isArray(data?.item) || data.item.length === 0) {
        Alert.alert("알림", "해당 패키지의 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const firstItem = data.item[0];
      const itemUnit =
        firstItem?.unit ??
        firstItem?.unit_price ??
        firstItem?.b2b_price ??
        firstItem?.b2c_price ??
        null;

      const specs = firstItem?.specs;
      const payloadDateSetting = extractDateSettingPayload(product ?? {});

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
    if (!selectedPkgNo) return;
    handleReservePress();
  };

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

  if (loading || !product) {
    return (
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
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: "#fff"}}>
      <FixedBottomCTAProvider>
        {/* 이미지 캐러셀 */}
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

        {/* 할인/가격 */}
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

        {/* 안내 아이콘/텍스트 */}
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
          <Text typography='t5' fontWeight='medium' style={{ marginBottom: 30 }}>
            {(product.introduction ?? "")
              .replace(/<[^>]+>/g, "")
              .replace(/&nbsp;/g, " ")
              .replace(/\s+/g, " ")
              .trim()}
          </Text>
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
              <TouchableOpacity
                key={pkg.pkg_no}
                onPress={() => { if (!isSoldOut) setSelectedPkgNo(pkg.pkg_no); }}
                style={{
                  borderWidth: 1,
                  borderColor: isSoldOut ? colors.grey200 : (isSelected ? colors.blue500 : colors.grey200),
                  borderRadius: 12,
                  backgroundColor: isSoldOut ? "#fff" : (isSelected ? colors.blue50 : "#fafbfc"),
                  marginBottom: 16,
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
                      <Text style={{ marginLeft: 8, color: colors.grey600 }}>{getRefundTag(pkg)}</Text>
                    </View>
                  )}

                  {earliestBookingText(pkg) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Icon name="icon-calendar-clock" size={24} />
                      <Text style={{ marginLeft: 8, color: colors.grey600 }}>{earliestBookingText(pkg)}</Text>
                    </View>
                  )}

                  {firstNLinesFromPackageDesc(pkg, 3).length > 0 && (
                    <View style={{ marginTop: 6 }}>
                      {firstNLinesFromPackageDesc(pkg, 3).map((line, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                          <Icon name="" size={24} />
                          <Text style={{ marginRight: 8, color: colors.grey600 }}>•</Text>
                          <Text style={{ flex: 1, color: colors.grey600 }}>{line}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
                  <View style={{ alignItems: 'flex-start' }}>
                    {getPriceInfo(pkg).hasDiscount ? (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: colors.grey300, textDecorationLine: 'line-through', marginRight: 8 }}>
                            {formatPrice(getPriceInfo(pkg).original)}원
                          </Text>
                          <Text style={{ color: '#3b5afe', fontWeight: '600' }}>
                            {discountAmount >= 10000
                              ? `${formatPrice(discountAmount)}원 할인`
                              : `${getPriceInfo(pkg).discountPercent}% 할인`}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 6 }}>{formatPrice(getPriceInfo(pkg).display)}원</Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: 18, fontWeight: '700' }}>{formatPrice(getPriceInfo(pkg).display)}원</Text>
                    )}
                  </View>

                  <Button
                    type={isSoldOut ? 'dark' : 'primary'}
                    size="medium"
                    style="fill"
                    onPress={() => { if (!isSoldOut) setSelectedPkgNo(pkg.pkg_no); }}
                    disabled={isSoldOut}
                  >
                    {isSoldOut ? '매진' : (selectedPkgNo === pkg.pkg_no ? '선택됨' : '선택하기')}
                  </Button>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* divider line + PDML section (옵션 선택 아래에 구분선, PDML 렌더) */}
        <View style={{ height: 12, backgroundColor: colors.grey100, width: '100%' }} />
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }} />

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

        {/* bottom spacer + CTA */}
        <View style={{ height: 90 }} />

        <FixedBottomCTA onPress={goReservation}>
          {reservationLoading ? '로딩 중...' : '예약하기'}
        </FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}