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

/**
 * EngFirstNameInput
 * - Manages local state for "english_first_name" and persists to zustand.
 * - Reads existing value from zustand on mount so edits persist.
 * - Notifies parent via onValueChange if provided.
 */
export default function EngFirstNameInput({
                                            cusType,
                                            initialValue = "",
                                            required = false,
                                            onValueChange,
                                          }: Props) {
  const storedValue = useBookingStore((s) => s.customMap?.[cusType]?.english_first_name ?? "");
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [value, setValue] = useState<string>(initialValue || storedValue || "");

  // sync store -> local if store has a value different than local
  useEffect(() => {
    if (storedValue && storedValue !== value) {
      setValue(storedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedValue]);

  // write to zustand and notify parent on change
  useEffect(() => {
    setCustomField(cusType, "english_first_name", value);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, cusType]);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        이름(영문) {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TextInput
        placeholder="예) GILDONG"
        placeholderTextColor={colors.grey400}
        value={value}
        onChangeText={setValue}
        style={styles.input}
        accessibilityLabel={`${cusType}-english-first-name`}
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