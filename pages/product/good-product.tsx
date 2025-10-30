import React, {useEffect, useState, useRef} from 'react';
import { View, FlatList, TouchableOpacity, Dimensions, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {createRoute, useNavigation} from '@granite-js/react-native';
import axiosAuth from "../../redux/api";
import { FixedBottomCTAProvider, Button, Icon, Text, colors, Badge, Skeleton, AnimateSkeleton } from "@toss-design-system/react-native";
import { parseKkdayCategoryKorean } from '../../kkday/kkdayCategoryToKorean';
import { getRefundTag, firstNLinesFromPackageDesc, formatPrice, getPriceInfo, earliestBookingText } from "../../components/product/good-product-function";
import {useProductStore} from "../../zustand/useProductStore";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUERY_PACKAGE_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryPackage`;

export const Route = createRoute('/product/good-product', {
  validateParams: (params) => params,
  component: ProductGoodProduct,
});


function PlanLabel({ index, pkg_name }: { index: number, pkg_name: string }) {
  const letter = String.fromCharCode(65 + index);
  return <Text numberOfLines={1} fontWeight="semibold" typography='t4' style={{ textAlign: 'left' }}>{`플랜 ${letter}: ${pkg_name}`}</Text>;
}

function ProductGoodProduct() {
  const navigation = useNavigation();

  const params = Route.useParams();
  const [product, setProduct] = useState<any>(params.product ?? null);
  const [pkgList, setPkgList] = useState<any[]>([]);
  const [selectedPkgNo, setSelectedPkgNo] = useState<number|null>(null);
  const [loading, setLoading] = useState(false);

  const [reservationLoading, setReservationLoading] = useState(false); // new: reservation API call loading

  const setPdt = useProductStore(state => state.setPdt);

  const [imgIndex, setImgIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    async function fetchProductDetail() {
      if (product && product.detail_loaded) return;
      setLoading(true);
      try {
        const res = await axiosAuth.post(`${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryProduct`, {
          prod_no: params.product?.prod_no ?? params.prod_no,
          locale: "kr",
          state: "KR",
        }, {
          headers: { "Content-Type": "application/json" }
        });
        if (res.data && res.data.prod && res.data.pkg) {
          setProduct({ ...params.product, ...res.data.prod, detail_loaded: true });
          setPkgList(res.data.pkg);

          const firstAvailable = (res.data.pkg.find((p: any) => !!p.sale_s_date && !!p.sale_e_date) ?? res.data.pkg[0]);
          setSelectedPkgNo(firstAvailable?.pkg_no ?? null);

          try { setPdt({ ...params.product, ...res.data.prod, detail_loaded: true }); } catch (e) { /* ignore */ }
        }
      } catch (e) {
        // 에러처리(필요시 Alert)
      }
      setLoading(false);
    }
    if (!product || !product.detail_loaded) fetchProductDetail();
  }, [params, product]);

  const discountPrice = typeof product?.b2b_min_price === "number" ? product.b2b_min_price : Number(product?.b2b_min_price || 0);
  const originalPrice = typeof product?.b2c_min_price === "number" ? product.b2c_min_price : Number(product?.b2c_min_price || 0);
  const discountAmount = originalPrice > discountPrice ? (originalPrice - discountPrice) : 0;

  let guideLabel: string | null = null;
  if (product?.guide_lang_list) {
    const langs = product.guide_lang_list;
    if (langs.includes('ko') && langs.includes('en')) guideLabel = "영어/한국어 가이드";
    else if (langs.includes('ko')) guideLabel = "한국어 가이드";
    else if (langs.includes('en')) guideLabel = "영어 가이드";
  }

  const hasPickupTag =
    Array.isArray(product?.tag) && product.tag.includes("TAG_5_2");

  const infoList = [
    ...(hasPickupTag ? [{ icon: "icon-car-checkup", text: "픽업 가능" }] : []),
    ...(guideLabel ? [{ icon: "icon-earth", text: guideLabel }] : []),
    ...(product?.is_cancel_free ? [{ icon: "icon-coin-yellow", text: "무료 취소" }] : []),
  ];

  const images = Array.isArray(product?.img_list) && product.img_list.length > 0
    ? product.img_list
    : [product?.prod_img_url || "https://via.placeholder.com/400x240?text=No+Image"];

  const categoryList = parseKkdayCategoryKorean(product?.product_category).filter(Boolean);

  // New: onReserve -> call QueryPackage, validate, then navigate accordingly
  const handleReservePress = async () => {
    if (!selectedPkgNo) return;
    setReservationLoading(true);

    try {
      const res = await axiosAuth.post(QUERY_PACKAGE_API, {
        prod_no: product?.prod_no ?? params.prod_no,
        pkg_no: selectedPkgNo,
        locale: "kr",
        state: "KR",
      }, {
        headers: { "Content-Type": "application/json" }
      });

      const data = res.data ?? {};

      // handle API-level result codes (판매종료 등)
      if (data?.result === '03' || data?.result_code === '03') {
        Alert.alert('알림', '해당 여행 상품은 현재 판매가 종료되었습니다.');
        return;
      }

      // basic validation: must have item array with at least one
      if (!Array.isArray(data?.item) || data.item.length === 0) {
        Alert.alert('알림', '해당 패키지의 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      const firstItem = data.item[0];

      // If specs is an array and exactly one and that spec has spec_oid === 'spec-single', go to reservation
      const specs = firstItem?.specs;
      if (Array.isArray(specs) && specs.length === 1) {
        const onlySpec = specs[0];
        if (onlySpec?.spec_oid === 'spec-single') {
          // navigate to reservation page, pass pkgData for convenience
          navigation.navigate('/product/reservation', {
            prod_no: product?.prod_no ?? params.prod_no,
            prod_name: product?.prod_name ?? params.prod_name,
            pkg_no: selectedPkgNo,
            pkgData: data,
          });
          return;
        }
      }

      // If there are multiple specs (or specs not single), go to select-spec
      if (Array.isArray(specs) && specs.length >= 1) {
        navigation.navigate('/product/select-spec', {
          prod_no: product?.prod_no ?? params.prod_no,
          prod_name: product?.prod_name ?? params.prod_name,
          pkg_no: selectedPkgNo,
          pkgData: data,
        });
        return;
      }

      // Fallback: if specs not present but item has skus etc. — navigate to select-spec to let user choose
      navigation.navigate('/product/select-spec', {
        prod_no: product?.prod_no ?? params.prod_no,
        prod_name: product?.prod_name ?? params.prod_name,
        pkg_no: selectedPkgNo,
        pkgData: data,
      });

    } catch (err: any) {
      console.error('[ProductGoodProduct] QueryPackage error', err);
      const msg = err?.response?.data?.result_msg ?? err?.message ?? '패키지 정보를 불러오는 중 오류가 발생했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setReservationLoading(false);
    }
  };

  const goReservation = () => {
    // keep backward compatibility: previously just navigated to select-spec
    // now we route through the API check handler
    if (!selectedPkgNo) return;
    handleReservePress();
  };

  const renderDots = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 10, width: '100%' }}>
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
          <View style={{ flexDirection: "column", alignItems: 'flex-end' }}>
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
          {/* 상품명 */}
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
          {/* 상품 설명(소개) */}
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
            // 기준: sale_s_date && sale_e_date 가 있어야 판매중으로 간주.
            const isSoldOut = !(pkg.sale_s_date && pkg.sale_e_date);
            const isSelected = selectedPkgNo === pkg.pkg_no && !isSoldOut;
            return (
              <TouchableOpacity
                key={pkg.pkg_no}
                onPress={() => {
                  // Prevent selecting sold-out packages
                  if (isSoldOut) return;
                  setSelectedPkgNo(pkg.pkg_no);
                }}
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
                  {/* Refund tag */}
                  {getRefundTag(pkg) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Icon name="icon-check" size={24} color={colors.blue500} />
                      <Text style={{ marginLeft: 8, color: colors.grey600 }}>{getRefundTag(pkg)}</Text>
                    </View>
                  )}

                  {/* Earliest booking */}
                  {earliestBookingText(pkg) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Icon name="icon-calendar-clock" size={24} />
                      <Text style={{ marginLeft: 8, color: colors.grey600 }}>{earliestBookingText(pkg)}</Text>
                    </View>
                  )}

                  {/* Bulleted short lines */}
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
                    onPress={() => {
                      // do not allow selection / navigation for sold-out packages
                      if (isSoldOut) return;
                      setSelectedPkgNo(pkg.pkg_no);
                    }}
                    disabled={isSoldOut}
                  >
                    {isSoldOut ? '매진' : (selectedPkgNo === pkg.pkg_no ? '선택됨' : '선택하기')}
                  </Button>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* 하단 예약 CTA */}
        <View style={{ padding: 20, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#eee" }}>
          <Button
            type="primary"
            style="fill"
            display="block"
            size="large"
            disabled={!selectedPkgNo || reservationLoading}
            onPress={goReservation}
          >
            {reservationLoading ? '로딩 중...' : '예약하기'}
          </Button>
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}

export default ProductGoodProduct;