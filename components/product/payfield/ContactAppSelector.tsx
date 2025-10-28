import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Option = { app_type?: string; app_name?: string; supported?: boolean; [k: string]: any };

type Props = {
  cusType: string; // "contact"
  options?: Option[]; // rawFields.custom.contact_app.list_option
  label?: string;
  required?: boolean;
  onValueChange?: (v: string | null) => void;
};

/**
 * ContactAppSelector
 * - 화면에는 app_name을 보여주고 사용자가 선택하면 app_type 값을 상태에 저장 (문자열)
 * - 예: 선택한 항목이 { app_type: "0001", app_name: "Line" }이면 "0001"을 저장
 */
export default function ContactAppSelector({
                                             cusType,
                                             options = [],
                                             label = "연락 앱",
                                             required = false,
                                             onValueChange,
                                           }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.contact_app ?? null);
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(stored ?? null);

  useEffect(() => {
    if ((stored ?? null) !== selectedType) setSelectedType(stored ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    if (selectedType !== null) {
      setCustomField(cusType, "contact_app", selectedType);
      onValueChange?.(selectedType);
    } else {
      setCustomField(cusType, "contact_app", "");
      onValueChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, cusType]);

  if (!Array.isArray(options) || options.length === 0) return null;

  const selectedOption = options.find(o => String(o.app_type) === String(selectedType)) ?? null;
  const selectedLabel = selectedOption?.app_name ?? null;

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
              const type = opt.app_type ?? String(idx);
              const name = (opt.app_name ?? String(type)).replace("\\n", "\n");
              const active = String(type) === String(selectedType);
              return (
                <TouchableOpacity key={String(type) + String(idx)} onPress={() => { setSelectedType(String(type)); setOpen(false); }} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
                  <Text style={active ? { color: "#fff" } : undefined}>{name}{opt.supported === false ? " (미지원)" : ""}</Text>
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