import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Option = { range?: string; interval?: number; [k: string]: any };

type Props = {
  cusType: string;
  options?: Option[]; // rawFields.custom.glass_degree.list_option
  label?: string;
  required?: boolean;
  onValueChange?: (v: number | null) => void;
};

/**
 * GlassDegreeSelector
 * - list_option에서 첫 항목의 "range" (예 "100~1000")과 "interval"을 사용해 선택 가능한 숫자 리스트 생성
 * - 사용자 선택값을 number 타입으로 zustand.customMap[cusType].glass_degree에 저장
 */
export default function GlassDegreeSelector({
                                              cusType,
                                              options = [],
                                              label = "안경 도수",
                                              required = false,
                                              onValueChange,
                                            }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.glass_degree ?? null);
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [open, setOpen] = useState(false);
  const [selectedVal, setSelectedVal] = useState<number | null>(stored ?? null);

  useEffect(() => {
    if ((stored ?? null) !== selectedVal) setSelectedVal(stored ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  // Persist numeric value
  useEffect(() => {
    if (selectedVal !== null) {
      setCustomField(cusType, "glass_degree", selectedVal);
      onValueChange?.(selectedVal);
    } else {
      setCustomField(cusType, "glass_degree", "");
      onValueChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVal, cusType]);

  const numericOptions = useMemo(() => {
    if (!Array.isArray(options) || options.length === 0) return [];
    const o = options[0];
    const rawRange = String(o.range ?? "");
    const interval = Number(o.interval ?? 1) || 1;
    const m = rawRange.match(/^\s*(\d+)\s*~\s*(\d+)\s*$/);
    if (!m) return [];
    const min = Number(m[1]);
    const max = Number(m[2]);
    if (isNaN(min) || isNaN(max) || min > max) return [];
    const arr: number[] = [];
    for (let v = min; v <= max; v += interval) arr.push(v);
    return arr;
  }, [options]);

  const displayLabel = selectedVal !== null ? String(selectedVal) : "선택하세요";

  if (numericOptions.length === 0) return null;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(prev => !prev)} style={styles.input}>
        <Text style={{ color: selectedVal !== null ? colors.grey800 : colors.grey400 }}>{displayLabel}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled>
            {numericOptions.map((n) => {
              const active = n === selectedVal;
              return (
                <TouchableOpacity key={String(n)} onPress={() => { setSelectedVal(n); setOpen(false); }} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
                  <Text style={active ? { color: "#fff" } : undefined}>{String(n)}</Text>
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