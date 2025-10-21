import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from '@granite-js/react-native';
import { Text, Badge, Icon, colors } from '@toss-design-system/react-native';
import { parseKkdayCategoryKorean } from '../../kkday/kkdayCategoryToKorean';

// 타입 정의 (MainTravelShop.tsx와 동일하게)
type Country = {
  id: string;
  name: string;
  cities: { id: string; name: string }[];
};
type ProductCategory = { main: string; sub: string[] };
export type Product = {
  prod_no: number;
  prod_name: string;
  prod_img_url: string;
  b2c_price: number;
  b2b_price: number;
  avg_rating_star: number;
  rating_count: number;
  countries: Country[];
  introduction: string;
  prod_type: string;
  tag?: string[];
  instant_booking: boolean;
  product_category: ProductCategory;
  similarity?: number;
};

type ProductCardProps = {
  product: Product;
  onPress: () => void;
};

export default function ProductCard({ product, onPress }: ProductCardProps) {
  // 할인율 계산
  const originPrice = product.b2c_price || 0;
  const salePrice = product.b2b_price || 0;
  const percent =
    originPrice > 0 && originPrice > salePrice
      ? Math.floor(100 - (salePrice / originPrice) * 100)
      : 0;

  return (
    <Pressable onPress={onPress} style={styles.cardWrap}>
      <View style={styles.cardInner}>
        {/* 상품 이미지와 찜/뱃지 */}
        <View style={styles.imageCol}>
          <Image
            source={{ uri: product.prod_img_url || '' }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* 최저가 뱃지 */}
          <Badge
            type={"red"}
            badgeStyle="fill"
            size="tiny"
            style={{
              position: 'absolute',
              left: 6,
              bottom: 8,
              paddingHorizontal: 2,
              paddingVertical: 2,
              zIndex: 2,
            }}
          >
            최저가
          </Badge>
        </View>
        {/* 상품 정보 */}
        <View style={styles.infoCol}>
          {/* 상품명 */}
          <Text typography="t6" fontWeight="medium" color={colors.grey800} numberOfLines={1}>
            {product.prod_name}
          </Text>
          {/* 할인율, 판매가, 원가 */}
          <View style={styles.priceRow}>
            {percent > 0 && (
              <Text style={styles.percentText} typography="t4">
                {percent}%
              </Text>
            )}
            <View style={{flexDirection: 'column'}}>
              {originPrice > salePrice && (
                <Text
                  typography="t7"
                  color={colors.grey300}
                  style={{textDecorationLine: 'line-through'}}
                >
                  {originPrice.toLocaleString('ko-KR')}원
                </Text>
              )}
              <Text
                typography="t6"
                fontWeight="bold"
                color={colors.grey900}
                style={{marginRight: 8}}
              >
                {salePrice.toLocaleString('ko-KR')}원~
              </Text>
            </View>
          </View>
          {/* 소개문 */}
          <Text typography="t7" color={colors.grey700} numberOfLines={1}>
            {product.introduction}
          </Text>
          {/* 별점, 리뷰수, 구경인원 */}
          <View style={styles.ratingRow}>
            <Icon name="icon-star-yellow" color={colors.yellow500} size={12} />
            <Text typography="t7" color={colors.grey800} style={{ marginLeft: 3 }}>
              {product.avg_rating_star?.toFixed(1) ?? '0.0'}
            </Text>
            <Text typography="t7" color={colors.grey400} style={{ marginLeft: 4 }}>
              ({product.rating_count?.toLocaleString('ko-KR') ?? 0})
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
            {parseKkdayCategoryKorean(product.product_category)
              .filter(Boolean)
              .map((cat, idx) => (
                <Badge
                  key={cat + idx}
                  type="blue"
                  badgeStyle="weak"
                  style={styles.badgeStyle}
                >
                  {cat}
                </Badge>
              ))}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  imageCol: {
    position: 'relative',
    width: 120,
    height: 120,
    marginRight: 14,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 13,
    backgroundColor: '#eee',
  },
  heartBox: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
    elevation: 1,
  },
  infoCol: {
    flex: 1,
    flexDirection: 'column',
    // minHeight: 92,   // 이 줄 주석처리 또는 92→104(이미지와 맞춤)
    justifyContent: 'flex-start', // 위쪽에 붙이기
    // alignItems: 'flex-start', // 필요시 추가
    paddingVertical: 0, // 혹시라도
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  percentText: {
    color: colors.red500,
    fontWeight: 'bold',
    marginRight: 7,
    alignSelf: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeStyle: {
    marginRight: 4,
  },
});