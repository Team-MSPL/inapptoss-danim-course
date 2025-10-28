import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  cusType: string; // "contact"
  initialValue?: string;
  required?: boolean;
  onValueChange?: (v: string) => void;
};

/**
 * ContactAppAccountInput
 * - 사용자가 연락 앱 계정(예: ID, 핸들 등)을 입력하면 contact_app_account 키에 저장
 */
export default function ContactAppAccountInput({ cusType, initialValue = "", required = false, onValueChange }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.contact_app_account ?? "");
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [value, setValue] = useState<string>(initialValue || stored || "");

  useEffect(() => {
    if ((stored ?? "") !== value) setValue(stored ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    setCustomField(cusType, "contact_app_account", value);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, cusType]);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        연락 앱 계정 {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>
      <TextInput
        placeholder="예) my_line_id"
        placeholderTextColor={colors.grey400}
        value={value}
        onChangeText={setValue}
        style={styles.input}
        accessibilityLabel={`${cusType}-contact-app-account`}
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