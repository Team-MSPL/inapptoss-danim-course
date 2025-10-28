import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet, TextInput } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = { trafficType: string; field: "s_time" | "e_time"; rawFields?: any; specIndex?: number; label?: string; required?: boolean; onValueChange?: (v: string) => void; };

function normalize(t: string) { const cleaned = t.replace(/[^0-9:]/g, ""); const parts = cleaned.split(":"); if (parts.length === 1 && parts[0].length > 2) return parts[0].slice(0,2) + ":" + parts[0].slice(2,4); return cleaned; }

export default function RentcarTimeInput({ trafficType, field, rawFields, specIndex, label, required = false, onValueChange }: Props) {
  const trafficSpec = Array.isArray(rawFields?.traffics) ? rawFields.traffics[specIndex ?? rawFields.traffics.findIndex((t:any)=>t?.traffic_type?.traffic_type_value===trafficType)] ?? null : null;
  const listOptions: any[] = trafficSpec?.[field]?.list_option ?? [];

  const hasTimeRange = Array.isArray(listOptions) && listOptions.some(o => typeof o?.time_range === "string");
  const hasHourMin = Array.isArray(listOptions) && listOptions.some(o => typeof o?.hour !== "undefined" && typeof o?.min !== "undefined");

  const stored = useBookingStore((s) => (s.trafficArray ?? []).find((it) => { if (String(it?.traffic_type) !== String(trafficType)) return false; if (typeof specIndex === "number") return Number(it?.spec_index) === specIndex; return true; })?.[field] ?? "");
  const setTrafficField = useBookingStore((s) => s.setTrafficField);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(stored ?? "");

  useEffect(() => { if ((stored ?? "") !== value) setValue(stored ?? ""); }, [stored]);

  useEffect(() => { setTrafficField(trafficType, field, value ?? "", specIndex); onValueChange?.(value ?? ""); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [value, trafficType]);

  if (hasTimeRange) {
    const options = listOptions.filter(o => typeof o?.time_range === "string");
    return (
      <View style={{ marginBottom: 12 }}>
        <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>{label ?? (field === "s_time" ? "픽업" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(p => !p)} style={styles.input}><Text style={{ color: value ? colors.grey800 : colors.grey400 }}>{value ? value : "선택하세요"}</Text></TouchableOpacity>
        {open && (<View style={styles.dropdown}><ScrollView nestedScrollEnabled>{options.map((opt, idx) => { const labelText = opt.time_range; const active = String(labelText) === String(value); return (<TouchableOpacity key={String(idx)} onPress={() => { setValue(String(labelText)); setOpen(false); }} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}><Text style={active ? { color: "#fff" } : undefined}>{labelText}</Text></TouchableOpacity>); })}</ScrollView></View>)}
      </View>
    );
  }

  if (hasHourMin) {
    const options = listOptions.filter(o => typeof o?.hour !== "undefined" && typeof o?.min !== "undefined");
    const display = (opt: any) => `${String(opt.hour ?? "").padStart(2, "0")}:${String(opt.min ?? "").padStart(2, "0")}`;
    return (
      <View style={{ marginBottom: 12 }}>
        <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>{label ?? (field === "s_time" ? "픽업" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(p => !p)} style={styles.input}><Text style={{ color: value ? colors.grey800 : colors.grey400 }}>{value ? value : "선택하세요"}</Text></TouchableOpacity>
        {open && (<View style={styles.dropdown}><ScrollView nestedScrollEnabled>{options.map((opt, idx) => { const labelText = display(opt); const active = String(labelText) === String(value); return (<TouchableOpacity key={String(opt.id ?? idx)} onPress={() => { setValue(String(labelText)); setOpen(false); }} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}><Text style={active ? { color: "#fff" } : undefined}>{labelText}</Text></TouchableOpacity>); })}</ScrollView></View>)}
        <TextInput placeholder="직접 입력 (HH:mm)" placeholderTextColor={colors.grey400} value={value} onChangeText={(t) => setValue(normalize(t))} style={[styles.input, { marginTop: 8 }]} />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>{label ?? (field === "s_time" ? "픽업" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}</Text>
      <TextInput placeholder="HH:mm" placeholderTextColor={colors.grey400} value={value} onChangeText={(t) => setValue(normalize(t))} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { height: 54, borderRadius: 14, backgroundColor: colors.greyOpacity100, paddingHorizontal: 12, justifyContent: "center" },
  dropdown: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.grey200, borderRadius: 10, marginTop: 8, maxHeight: 220 },
  optionRow: { paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.grey100 },
  optionRowActive: { backgroundColor: colors.blue500 },
});