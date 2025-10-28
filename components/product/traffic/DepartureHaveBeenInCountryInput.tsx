import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  trafficType: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  onValueChange?: (v: string) => void;
};

/**
 * departure_haveBeenInCountry: string
 * (사용 예: 이전 방문 날짜/년 등 자유 텍스트로 입력 받음)
 */
export default function DepartureHaveBeenInCountryInput({
                                                          trafficType,
                                                          label = "최근 방문(국가) 또는 날짜",
                                                          placeholder = "예) 2023-09-10 or Country name",
                                                          required = false,
                                                          onValueChange,
                                                        }: Props) {
  const stored = useBookingStore((s) => s.trafficArray?.find(it => String(it?.traffic_type) === String(trafficType))?.departure_haveBeenInCountry ?? "");
  const setTrafficField = useBookingStore((s) => s.setTrafficField);

  const [value, setValue] = useState<string>(stored ?? "");

  useEffect(() => {
    if ((stored ?? "") !== value) setValue(stored ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    setTrafficField(trafficType, "departure_haveBeenInCountry", value);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, trafficType]);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.grey400}
        value={value}
        onChangeText={setValue}
        style={styles.input}
        accessibilityLabel={`departure-havebeen-${trafficType}`}
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