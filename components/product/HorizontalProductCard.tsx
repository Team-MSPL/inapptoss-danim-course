import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from '@granite-js/react-native';
import { Text, Badge, Icon, colors } from '@toss-design-system/react-native';

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
  const originPrice = product.b2c_price ?? 0;
  const salePrice = product.b2b_price ?? 0;
  const percent =
    originPrice > 0 && originPrice > salePrice
      ? Math.floor(100 - (salePrice / originPrice) * 100)
      : 0;

  return (
    <Pressable style={[styles.cardWrap, style]} onPress={onPress}>
      <View style={styles.card}>
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: product.prod_img_url ?? '' }}
            style={styles.image}
            resizeMode="cover"
          />
          <Badge
            type={"red"}
            badgeStyle="fill"
            size="tiny"
            style={styles.priceBadge}
          >
            최저가
          </Badge>
        </View>

        <View style={styles.info}>
          <Text typography="t6" fontWeight="medium" color={colors.grey800} numberOfLines={1} style={{ width: '100%' }}>
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

          <View style={styles.metaRow}>
            <Icon name="icon-star-yellow" color={colors.yellow500} size={12} />
            <Text typography="t7" color={colors.grey800} style={{ marginLeft: 6 }}>
              {(product.avg_rating_star ?? 0).toFixed(1)}
            </Text>
            <Text typography="t7" color={colors.grey400} style={{ marginLeft: 6 }}>
              ({product.rating_count ?? 0})
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    width: 200,
    marginRight: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.grey100,
  },
  imageWrap: {
    width: '100%',
    height: 120,
    backgroundColor: '#eee',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
    paddingTop: 8,
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
});