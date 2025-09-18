import React from 'react';
import {
  TouchableOpacity,
  Image,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
} from 'react-native';
import { CustomColor } from '../utill/custom-color';
import { Icon, Text } from '@toss-design-system/react-native';

export default function TendencyButton({
  onPress,
  label,
  bgColor,
  divide = false,
  marginBottom,
  imageUrl,
  width,
  disabled,
}: CustomButtonProps) {
  const containerStyle: ViewStyle = {
    ...styles.buttonContainer,
    width: divide ? (width ?? 159) : 327,
    paddingVertical: divide ? 10 : 0,
    paddingHorizontal: divide ? 13 : 0,
    borderColor: bgColor ? CustomColor.primary : CustomColor.ButtonBackground,
    backgroundColor: bgColor ? 'rgba(195,245,80,0.3)' : CustomColor.ButtonBackground,
    marginBottom: marginBottom ?? 10,
    flexDirection: 'row',
    gap: 10,
  };

  return (
    <TouchableOpacity style={containerStyle} onPress={onPress} disabled={disabled}>
      <Text typography="t5" fontWeight="regular">
        {label}
      </Text>
      {imageUrl?.includes('http') ? (
        <Image style={{ width: 24, height: 24 }} source={{ uri: imageUrl }} />
      ) : (
        <Icon name={imageUrl}></Icon>
      )}
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
    alignItems: 'center',
    height: 60,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
});
