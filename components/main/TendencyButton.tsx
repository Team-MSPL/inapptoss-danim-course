import React from "react";
import { TouchableOpacity, Image, StyleSheet, GestureResponderEvent, ViewStyle } from "react-native";
import { Icon, Text, colors } from "@toss-design-system/react-native";

type CustomButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  label: string | number;
  bgColor?: boolean;
  divide?: boolean;
  marginBottom?: number;
  imageUrl?: string; // either icon name like "icon-flag-kr-white" or http url
  width?: number;
  disabled?: boolean;
  textSize?: number;
};

export default function TendencyButton({
                                         onPress,
                                         label,
                                         bgColor = false,
                                         divide = false,
                                         marginBottom,
                                         imageUrl,
                                         width,
                                         disabled,
                                         textSize,
                                       }: CustomButtonProps) {
  const containerStyle: ViewStyle = {
    ...styles.buttonContainer,
    width: divide ? (width ?? 159) : (width ?? 327),
    paddingVertical: divide ? 10 : 0,
    paddingHorizontal: divide ? 13 : 0,
    borderColor: bgColor ? colors.blue200 : colors.grey200,
    backgroundColor: bgColor ? colors.blue50 : "#fff",
    marginBottom: marginBottom ?? 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  };

  return (
    <TouchableOpacity style={containerStyle} onPress={onPress} disabled={disabled}>
      <Text typography="t5" fontWeight="regular" style={{ marginRight: 8, fontSize: textSize ?? undefined }}>
        {label}
      </Text>
      {imageUrl?.includes("http") ? (
        <Image style={{ width: 24, height: 24 }} source={{ uri: imageUrl }} />
      ) : imageUrl ? (
        <Icon name={imageUrl} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    height: 60,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
});