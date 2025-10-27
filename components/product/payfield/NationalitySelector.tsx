import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Option = { code?: string; id?: string; name?: string; [k: string]: any };

type Props = {
  cusType: string;
  options: Option[]; // from rawFields.custom.nationality.list_option
  label?: string;
  placeholder?: string;
  required?: boolean;
  onValueChange?: (v: string | null) => void;
};

/**
 * NationalitySelector
 * - renders a dropdown-style list of nationality options (name shown)
 * - stores selected option's code or id (prefer code) as nationality value under zustand.customMap[cusType].nationality
 */
export default function NationalitySelector({
                                              cusType,
                                              options = [],
                                              label = "국적",
                                              placeholder = "선택하세요",
                                              required = false,
                                              onValueChange,
                                            }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.nationality ?? null);
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(stored ?? null);

  useEffect(() => {
    if ((stored ?? null) !== selectedCode) setSelectedCode(stored ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    if (selectedCode !== null) {
      setCustomField(cusType, "nationality", selectedCode);
      onValueChange?.(selectedCode);
    } else {
      // clear
      setCustomField(cusType, "nationality", "");
      onValueChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode, cusType]);

  if (!Array.isArray(options) || options.length === 0) return null;

  const selectedOption = options.find(o => (o.code ?? o.id) === selectedCode);
  const selectedLabel = selectedOption?.name ?? null;

  const handleSelect = (opt: Option) => {
    const code = opt.code ?? opt.id ?? null;
    setSelectedCode(code);
    setOpen(false);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(prev => !prev)} style={styles.input}>
        <Text style={{ color: selectedLabel ? colors.grey800 : colors.grey400 }}>{selectedLabel ?? placeholder}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled>
            {options.map((opt, idx) => {
              const code = opt.code ?? opt.id ?? String(idx);
              const name = opt.name ?? String(code);
              const active = code === selectedCode;
              return (
                <TouchableOpacity key={String(code)} onPress={() => handleSelect(opt)} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
                  <Text style={active ? { color: "#fff" } : undefined}>{name}</Text>
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
    zIndex: 999,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
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