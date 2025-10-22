import {StyleSheet, View} from "react-native";
import {Image} from "@granite-js/react-native";
import {Badge, colors, Text} from "@toss-design-system/react-native";
import React from "react";

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
  image?: string | null;
  title: string;
  originPrice?: number;
  salePrice?: number;
  percent?: number;
  perPersonText?: string;
}) {
  return (
    <View style={miniCardStyles.cardWrap}>
      <View style={miniCardStyles.cardInner}>
        <View style={miniCardStyles.imageCol}>
          <Image
            source={{ uri: image ?? "" }}
            style={miniCardStyles.image}
            resizeMode="cover"
          />
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

        <View style={miniCardStyles.infoCol}>
          <Text typography="t6" fontWeight="medium" color={colors.grey800} numberOfLines={1}>
            {title}
          </Text>

          <View style={miniCardStyles.priceRow}>
            {percent && percent > 0 ? (
              <Text style={miniCardStyles.percentText} typography="t4">{percent}%</Text>
            ) : null}
            <View style={{ flexDirection: 'column' }}>
              {originPrice !== undefined && originPrice > 0 && originPrice > (salePrice ?? 0) ? (
                <Text typography="t7" color={colors.grey300} style={{ textDecorationLine: 'line-through' }}>
                  {formatPrice(originPrice)}원
                </Text>
              ) : null}
              <Text typography="t6" fontWeight="bold" color={colors.grey900} style={{ marginTop: 4 }}>
                {salePrice ? `${formatPrice(salePrice)}원` : "-"}
                {perPersonText ? <Text typography="t7" color={colors.grey500}>{` ${perPersonText}`}</Text> : null}
              </Text>
            </View>
          </View>

          <Text typography="t7" color={colors.grey700} numberOfLines={1} style={{ marginTop: 6 }}>
            {perPersonText ?? ""}
          </Text>
        </View>
      </View>
    </View>
  );
}

const miniCardStyles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: 0,
    marginVertical: 6,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  imageCol: {
    position: "relative",
    width: 72,
    height: 72,
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
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
    marginRight: 8,
    alignSelf: "center",
  },
});