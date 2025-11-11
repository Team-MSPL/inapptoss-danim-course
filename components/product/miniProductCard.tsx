import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "@granite-js/react-native";
import { Badge, colors, Text } from "@toss-design-system/react-native";

function formatPrice(n?: number | null) {
  if (n === null || n === undefined) return "";
  return Math.floor(Number(n)).toLocaleString();
}

export function MiniProductCard({
                                  image,
                                  title,
                                  originPrice,
                                  salePrice,
                                  percent,
                                  perPersonText,
                                }: {
  image?: string | string[]; // string 또는 string[] 둘 다 받고 처리
  title: string;
  originPrice?: number;
  salePrice?: number;
  percent?: number;
  perPersonText?: string;
}) {
  // 안전한 이미지 URL 결정: image가 배열이면 첫번째, 아니면 문자열 그대로
  const imageUrl =
    Array.isArray(image) ? image[0] ?? "" : typeof image === "string" ? image : "";

  // optional: placeholder 로컬 리소스로 대체하려면 여기에서 설정
  // const placeholder = require('../../assets/placeholder.png');
  // source = imageUrl ? { uri: imageUrl } : placeholder;

  return (
    <View style={styles.cardWrap}>
      <View style={styles.cardInner}>
        <View style={styles.imageCol}>
          <Image
            // 직접 imageUrl을 사용하도록 변경 (이미지가 없으면 빈 문자열)
            source={{ uri: imageUrl ?? "" }}
            style={styles.image}
            resizeMode="cover"
          />
          <Badge
            type={"red"}
            badgeStyle="fill"
            size="tiny"
            style={{
              position: "absolute",
              left: 6,
              bottom: 8,
              paddingHorizontal: 2,
              paddingVertical: 2,
              zIndex: 2,
            }}
          >
            {' '}최저가{' '}
          </Badge>
        </View>

        <View style={styles.infoCol}>
          <Text typography="t6" fontWeight="medium" color={colors.grey800} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.priceRow}>
            {percent !== undefined && percent > 0 ? (
              <Text style={styles.percentText} typography="t4">
                {percent}%
              </Text>
            ) : null}
            <View style={{ flexDirection: "column" }}>
              {originPrice !== undefined && originPrice > 0 && originPrice > (salePrice ?? 0) ? (
                <Text typography="t7" color={colors.grey300} style={{ textDecorationLine: "line-through" }}>
                  {formatPrice(originPrice)}원
                </Text>
              ) : null}
              <Text typography="t6" fontWeight="bold" color={colors.grey900} style={{ marginRight: 8 }}>
                {salePrice ? `${formatPrice(salePrice)}원~` : "-"}
              </Text>
            </View>
          </View>

          {/* 필요하면 perPersonText 노출 */}
          {/* <Text typography="t7" color={colors.grey700} numberOfLines={1} style={{ marginTop: 6 }}>
            {perPersonText ?? ""}
          </Text> */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles aligned to ProductCard exactly (sizes/paddings/borderRadius/etc)
  cardWrap: {
    marginVertical: 8,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  imageCol: {
    position: "relative",
    width: 120,
    height: 120,
    marginRight: 14,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 13,
    backgroundColor: "#eee",
  },
  infoCol: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    paddingVertical: 0,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  percentText: {
    color: colors.red500,
    fontWeight: "bold",
    marginRight: 7,
    alignSelf: "center",
  },
});

export default MiniProductCard;