import React from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type RawFields = any;

export default function GuideLangSelector({
                                            rawFields,
                                            label = "가이드 언어",
                                            placeholder = "선택하세요",
                                            onSelect,
                                          }: {
  rawFields?: RawFields | null;
  label?: string;
  placeholder?: string;
  onSelect?: (code: string | null) => void;
}) {
  const options: Array<{ code?: string; id?: string; name?: string }> =
    (rawFields && rawFields.guide_lang && Array.isArray(rawFields.guide_lang.list_option))
      ? rawFields.guide_lang.list_option
      : [];

  const guideLangCode = useBookingStore((s) => s.guideLangCode);
  const setGuideLangCode = useBookingStore((s) => s.setGuideLangCode);

  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find(o => {
    const code = o.code ?? o.id ?? (o as any).value;
    return code !== undefined && code === guideLangCode;
  });

  const selectedLabel = selectedOption?.name ?? null;

  if (!options || options.length === 0) {
    return null;
  }

  const handleSelect = (opt: any) => {
    const code = opt.code ?? opt.id ?? opt.value ?? null;
    setGuideLangCode(code);
    onSelect?.(code);
    setOpen(false);
  };

  return (
    <View style={{ marginTop: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label} {rawFields?.guide_lang && String(rawFields.guide_lang.is_require).toLowerCase() === "true" ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen(prev => !prev)}
        style={styles.input}
      >
        <Text style={{ color: selectedLabel ? colors.grey800 : colors.grey400 }}>
          {selectedLabel ?? placeholder}
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled>
            {options.map((opt, idx) => {
              const code = opt.code ?? opt.id ?? (opt as any).value;
              const name = opt.name ?? String(code);
              const active = code === guideLangCode;
              return (
                <TouchableOpacity
                  key={String(code ?? idx)}
                  onPress={() => handleSelect(opt)}
                  style={[styles.optionRow, active ? styles.optionRowActive : undefined]}
                >
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