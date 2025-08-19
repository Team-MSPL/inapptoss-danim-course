import React from "react";
import {
  TouchableOpacity,
  Image,
  StyleSheet,
  View,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
import { CustomColor } from "../utill/custom-color";
import { Icon, Text } from "@toss-design-system/react-native";

export default function TendencyButton({
  onPress,
  label,
  bgColor,
  divide = false,
  marginBottom,
  imageUrl,
  imageSvg,
  width,
  disabled,
  textSize = 16,
}: CustomButtonProps) {
  const containerStyle: ViewStyle = {
    ...styles.buttonContainer,
    width: divide ? width ?? 159 : 327,
    paddingVertical: divide ? 10 : 0,
    paddingHorizontal: divide ? 13 : 0,
    borderColor: bgColor ? CustomColor.primary : CustomColor.ButtonBackground,
    backgroundColor: bgColor
      ? "rgba(195,245,80,0.3)"
      : CustomColor.ButtonBackground,
    marginBottom: marginBottom ?? 10,
    flexDirection: "row",
    gap: 10,
  };

  const textStyle: TextStyle = {
    fontSize: textSize,
    lineHeight: textSize + 4,
    color: bgColor ? CustomColor.ButtonGreyText : CustomColor.ButtonGreyText,
    fontWeight: "600", // Replace with PretendardSemiBold if using custom font
  };

  const imageStyle: ImageStyle = {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginLeft: 5,
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled}
    >
      <Text typography="t5" fontWeight="regular">
        {label}
      </Text>
      {imageUrl?.includes("http") ? (
        <Image type="circle" source={{ uri: imageUrl }} />
      ) : (
        <Icon name={imageUrl}></Icon>
      )}

      {/* <Icon name="icon-flag-krw"></Icon>
      {imageSvg && (
        <Image
          style={{ marginLeft: 5, width: 30, height: 30 }}
          source={{ uri: "https://static.toss.im/2d-emojis/png/4x/u1F31E.png" }}
        ></Image>
      )} */}
    </TouchableOpacity>
  );
}

type CustomButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  label: string | number;
  bgColor: boolean;
  divide?: boolean;
  marginBottom?: number;
  imageUrl?: string;
  width?: number;
  imageSvg?: React.ReactNode;
  disabled?: boolean;
  textSize?: number;
};

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    height: 60,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
});
