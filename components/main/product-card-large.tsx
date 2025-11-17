import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Image } from '@granite-js/react-native';
import { Text, Badge, Icon, colors } from '@toss-design-system/react-native';
import { parseKkdayCategoryKorean } from '../../kkday/kkdayCategoryToKorean';

export type Country = {
  id: string;
  name: string;
  cities: { id: string; name: string }[];
};
export type ProductCategory = { main: string; sub: string[] };
export type Product = {
  prod_no: number | string;
  prod_name: string;
  prod_img_url: string;
  b2c_price: number;
  b2b_price: number;
  avg_rating_star?: number;
  rating_count?: number;
  countries?: Country[];
  introduction?: string;
  prod_type?: string;
  tag?: string[];
  instant_booking?: boolean;
  product_category?: ProductCategory;
  similarity?: number; // 0~1 or 0~100
};

type Props = {
  product: Product;
  onPress?: () => void;
};

export default function ProductCardLarge({ product, onPress }: Props) {
  const originPrice = product.b2c_price ?? 0;
  const salePrice = product.b2b_price ?? 0;
  const discountPercent =
    originPrice > 0 && originPrice > salePrice ? Math.floor(100 - (salePrice / originPrice) * 100) : 0;

  // similarity may be 0..1 or 0..100 — normalize to percent 0..100
  const similarityRaw = product.similarity ?? 0;
  const similarityPercent =
    similarityRaw > 1 ? Math.round(similarityRaw) : Math.round(similarityRaw * 100);

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={styles.card}>
        {/* Image area */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.prod_img_url ?? '' }} style={styles.image} resizeMode="cover" />
        </View>

        {/* Content area */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.starBox}>
              <Icon name="icon-star-yellow" color={colors.yellow500} size={14} />
              <Text typography="t7" color={colors.grey800} style={{ marginLeft: 6 }}>
                {(product.avg_rating_star ?? 0).toFixed(2)}
              </Text>
            </View>
          </View>

          <Text typography="t5" fontWeight="bold" color={colors.grey900} numberOfLines={2} style={styles.title}>
            {product.prod_name}
          </Text>

          <View style={styles.badgesRow}>
            {parseKkdayCategoryKorean(product.product_category)
              .filter(Boolean)
              .slice(0, 3)
              .map((cat, idx) => (
                <Badge key={String(cat) + idx} type="blue" badgeStyle="weak" style={styles.tagBadge}>
                  {cat}
                </Badge>
              ))}
          </View>

          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              {discountPercent > 0 && (
                <Text typography="t7" color={colors.red400} style={styles.discountLabel}>
                  {discountPercent}원 할인
                </Text>
              )}
              {originPrice > salePrice && originPrice > 0 && (
                <Text typography="t7" color={colors.grey300} style={styles.strike}>
                  {originPrice.toLocaleString('ko-KR')}원~
                </Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text typography="t6" fontWeight="bold" color={colors.black}>
                  최저가 {salePrice.toLocaleString('ko-KR')}원~
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.grey200,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  similarityLabel: {
    fontSize: 13,
  },
  starBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginTop: 6,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagBadge: {
    marginRight: 6,
    marginBottom: 6,
  },
  priceRow: {
    marginTop: 6,
    marginBottom: 6,
  },
  discountLabel: {
    color: colors.red400,
    fontSize: 13,
    marginBottom: 2,
  },
  strike: {
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
});