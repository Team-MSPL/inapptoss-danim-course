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

export default function DepartureAirlineInput({
                                                trafficType,
                                                label = "출발 항공사",
                                                placeholder = "예) eva airline",
                                                required = false,
                                                onValueChange,
                                              }: Props) {
  const stored = useBookingStore((s) => s.trafficArray?.find(it => String(it?.traffic_type) === String(trafficType))?.departure_airlineName ?? "");
  const setTrafficField = useBookingStore((s) => s.setTrafficField);

  const [value, setValue] = useState<string>(stored ?? "");

  useEffect(() => {
    if ((stored ?? "") !== value) setValue(stored ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    setTrafficField(trafficType, "departure_airlineName", value);
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
        accessibilityLabel={`departure-airline-${trafficType}`}
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