import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  cusType: string; // "send"
  initialValue?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
};

export default function HotelNameInput({ cusType, initialValue = "", required = false, onValueChange }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.hotel_name ?? "");
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [value, setValue] = useState<string>(initialValue || stored || "");

  useEffect(() => {
    if ((stored ?? "") !== value) setValue(stored ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    setCustomField(cusType, "hotel_name", value);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, cusType]);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        호텔 이름 {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>
      <TextInput
        placeholder="예) Grand Hotel"
        placeholderTextColor={colors.grey400}
        value={value}
        onChangeText={setValue}
        style={styles.input}
        accessibilityLabel={`${cusType}-hotel-name`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.greyOpacity100,
    paddingHorizontal: 12,
    color: colors.grey800,
  },
});