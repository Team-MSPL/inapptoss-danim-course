import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  cusType: string; // e.g. "cus_01" or "cus_02"
  initialValue?: string;
  required?: boolean;
  onValueChange?: (value: string) => void; // optional parent callback
};

export default function EngLastNameInput({ cusType, initialValue = "", required = false, onValueChange }: Props) {
  const storedValue = useBookingStore((s) => s.customMap?.[cusType]?.english_last_name ?? "");
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [value, setValue] = useState<string>(initialValue || storedValue || "");

  // sync store -> local if store had a value
  useEffect(() => {
    if (storedValue && storedValue !== value) {
      setValue(storedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedValue]);

  // write to zustand and notify parent on change
  useEffect(() => {
    // ensure we always write using the exact API field name "english_last_name"
    setCustomField(cusType, "english_last_name", value);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, cusType]);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        성(영문) {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TextInput
        placeholder="예) HONG"
        placeholderTextColor={colors.grey400}
        value={value}
        onChangeText={setValue}
        style={styles.input}
        accessibilityLabel={`${cusType}-english-last-name`}
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