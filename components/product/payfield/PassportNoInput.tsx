import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  cusType: string;
  initialValue?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
  /**
   * Optional custom validation pattern. Default: alphanumeric 5-20 chars.
   * You can pass a RegExp, e.g. /^[A-Za-z0-9]{5,20}$/
   */
  pattern?: RegExp;
  /**
   * Optional custom error message shown when the value doesn't match the pattern.
   */
  errorMessage?: string;
  /**
   * Optional callback to inform parent about validity changes.
   */
  onValidityChange?: (isValid: boolean) => void;
};

export default function PassportNoInput({
                                          cusType,
                                          initialValue = "",
                                          required = false,
                                          onValueChange,
                                          pattern = /^[A-Za-z0-9]{5,20}$/,
                                          errorMessage = "여권 번호 형식과 일치하지 않습니다.",
                                          onValidityChange,
                                        }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.passport_no ?? "");
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [value, setValue] = useState<string>(initialValue || stored || "");
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState<boolean>(() => {
    const v = initialValue || stored || "";
    return v === "" ? !required : pattern.test(String(v).trim());
  });

  useEffect(() => {
    if (stored && stored !== value) setValue(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  // update booking store and notify parent when value changes
  useEffect(() => {
    setCustomField(cusType, "passport_no", value);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, cusType]);

  // validate when value or required/pattern changes
  useEffect(() => {
    const v = String(value || "").trim();
    const valid = v === "" ? !required : pattern.test(v);
    if (valid !== isValid) {
      setIsValid(valid);
      onValidityChange?.(valid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, required, pattern]);

  // decide whether to show the error message:
  // show when input has content and is invalid, or when touched and required but empty
  const showError = (() => {
    const v = String(value || "").trim();
    if (v.length === 0) {
      return touched && required && !isValid;
    }
    return !isValid;
  })();

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        여권 번호 {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>
      <TextInput
        placeholder="예) M12345678"
        placeholderTextColor={colors.grey400}
        value={value}
        onChangeText={setValue}
        onBlur={() => setTouched(true)}
        style={styles.input}
        accessibilityLabel={`${cusType}-passport-no`}
        autoCapitalize="characters"
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
    // keep font smaller and subtle
    fontSize: 12,
  },
});