import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from '@granite-js/react-native';
import { Text, Badge, Icon, colors } from '@toss-design-system/react-native';

// Search API Product 타입에 맞게 엄격하게 정의
type Country = {
  id: string;
  name: string;
  cities: { id: string; name: string }[];
};

type ProductCategory = {
  main: string;
  sub: string[];
};

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
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: 14,
          marginVertical: 7,
          marginHorizontal: 16,
          padding: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 3,
        }}
      >
        <View>
          <Image
            source={{
              uri: product.prod_img_url || '',
            }}
            style={{
              width: 90,
              height: 90,
              borderRadius: 12,
              marginRight: 10,
              backgroundColor: '#eee',
            }}
            resizeMode="cover"
          />
          <Badge
            type="red"
            style={{
              position: 'absolute',
              left: 6,
              top: 6,
              zIndex: 2,
              paddingHorizontal: 5,
              paddingVertical: 1,
            }}
          >
            최저가
          </Badge>
        </View>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <Text typography="t4" fontWeight="bold" numberOfLines={1}>
            {product.prod_name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 }}>
            {percent > 0 && (
              <Text
                style={{ color: colors.red500, marginRight: 4, fontWeight: 'bold' }}
                typography="t6"
              >{`${percent}%`}</Text>
            )}
            <Text
              typography="t4"
              fontWeight="bold"
              color={colors.red500}
              style={{ marginRight: 4 }}
            >
              {salePrice.toLocaleString('ko-KR')}원~
            </Text>
            {originPrice > salePrice && (
              <Text typography="t6" color={colors.grey400}>
                {originPrice.toLocaleString('ko-KR')}원
              </Text>
            )}
          </View>
          <Text typography="t7" color={colors.grey700} numberOfLines={1} style={{ marginTop: 2 }}>
            {product.introduction}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Icon name="icon-star-fill" color={colors.yellow500} size={16} />
            <Text typography="t7" color={colors.grey800} style={{ marginLeft: 3 }}>
              {product.avg_rating_star?.toFixed(1) ?? '0.0'}
            </Text>
            <Text typography="t7" color={colors.grey400} style={{ marginLeft: 4 }}>
              ({product.rating_count?.toLocaleString('ko-KR') ?? 0})
            </Text>
            {typeof product.similarity === 'number' && product.similarity > 0 && (
              <Badge
                type="yellow"
                badgeStyle="weak"
                style={{ marginLeft: 8, paddingHorizontal: 6, paddingVertical: 1 }}
              >
                유사도 {Math.round(product.similarity * 100)}%
              </Badge>
            )}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            {product.prod_type === 'M01' && (
              <Badge type="blue" badgeStyle="weak" style={{ marginRight: 3, marginBottom: 2 }}>
                단독 투어
              </Badge>
            )}
            {product.prod_type === 'M06' && (
              <Badge type="blue" badgeStyle="weak" style={{ marginRight: 3, marginBottom: 2 }}>
                패키지
              </Badge>
            )}
            {/* 기타 타입/태그 등 활용해 확장 가능 */}
            {product.countries?.[0]?.name && (
              <Badge
                badgeStyle="weak"
                style={{ marginRight: 3, marginBottom: 2 }}
              >
                {product.countries[0].name}
              </Badge>
            )}
            {Array.isArray(product.tag) &&
              product.tag.map((tg: string, idx: number) => (
                <Badge
                  badgeStyle="weak"
                  key={tg + idx}
                  style={{ marginRight: 3, marginBottom: 2 }}
                >
                  {tg}
                </Badge>
              ))}
          </View>
        </View>
        <Pressable
          style={{
            position: 'absolute',
            right: 18,
            top: 18,
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 4,
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
          }}
          // onPress={찜처리}
        >
          <Icon
            name="icon-heart-line"
            color={colors.grey300}
            size={24}
            // TODO: 찜 상태에 따라 icon-heart-fill, color 변경
          />
        </Pressable>
      </View>
    </Pressable>
  );
}