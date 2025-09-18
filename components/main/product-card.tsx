import React from "react";
import { View, Image, Pressable } from "react-native";
import { Text, Badge, Icon, colors } from "@toss-design-system/react-native";

export default function ProductCard({
                                      product,
                                      onPress,
                                    }: {
  product: any;
  onPress: () => void;
}) {
  // 할인율 계산
  const originPrice = product.sellingProductPriceDetail
    ? Number(Object.values(Object.values(product.sellingProductPriceDetail)[0] || {})[0] || 0)
    : product.sellingProductPrice || 0;
  const salePrice =
    product.sellingProductPrice ||
    Number(Object.values(Object.values(product.sellingProductPriceDetail)[0] || {})[0] || 0);
  const percent =
    originPrice > 0
      ? Math.floor(100 - (salePrice / originPrice) * 100)
      : 0;

  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#fff",
          borderRadius: 14,
          marginVertical: 7,
          marginHorizontal: 16,
          padding: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 3,
        }}
      >
        <View>
          <Image
            source={{
              uri: Array.isArray(product.sellingProductImage)
                ? product.sellingProductImage[0]
                : "",
            }}
            style={{
              width: 90,
              height: 90,
              borderRadius: 12,
              marginRight: 10,
              backgroundColor: "#eee",
            }}
            resizeMode="cover"
          />
          <Badge
            type="red"
            style={{
              position: "absolute",
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
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <Text typography="t4" fontWeight="bold" numberOfLines={1}>
            {product.sellingProductName}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 2 }}>
            {percent > 0 && (
              <Text
                style={{ color: colors.red500, marginRight: 4, fontWeight: "bold" }}
                typography="t6"
              >{`${percent}%`}</Text>
            )}
            <Text
              typography="t4"
              fontWeight="bold"
              color={colors.red500}
              style={{ marginRight: 4 }}
            >
              {salePrice.toLocaleString("ko-KR")}원~
            </Text>
            {originPrice > salePrice && (
              <Text
                typography="t6"
                color={colors.grey400}
              >
                {originPrice.toLocaleString("ko-KR")}원
              </Text>
            )}
          </View>
          <Text
            typography="t7"
            color={colors.grey700}
            numberOfLines={1}
            style={{ marginTop: 2 }}
          >
            {product.sellingProductContent}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <Icon name="icon-star-fill" color={colors.yellow500} size={16} />
            <Text typography="t7" color={colors.grey800} style={{ marginLeft: 3 }}>
              {product.sellingProductRating?.toFixed(1) || "0.0"}
            </Text>
            <Text typography="t7" color={colors.grey400} style={{ marginLeft: 4 }}>
              ({product.sellingProductReviewCount?.toLocaleString("ko-KR") || 0})
            </Text>
            {typeof product.similarity === "number" &&
              product.similarity > 0 && (
                <Badge
                  type="yellow"
                  badgeStyle="weak"
                  style={{ marginLeft: 8, paddingHorizontal: 6, paddingVertical: 1 }}
                >
                  유사도 {Math.round(product.similarity * 100)}%
                </Badge>
              )}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
            {product.sellingProductType === "tour" && (
              <Badge type="blue" badgeStyle="weak" style={{ marginRight: 3, marginBottom: 2 }}>
                단독 투어
              </Badge>
            )}
            {product.sellingProductType === "package" && (
              <Badge type="blue" badgeStyle="weak" style={{ marginRight: 3, marginBottom: 2 }}>
                패키지
              </Badge>
            )}
            {product.koreanGuide === "Y" && (
              <Badge type="teal" badgeStyle="weak" style={{ marginRight: 3, marginBottom: 2 }}>
                한국어 가이드
              </Badge>
            )}
            {Array.isArray(product.sellingProductRegion) &&
              product.sellingProductRegion.map((region: string, idx: number) => (
                <Badge
                  badgeStyle="weak"
                  key={region + idx}
                  style={{ marginRight: 3, marginBottom: 2 }}
                >
                  {region}
                </Badge>
              ))}
          </View>
        </View>
        <Pressable
          style={{
            position: "absolute",
            right: 18,
            top: 18,
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 4,
            elevation: 2,
            shadowColor: "#000",
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