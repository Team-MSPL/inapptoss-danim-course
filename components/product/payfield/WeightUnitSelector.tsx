import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Option = { id?: string; code?: string; name?: string; [k: string]: any };

type Props = {
  cusType: string;
  options?: Option[]; // rawFields.custom.weight_unit.list_option
  label?: string;
  required?: boolean;
  onValueChange?: (v: string | null) => void;
};

export default function WeightUnitSelector({ cusType, options = [], label = "체중 단위", required = false, onValueChange }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.weight_unit ?? null);
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(stored ?? null);

  useEffect(() => {
    if ((stored ?? null) !== selectedId) setSelectedId(stored ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    if (selectedId !== null) {
      setCustomField(cusType, "weight_unit", selectedId);
      onValueChange?.(selectedId);
    } else {
      setCustomField(cusType, "weight_unit", "");
      onValueChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, cusType]);

  if (!Array.isArray(options) || options.length === 0) return null;

  const selectedOption = options.find(o => (o.id ?? o.code) === selectedId) ?? null;
  const selectedLabel = selectedOption?.name ?? null;

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
              const id = opt.id ?? opt.code ?? String(idx);
              const name = opt.name ?? String(id);
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