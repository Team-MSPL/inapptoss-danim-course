import React, {useEffect, useState} from 'react';
import { View, Image, ScrollView, TouchableOpacity } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import axiosAuth from "../../redux/api";
import {FixedBottomCTAProvider, Button, Icon, Text, colors} from "@toss-design-system/react-native";

export const Route = createRoute('/product/good-product', {
  validateParams: (params) => params,
  component: ProductGoodProduct,
});

function ProductGoodProduct() {
  const params = Route.useParams();
  // 상품정보를 새로 불러와야 함
  const [product, setProduct] = useState<any>(params.product ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProductDetail() {
      if (product && product.detail_loaded) return; // 이미 상세면 패스
      setLoading(true);
      try {
        const res = await axiosAuth.post(`${import.meta.env.API_ROUTE_RELEASE}/Product/QueryProduct`, {
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
    // prod_no만 있을 때 상세 조회
    if (!product || !product.detail_loaded) fetchProductDetail();
  }, [params, product]);

  if (!product) {
    return (
      <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
        <Text>상품 정보를 불러오는 중입니다...</Text>
      </View>
    );
  }

  // 임시 태그 샘플 (실제 tag 코드 → 한글 매핑 필요)
  const tags = ["단독 투어", "단독 투어", "단독 투어", "단독 투어", "단독 투어"];
  // 유사도, 할인 등 임시 값
  const similarity = 90;
  const originalPrice = 100000; // 실제 데이터에 없으면 null
  const discountPrice = product.b2c_min_price || product.b2c_price || 50000;
  const discountAmount = originalPrice ? (originalPrice - discountPrice) : null;

  // 안내 아이콘/텍스트 샘플
  const infoList = [
    { icon: "icon-car-checkup", text: "픽업 가능" },
    { icon: "icon-earth", text: "영어/한국어 가이드" },
    { icon: "icon-coin-yellow", text: "무료 취소" }
  ];

  return (
    <View style={{flex: 1, backgroundColor: "#fff"}}>
      <FixedBottomCTAProvider>
        <Image
          source={{ uri: product.prod_img_url }}
          style={{ width: "100%", height: 291 }}
          resizeMode="cover"
        />
        <View style={{ padding: 24 }}>
          {/* 상품명 */}
          <Text typography="t2" color={colors.black} fontWeight='bold' style={{ marginBottom: 12 }}>
            {product.prod_name || product.name}
          </Text>
          {/* 할인/가격 */}
          <View style={{ flexDirection: "column", alignItems: "flex-end", marginBottom: 14 }}>
            {discountAmount && (
              <View style={{alignItems: 'flex-end'}}>
                <Text typography='t5' fontWeight='medium' color={colors.red500}>{discountAmount.toLocaleString()}원 할인</Text>
                <Text typography='t5' fontWeight='medium' color={colors.grey400} style={{ textDecorationLine: "line-through" }}>{originalPrice.toLocaleString()}원~</Text>
              </View>
            )}
            <View style={{ flexDirection: "row", alignItems: 'flex-end' }}>
              <Text color={colors.red500} typography='t5' fontWeight='medium' style={{marginRight: 8}}>
                최저가
              </Text>
              <Text color={colors.black} typography='t2' fontWeight='bold' >
                 {discountPrice.toLocaleString()}원~
              </Text>
            </View>
          </View>
          {/* 안내 아이콘/텍스트 */}
          <View style={{ flexDirection: "column", alignItems: "flex-start", marginBottom: 16, gap: 16 }}>
            {infoList.map((item, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginRight: 18 }}>
                <Icon name={item.icon} size={24} />
                <Text typography="t5" color={colors.black} fontWeight='medium' style={{marginLeft: 10}}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{backgroundColor: colors.grey100, height: 18, width: '100%'}}/>
        <View style={{padding: 24}}>
          {/* 상품 설명(소개) */}
          <Text typography='t5' fontWeight='medium' style={{ marginBottom: 30 }}>
            {/* HTML 태그 제거, 줄바꿈만 남김 */}
            {(product.introduction ?? "")
              .replace(/<[^>]+>/g, "")
              .replace(/&nbsp;/g, " ")
              .replace(/\s+/g, " ")
              .trim()}
          </Text>
        </View>
        <View style={{backgroundColor: colors.grey100, height: 18, width: '100%'}}/>
        {/* 아코디언/탭 메뉴 (단순 리스트) */}
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: "#eee", backgroundColor: "#f9f9f9" }}>
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
