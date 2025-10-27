import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Option = { meal_type?: string; meal_type_name?: string; [k: string]: any };

type Props = {
  cusType: string;
  options?: Option[]; // rawFields.custom.allergy_food.list_option
  label?: string;
  required?: boolean;
  onValueChange?: (v: string | null) => void;
};

/**
 * AllergyFoodSelector
 * - meal 선택과 동일한 방식으로 meal_type을 저장
 */
export default function AllergyFoodSelector({ cusType, options = [], label = "알레르기 음식", required = false, onValueChange }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.allergy_food ?? null);
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(stored ?? null);

  useEffect(() => {
    if ((stored ?? null) !== selectedId) setSelectedId(stored ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    if (selectedId !== null) {
      setCustomField(cusType, "allergy_food", selectedId);
      onValueChange?.(selectedId);
    } else {
      setCustomField(cusType, "allergy_food", "");
      onValueChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, cusType]);

  if (!Array.isArray(options) || options.length === 0) return null;

  const selectedOption = options.find(o => (o.meal_type ?? "") === selectedId) ?? null;
  const selectedLabel = selectedOption?.meal_type_name ?? null;

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
              const id = opt.meal_type ?? String(idx);
              const name = opt.meal_type_name ?? String(id);
              const active = id === selectedId;
              return (
                <TouchableOpacity key={String(id)} onPress={() => { setSelectedId(id); setOpen(false); }} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
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