import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  trafficType: string;
  field: "s_time" | "e_time";
  label?: string;
  placeholder?: string;
  required?: boolean;
  onValueChange?: (v: string) => void;
};

/**
 * RentcarTimeInput: 시:분(HH:mm) 문자열을 저장
 */
export default function RentcarTimeInput({ trafficType, field, label, placeholder = "HH:mm", required = false, onValueChange }: Props) {
  const stored = useBookingStore((s) => s.trafficArray?.find(it => String(it?.traffic_type) === String(trafficType))?.[field] ?? "");
  const setTrafficField = useBookingStore((s) => s.setTrafficField);

  const [value, setValue] = useState<string>(stored ?? "");

  useEffect(() => {
    if ((stored ?? "") !== value) setValue(stored ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  // simple normalization: allow digits and colon, but ensure format roughly "HH:mm"
  const normalize = (t: string) => {
    const cleaned = t.replace(/[^0-9:]/g, "");
    // optionally insert colon after 2 digits
    const parts = cleaned.split(":");
    if (parts.length === 1 && parts[0].length > 2) {
      return parts[0].slice(0,2) + ":" + parts[0].slice(2,4);
    }
    return cleaned;
  };

  useEffect(() => {
    const safe = value ?? "";
    setTrafficField(trafficType, field, safe);
    onValueChange?.(safe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, trafficType]);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label ?? (field === "s_time" ? "대여 시작 시간" : "대여 종료 시간")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.grey400}
        value={value}
        onChangeText={(t) => setValue(normalize(t))}
        style={styles.input}
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