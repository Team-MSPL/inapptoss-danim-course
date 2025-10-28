import React, { useEffect, useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text, colors, Icon } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  trafficType: string;
  label?: string;
  onValueChange?: (v: boolean) => void;
};

export default function ArrivalVisaToggle({ trafficType, label = "비자 필요 여부", onValueChange }: Props) {
  const stored = useBookingStore((s) => s.trafficArray?.find(it => String(it?.traffic_type) === String(trafficType))?.arrival_visa ?? false);
  const setTrafficField = useBookingStore((s) => s.setTrafficField);

  const [value, setValue] = useState<boolean>(!!stored);

  useEffect(() => {
    if (!!stored !== value) setValue(!!stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    setTrafficField(trafficType, "arrival_visa", value);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, trafficType]);

  return (
    <TouchableOpacity onPress={() => setValue((v) => !v)} style={styles.row} accessibilityRole="button" accessibilityState={{ checked: value }}>
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Icon name="icon-check" size={14} color="#fff" />}
      </View>
      <Text style={{ marginLeft: 8 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.grey300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
});