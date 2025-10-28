import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, colors, Icon } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  cusType: string; // "contact"
  label?: string;
  onValueChange?: (v: boolean) => void;
};

/**
 * HaveAppToggle
 * - 사용자가 앱 설치 여부를 체크하면 boolean(true/false)으로 저장
 */
export default function HaveAppToggle({ cusType, label = "앱 설치 여부", onValueChange }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.have_app ?? false);
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [value, setValue] = useState<boolean>(!!stored);

  useEffect(() => {
    if (!!stored !== value) setValue(!!stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    setCustomField(cusType, "have_app", value);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, cusType]);

  return (
    <TouchableOpacity onPress={() => setValue(v => !v)} style={styles.row} accessibilityRole="button" accessibilityState={{ checked: value }}>
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