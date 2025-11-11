import React from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from '@granite-js/react-native';
import { Text, Badge, Icon, colors } from '@toss-design-system/react-native';
import { parseKkdayCategoryKorean } from '../../kkday/kkdayCategoryToKorean';

export type SmallProduct = {
  prod_no: number | string;
  prod_name: string;
  prod_img_url?: string;
  b2c_price?: number;
  b2b_price?: number;
  avg_rating_star?: number;
  rating_count?: number;
  introduction?: string;
  product_category?: { main?: string; sub?: string[] };
};

type HorizontalProductCardProps = {
  product: SmallProduct;
  onPress?: () => void;
  style?: any;
};

export default function HorizontalProductCard({ product, onPress, style }: HorizontalProductCardProps) {
  const CARD_WIDTH = 165;
  const IMAGE_HEIGHT = 165;

  const originPrice = product.b2c_price ?? 0;
  const salePrice = product.b2b_price ?? 0;
  const percent =
    originPrice > 0 && originPrice > salePrice
      ? Math.floor(100 - (salePrice / originPrice) * 100)
      : 0;

  const categories = parseKkdayCategoryKorean(product.product_category ?? {}).filter(Boolean);

  return (
    <Pressable style={[styles.cardWrap, { width: CARD_WIDTH }, style]} onPress={onPress}>
      <View style={styles.card}>
        <View style={[styles.imageWrap, { height: IMAGE_HEIGHT }]}>
          <Image
            source={{ uri: product.prod_img_url ?? '' }}
            style={[styles.image, { height: IMAGE_HEIGHT }]}
            resizeMode="cover"
          />
          <Badge
            type="red"
            badgeStyle="fill"
            size="tiny"
            style={styles.priceBadge}
          >
            {' '}최저가{' '}
          </Badge>
        </View>

        <View style={styles.info}>
          <Text typography="t5" fontWeight="bold" color={colors.grey800} numberOfLines={1} style={{ width: '100%' }}>
            {product.prod_name}
          </Text>

          <View style={styles.priceRow}>
            {percent > 0 && <Text style={styles.percent} typography="t4">{percent}%</Text>}
            <View style={{ flexDirection: 'column' }}>
              {originPrice > salePrice && originPrice > 0 && (
                <Text typography="t7" color={colors.grey300} style={{ textDecorationLine: 'line-through' }}>
                  {originPrice.toLocaleString('ko-KR')}원
                </Text>
              )}
              <Text typography="t6" fontWeight="bold" color={colors.grey900}>
                {salePrice.toLocaleString('ko-KR')}원~
              </Text>
            </View>
          </View>

          <Text typography="t7" color={colors.grey700} numberOfLines={1} style={{ marginTop: 6 }}>
            {product.introduction}
          </Text>

          <View style={styles.metaRow}>
            <Icon name="icon-star-yellow" color={colors.yellow500} size={12} />
            <Text typography="t7" color={colors.grey800} style={{ marginLeft: 6 }}>
              {(product.avg_rating_star ?? 0).toFixed(1)}
            </Text>
            <Text typography="t7" color={colors.grey400} style={{ marginLeft: 6 }}>
              ({product.rating_count ?? 0})
            </Text>
          </View>

          <View style={styles.tagsRow}>
            {categories.slice(0, 3).map((cat, idx) => (
              <Badge key={cat + idx} type="blue" badgeStyle="weak" style={styles.tagBadge}>
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
    marginRight: 12,
  },
  card: {
    backgroundColor: '#fff',
    overflow: 'hidden',
    // 외곽선 제거: 기존 borderWidth 제거 (요청사항)
  },
  imageWrap: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#eee',
    position: 'relative',
  },
  image: {
    width: '100%',
    borderRadius: 12,
  },
  priceBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    zIndex: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  info: {
    padding: 10,
    paddingTop: 12,
  },
  priceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  percent: {
    color: colors.red500,
    fontWeight: 'bold',
    marginRight: 8,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagBadge: {
    marginRight: 6,
    marginTop: 4,
  },
});