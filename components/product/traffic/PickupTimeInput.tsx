import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet, TextInput } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  trafficType: string;
  field: "s_time" | "e_time";
  rawFields?: any;
  specIndex?: number;
  label?: string;
  required?: boolean;
  onValueChange?: (v: string) => void;
};

/**
 * PickupTimeInput
 * - If list_option exists:
 *   - if entries contain time_range -> show those ranges and store the time_range string
 *   - else if entries contain hour/min -> show HH:mm strings and store "HH:mm"
 * - If no list_option -> show free-text input (normalize to HH:mm-ish)
 */
function normalizeTime(t: string) {
  const cleaned = t.replace(/[^0-9:]/g, "");
  const parts = cleaned.split(":");
  if (parts.length === 1 && parts[0].length > 2) {
    return parts[0].slice(0,2) + ":" + parts[0].slice(2,4);
  }
  return cleaned;
}

export default function PickupTimeInput({ trafficType, field, rawFields, specIndex, label, required = false, onValueChange }: Props) {
  // find trafficSpec (if duplicate specs exist, prefer specIndex; otherwise find by type)
  const trafficSpec = Array.isArray(rawFields?.traffics)
    ? rawFields.traffics[specIndex ?? rawFields.traffics.findIndex((t:any)=>t?.traffic_type?.traffic_type_value===trafficType)] ?? null
    : null;

  const listOptions: any[] = trafficSpec?.[field]?.list_option ?? [];

  // determine option type
  const hasTimeRange = Array.isArray(listOptions) && listOptions.some(o => typeof o?.time_range === "string");
  const hasHourMin = Array.isArray(listOptions) && listOptions.some(o => typeof o?.hour !== "undefined" && typeof o?.min !== "undefined");

  // stored
  const stored = useBookingStore((s) =>
    (s.trafficArray ?? []).find((it) => {
      if (String(it?.traffic_type) !== String(trafficType)) return false;
      if (typeof specIndex === "number") return Number(it?.spec_index) === specIndex;
      return true;
    })?.[field] ?? ""
  );
  const setTrafficField = useBookingStore((s) => s.setTrafficField);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(stored ?? "");

  useEffect(() => {
    if ((stored ?? "") !== value) setValue(stored ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  // when value changes, write to store
  useEffect(() => {
    setTrafficField(trafficType, field, value ?? "", specIndex);
    onValueChange?.(value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, trafficType]);

  // UI: if time range options present -> render dropdown of ranges (store range string)
  if (hasTimeRange) {
    const options = listOptions.filter(o => typeof o?.time_range === "string");
    return (
      <View style={{ marginBottom: 12 }}>
        <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
          {label ?? (field === "s_time" ? "픽업" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
        </Text>

        <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(p => !p)} style={styles.input}>
          <Text style={{ color: value ? colors.grey800 : colors.grey400 }}>{value ? value : "선택하세요"}</Text>
        </TouchableOpacity>

        {open && (
          <View style={styles.dropdown}>
            <ScrollView nestedScrollEnabled>
              {options.map((opt, idx) => {
                const labelText = opt.time_range;
                const active = String(labelText) === String(value);
                return (
                  <TouchableOpacity key={String(idx)} onPress={() => { setValue(String(labelText)); setOpen(false); }} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
                    <Text style={active ? { color: "#fff" } : undefined}>{labelText}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  // if hour/min options present -> show dropdown of HH:mm, store as "HH:mm"
  if (hasHourMin) {
    const options = listOptions.filter(o => typeof o?.hour !== "undefined" && typeof o?.min !== "undefined");
    const display = (opt: any) => {
      const h = String(opt.hour ?? "").padStart(2, "0");
      const m = String(opt.min ?? "").padStart(2, "0");
      return `${h}:${m}`;
    };

    return (
      <View style={{ marginBottom: 12 }}>
        <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
          {label ?? (field === "s_time" ? "픽업" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
        </Text>

        <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(p => !p)} style={styles.input}>
          <Text style={{ color: value ? colors.grey800 : colors.grey400 }}>{value ? value : "선택하세요"}</Text>
        </TouchableOpacity>

        {open && (
          <View style={styles.dropdown}>
            <ScrollView nestedScrollEnabled>
              {options.map((opt, idx) => {
                const labelText = display(opt);
                const active = String(labelText) === String(value);
                return (
                  <TouchableOpacity key={String(opt.id ?? idx)} onPress={() => { setValue(String(labelText)); setOpen(false); }} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
                    <Text style={active ? { color: "#fff" } : undefined}>{labelText}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* allow manual input fallback - keep a small input below */}
        <TextInput placeholder="직접 입력 (HH:mm)" placeholderTextColor={colors.grey400} value={value} onChangeText={(t) => setValue(normalizeTime(t))} style={[styles.input, { marginTop: 8 }]} />
      </View>
    );
  }

  // default: free text time input (normalize to HH:mm-ish)
  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label ?? (field === "s_time" ? "픽업" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TextInput placeholder="HH:mm" placeholderTextColor={colors.grey400} value={value} onChangeText={(t) => setValue(normalizeTime(t))} style={styles.input} />
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