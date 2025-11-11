import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = { trafficType: string; label?: string; placeholder?: string; required?: boolean; onValueChange?: (v: number | null) => void; };

export default function LuggageCheckInput({ trafficType, label = "위탁수하물 (21인치 이상)", placeholder = "0", required = false, onValueChange }: Props) {
  const stored = useBookingStore((s) => s.trafficArray?.find(it => String(it?.traffic_type) === String(trafficType))?.luggage_check ?? "");
  const setTrafficField = useBookingStore((s) => s.setTrafficField);
  const [value, setValue] = useState<string>(stored !== undefined && stored !== null ? String(stored) : "");

  useEffect(() => {
    const storedStr = stored !== undefined && stored !== null ? String(stored) : "";
    if (storedStr !== value) setValue(storedStr);
  }, [stored]);

  useEffect(() => {
    const num = value === "" ? null : parseInt(value.replace(/[^0-9]/g, ""), 10);
    setTrafficField(trafficType, "luggage_check", num === null || isNaN(num) ? "" : num);
    onValueChange?.(num === null || isNaN(num) ? null : num);
  }, [value, trafficType]);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>{label} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}</Text>
      <TextInput placeholder={placeholder} placeholderTextColor={colors.grey400} value={value} onChangeText={(t) => setValue(t.replace(/[^0-9]/g, ""))} style={styles.input} keyboardType="numeric" accessibilityLabel={`luggage-check-${trafficType}`} />
    </View>
  );
}

const styles = StyleSheet.create({ input: { height: 54, borderRadius: 14, backgroundColor: colors.greyOpacity100, paddingHorizontal: 12, color: colors.grey800, }, });