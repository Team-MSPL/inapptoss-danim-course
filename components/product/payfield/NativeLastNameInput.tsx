import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  cusType: string; // "cus_01" | "cus_02" | "contact" | "send"
  initialValue?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
};

export default function NativeLastNameInput({ cusType, initialValue = "", required = false, onValueChange }: Props) {
  const storedValue = useBookingStore((s) => s.customMap?.[cusType]?.native_last_name ?? "");
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [value, setValue] = useState<string>(initialValue || storedValue || "");

  useEffect(() => {
    if (storedValue && storedValue !== value) setValue(storedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedValue]);

  useEffect(() => {
    setCustomField(cusType, "native_last_name", value);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, cusType]);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        성(현지어) {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TextInput
        placeholder="예) 홍"
        placeholderTextColor={colors.grey400}
        value={value}
        onChangeText={setValue}
        style={styles.input}
        accessibilityLabel={`${cusType}-native-last-name`}
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