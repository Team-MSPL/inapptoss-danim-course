import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  cusType: string; // "contact" | "send"
  initialValue?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
  /**
   * Optional custom validation pattern for the normalized digits.
   * Default: allow 7..15 digits (international-friendly).
   */
  pattern?: RegExp;
  /**
   * Optional error message shown when the value doesn't match the pattern.
   */
  errorMessage?: string;
  /**
   * Optional callback to inform parent about validity changes.
   */
  onValidityChange?: (isValid: boolean) => void;
};

export default function TelNumberInput({
                                         cusType,
                                         initialValue = "",
                                         required = false,
                                         onValueChange,
                                         pattern = /^[0-9]{7,15}$/,
                                         errorMessage = "전화번호 형식이 올바르지 않습니다.",
                                         onValidityChange,
                                       }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.tel_number ?? "");
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [value, setValue] = useState<string>(initialValue || stored || "");
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState<boolean>(() => {
    const v = initialValue || stored || "";
    const digits = normalizePhone(v);
    return digits === "" ? !required : pattern.test(digits);
  });

  useEffect(() => {
    if ((stored ?? "") !== value) setValue(stored ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  // update booking store and notify parent when value changes
  useEffect(() => {
    setCustomField(cusType, "tel_number", value);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, cusType]);

  // validate when value or required/pattern changes
  useEffect(() => {
    const digits = normalizePhone(value);
    const valid = digits === "" ? !required : pattern.test(digits);
    if (valid !== isValid) {
      setIsValid(valid);
      onValidityChange?.(valid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, required, pattern]);

  function normalizePhone(v?: string | null): string {
    if (!v) return "";
    return String(v).replace(/\D+/g, "");
  }

  const showError = (() => {
    const digits = normalizePhone(value);
    if (digits.length === 0) {
      return touched && required && !isValid;
    }
    return !isValid;
  })();

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        연락처 번호 {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TextInput
        placeholder="예) 0912345678"
        placeholderTextColor={colors.grey400}
        value={value}
        onChangeText={(t) => {
          // keep formatting flexible for user, but store normalized digits only if you want.
          // We keep user's input (allow spaces/hyphens) but validation uses digits-only.
          setValue(t);
        }}
        onBlur={() => setTouched(true)}
        style={styles.input}
        keyboardType="phone-pad"
        accessibilityLabel={`${cusType}-tel-number`}
      />

      {showError ? (
        <Text color={colors.red400} style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}
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
  errorText: {
    marginTop: 6,
    fontSize: 12,
  },
});