import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Option = { id?: string; name?: string; [k: string]: any };

type Props = {
  trafficType: string; // e.g. "flight"
  rawFields?: any;
  trafficTypeValue?: string; // default "flight"
  label?: string;
  required?: boolean;
  onValueChange?: (v: string | null) => void;
};

export default function DepartureFlightTypeSelector({
                                                      trafficType,
                                                      rawFields,
                                                      trafficTypeValue = "flight",
                                                      label = "출발 항공편 유형",
                                                      required = false,
                                                      onValueChange,
                                                    }: Props) {
  const trafficSpec = Array.isArray(rawFields?.traffics)
    ? rawFields.traffics.find((t: any) => t?.traffic_type?.traffic_type_value === trafficTypeValue) ?? null
    : null;
  const options: Option[] = trafficSpec?.departure_flightType?.list_option ?? [];

  const stored = useBookingStore((s) => s.trafficArray?.find(it => String(it?.traffic_type) === String(trafficType))?.departure_flightType ?? null);
  const setTrafficField = useBookingStore((s) => s.setTrafficField);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(stored ?? null);

  useEffect(() => {
    if ((stored ?? null) !== selectedId) setSelectedId(stored ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  useEffect(() => {
    if (selectedId !== null && selectedId !== "") setTrafficField(trafficType, "departure_flightType", String(selectedId));
    else setTrafficField(trafficType, "departure_flightType", "");
    onValueChange?.(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, trafficType]);

  if (!Array.isArray(options) || options.length === 0) return null;

  const selectedOption = options.find((o) => String(o.id) === String(selectedId)) ?? null;
  const selectedLabel = selectedOption?.name ?? null;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen((p) => !p)} style={styles.input}>
        <Text style={{ color: selectedLabel ? colors.grey800 : colors.grey400 }}>{selectedLabel ?? "선택하세요"}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled>
            {options.map((opt, idx) => {
              const id = opt.id ?? String(idx);
              const name = opt.name ?? String(id);
              const active = String(id) === String(selectedId);
              return (
                <TouchableOpacity key={String(id) + String(idx)} onPress={() => { setSelectedId(String(id)); setOpen(false); }} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
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