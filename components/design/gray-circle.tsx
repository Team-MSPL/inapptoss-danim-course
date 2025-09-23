import React from "react";
import { View } from "react-native";
import {colors} from "@toss-design-system/react-native";

type GrayCircleProps = {
  size?: number;
  color?: string;
  style?: object;
};

export default function GrayCircle({
                                     size = 40,
                                     color = colors.grey600,
                                     style = {},
                                   }: GrayCircleProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        ...style,
      }}
    />
  );
}