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
 * - If list_option contains time_range -> show an input where user types HH:mm.
 *   The component will parse the allowed range (e.g. "09:00~18:00" or "0:0~18:00") and validate
 *   typed time falls within that range. If outside, show message "허용 범위 밖입니다".
 * - If list_option contains hour/min -> show dropdown of HH:mm values + small manual input fallback.
 * - Otherwise show free-text input normalized to HH:mm-ish.
 */

function normalizeTime(t: string) {
  const cleaned = (t ?? "").replace(/[^0-9:]/g, "");
  const parts = cleaned.split(":").filter(Boolean);
  if (parts.length === 1) {
    const p = parts[0];
    if (p.length <= 2) return p.padStart(2, "0") + ":00";
    if (p.length === 3) return p.slice(0, 1).padStart(2, "0") + ":" + p.slice(1, 3);
    return p.slice(0, 2) + ":" + p.slice(2, 4);
  }
  const hh = (parts[0] ?? "").padStart(2, "0").slice(0, 2);
  const mm = (parts[1] ?? "00").padStart(2, "0").slice(0, 2);
  return `${hh}:${mm}`;
}

function timeToMinutes(hhmm: string) {
  const m = hhmm.split(":").map((s) => Number(s || 0));
  const h = Number.isFinite(m[0]) ? m[0] : 0;
  const mm = Number.isFinite(m[1]) ? m[1] : 0;
  return h * 60 + mm;
}

export default function PickupTimeInput({ trafficType, field, rawFields, specIndex, label, required = false, onValueChange }: Props) {
  // find trafficSpec (if duplicate specs exist, prefer specIndex; otherwise find by type)
  const trafficSpec = Array.isArray(rawFields?.traffics)
    ? rawFields.traffics[specIndex ?? rawFields.traffics.findIndex((t: any) => t?.traffic_type?.traffic_type_value === trafficType)] ?? null
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

  // --- NEW: time_range branch uses an input with validation against parsed range ---
  if (hasTimeRange) {
    // pick first time_range entry (if multiple, you can adapt to show multiple allowed ranges)
    const options = listOptions.filter(o => typeof o?.time_range === "string");
    const firstRange: string | null = options[0]?.time_range ?? null;

    // parse "HH:MM~HH:MM" or "H:M~HH:MM" etc.
    const parsedRange = useMemo(() => {
      if (!firstRange || typeof firstRange !== "string") return null;
      const raw = String(firstRange).replace(/\s+/g, "");
      const parts = raw.split("~");
      if (parts.length !== 2) return null;
      try {
        const start = normalizeTime(parts[0]);
        const end = normalizeTime(parts[1]);
        const startMin = timeToMinutes(start);
        const endMin = timeToMinutes(end);
        return { raw: firstRange, start, end, startMin, endMin };
      } catch {
        return null;
      }
    }, [firstRange]);

    // local input and validation state
    const [input, setInput] = useState<string>(() => value ? String(value) : "");
    const [touched, setTouched] = useState(false);
    const [inRange, setInRange] = useState<boolean>(() => {
      if (!parsedRange) return true;
      if (!input) return !required;
      try {
        const nm = normalizeTime(input);
        const m = timeToMinutes(nm);
        return m >= parsedRange.startMin && m <= parsedRange.endMin;
      } catch {
        return false;
      }
    });

    useEffect(() => {
      // sync store value -> local input when external changes
      if ((value ?? "") !== input) setInput(value ?? "");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useEffect(() => {
      // validate on change
      if (!parsedRange) {
        setInRange(true);
        return;
      }
      const v = String(input || "").trim();
      if (v === "") {
        setInRange(!required);
        return;
      }
      try {
        const nm = normalizeTime(v);
        const m = timeToMinutes(nm);
        setInRange(m >= parsedRange.startMin && m <= parsedRange.endMin);
      } catch {
        setInRange(false);
      }
    }, [input, parsedRange, required]);

    const handleAccept = () => {
      setTouched(true);
      if (!inRange) return;
      const nm = normalizeTime(input);
      setValue(nm);
    };

    return (
      <View style={{ marginBottom: 12 }}>
        <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
          {label ?? (field === "s_time" ? "픽업" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
        </Text>

        <TextInput
          placeholder={parsedRange ? `허용: ${parsedRange.start} ~ ${parsedRange.end} (HH:mm)` : "HH:mm"}
          placeholderTextColor={colors.grey400}
          value={input}
          onChangeText={(t) => setInput(t)}
          onBlur={() => setTouched(true)}
          style={styles.input}
          keyboardType="numbers-and-punctuation"
        />

        <View style={{ height: 8 }} />

        {parsedRange ? (
          <Text typography="t8" color={colors.grey600}>
            선택 가능한 시간 범위: {parsedRange.start} ~ {parsedRange.end}
          </Text>
        ) : null}

        {touched && !inRange ? (
          <Text typography="t8" color={colors.red400} style={{ marginTop: 6 }}>
            입력한 시간이 허용 범위 밖입니다. 범위 내의 시간을 입력해주세요.
          </Text>
        ) : null}

        <View style={{ height: 8 }} />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAccept}
          style={[
            styles.acceptButton,
            { backgroundColor: inRange ? colors.blue500 : colors.grey200 },
          ]}
        >
          <Text style={{ color: inRange ? "#fff" : colors.grey700 }}>시간 적용</Text>
        </TouchableOpacity>
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
  acceptButton: {
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});