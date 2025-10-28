import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Option = { code?: number | string; info?: string; [k: string]: any };

type Props = {
  cusType: string; // "contact" | "send"
  options?: Option[]; // rawFields.custom.tel_country_code.list_option
  label?: string;
  required?: boolean;
  onValueChange?: (v: string | null) => void;
};

export default function TelCountryCodeSelector({
                                                 cusType,
                                                 options = [],
                                                 label = "국가 코드",
                                                 required = false,
                                                 onValueChange,
                                               }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.tel_country_code ?? null);
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(stored ?? null);

  useEffect(() => {
    if ((stored ?? null) !== selectedCode) setSelectedCode(stored ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    // 저장은 문자열 형태로 (code가 number일 경우에도)
    if (selectedCode !== null) {
      setCustomField(cusType, "tel_country_code", String(selectedCode));
      onValueChange?.(selectedCode);
    } else {
      setCustomField(cusType, "tel_country_code", "");
      onValueChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode, cusType]);

  if (!Array.isArray(options) || options.length === 0) return null;

  const selectedOption = options.find(o => String(o.code) === String(selectedCode)) ?? null;
  const selectedLabel = selectedOption?.info ?? selectedOption?.name ?? null;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(prev => !prev)} style={styles.input}>
        <Text style={{ color: selectedLabel ? colors.grey800 : colors.grey400 }}>{selectedLabel ?? "선택하세요"}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled>
            {options.map((opt, idx) => {
              const code = opt.code ?? String(idx);
              const labelText = opt.info ?? String(code);
              const active = String(code) === String(selectedCode);
              return (
                <TouchableOpacity
                  key={String(code) + String(idx)}
                  onPress={() => { setSelectedCode(String(code)); setOpen(false); }}
                  style={[styles.optionRow, active ? styles.optionRowActive : undefined]}
                >
                  <Text style={active ? { color: "#fff" } : undefined}>{labelText} {opt.code ? `(+${opt.code})` : ""}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.greyOpacity100,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 220,
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  optionRowActive: {
    backgroundColor: colors.blue500,
  },
});