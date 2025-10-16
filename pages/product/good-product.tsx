import React, {useEffect, useState, useRef} from 'react';
import { View, FlatList, TouchableOpacity, Dimensions, Image } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import axiosAuth from "../../redux/api";
import { FixedBottomCTAProvider, Button, Icon, Text, colors, Badge, Skeleton, AnimateSkeleton } from "@toss-design-system/react-native";
import { parseKkdayCategoryKorean } from '../../kkday/kkdayCategoryToKorean';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const Route = createRoute('/product/good-product', {
  validateParams: (params) => params,
  component: ProductGoodProduct,
});

function ProductGoodProduct() {
  const params = Route.useParams();
  const [product, setProduct] = useState<any>(params.product ?? null);
  const [loading, setLoading] = useState(false);

  // 캐러셀 상태
  const [imgIndex, setImgIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    async function fetchProductDetail() {
      if (product && product.detail_loaded) return;
      setLoading(true);
      try {
        const res = await axiosAuth.post(`${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryProduct`, {
          prod_no: params.product?.prod_no ?? params.prod_no,
          locale: "zh-tw",
          state: "TW",
        }, {
          headers: { "Content-Type": "application/json" }
        });
        if (res.data && res.data.prod) {
          setProduct({ ...params.product, ...res.data.prod, detail_loaded: true });
        }
      } catch (e) {
        // 에러처리
      }
      setLoading(false);
    }
    if (!product || !product.detail_loaded) fetchProductDetail();
  }, [params, product]);

  // 가격 정보
  const discountPrice = typeof product?.b2b_min_price === "number" ? product.b2b_min_price : Number(product?.b2b_min_price || 0);
  const originalPrice = typeof product?.b2c_min_price === "number" ? product.b2c_min_price : Number(product?.b2c_min_price || 0);
  const discountAmount = originalPrice > discountPrice ? (originalPrice - discountPrice) : 0;

  // 가이드 언어 정보
  let guideLabel: string | null = null;
  if (product?.guide_lang_list) {
    const langs = product.guide_lang_list;
    if (langs.includes('ko') && langs.includes('en')) guideLabel = "영어/한국어 가이드";
    else if (langs.includes('ko')) guideLabel = "한국어 가이드";
    else if (langs.includes('en')) guideLabel = "영어 가이드";
  }

  // 안내 아이콘/텍스트 (동적)
  const hasPickupTag =
    Array.isArray(product?.tag) && product.tag.includes("TAG_5_2");

  const infoList = [
    ...(hasPickupTag ? [{ icon: "icon-car-checkup", text: "픽업 가능" }] : []),
    ...(guideLabel ? [{ icon: "icon-earth", text: guideLabel }] : []),
    ...(product?.is_cancel_free ? [{ icon: "icon-coin-yellow", text: "무료 취소" }] : []),
  ];

  // 이미지 리스트
  const images = Array.isArray(product?.img_list) && product.img_list.length > 0
    ? product.img_list
    : [product?.prod_img_url || "https://via.placeholder.com/400x240?text=No+Image"];

  const categoryList = parseKkdayCategoryKorean(product?.product_category).filter(Boolean);

  // 캐러셀 indicator 렌더
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

  // Skeleton 로딩 UI
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
        {/* 아코디언/탭 메뉴 (단순 리스트) */}
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: "#eee", backgroundColor: "#f9f9f9", marginHorizontal: 24 }}>
          {["투어 정보", "포함/불포함", "투어 후기", "투어 일정"].map((item, idx) => (
            <TouchableOpacity key={item} style={{ padding: 18, borderBottomWidth: idx < 3 ? 1 : 0, borderColor: "#eee" }}>
              <Text style={{ fontWeight: "500", fontSize: 16 }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* 하단 예약 CTA */}
        <View style={{ padding: 20, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#eee" }}>
          <Button type="primary" style="fill" display="block" size="large" onPress={() => {}}>
            예약하기
          </Button>
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}

export default ProductGoodProduct;