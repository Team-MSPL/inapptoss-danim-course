import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet, TextInput } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type LocationOption = {
  id?: string;
  code?: string;
  name?: string;
  address?: string;
  [k: string]: any;
};

type Props = {
  trafficType: string; // ex "pickup_03"
  field: "s_location" | "e_location";
  rawFields?: any;
  specIndex?: number;
  label?: string;
  required?: boolean;
  onValueChange?: (v: string) => void;
};

export default function PickupLocationInput({
                                              trafficType,
                                              field,
                                              rawFields,
                                              specIndex,
                                              label,
                                              required = false,
                                              onValueChange,
                                            }: Props) {
  const trafficSpec = Array.isArray(rawFields?.traffics)
    ? rawFields.traffics[specIndex ?? rawFields.traffics.findIndex((t: any) => t?.traffic_type?.traffic_type_value === trafficType)] ?? null
    : null;

  const locationOptions: LocationOption[] = useMemo(() => trafficSpec?.[field]?.location ?? [], [trafficSpec, field]);
  const allowCustomizeOption = useMemo(() => locationOptions.some((o) => String(o.id) === "customize"), [locationOptions]);

  const stored = useBookingStore((s: any) =>
    (s.trafficArray ?? []).find((it) => {
      if (String(it?.traffic_type) !== String(trafficType)) return false;
      if (typeof specIndex === "number") return Number(it?.spec_index) === specIndex;
      return true;
    })?.[field] ?? ""
  );
  const setTrafficField = useBookingStore((s: any) => s.setTrafficField);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState<string>("");

  // initial sync
  useEffect(() => {
    let nextSelectedId: string | null = null;
    let nextCustomAddress = "";

    if (!Array.isArray(locationOptions) || locationOptions.length === 0) {
      nextSelectedId = null;
      nextCustomAddress = String(stored ?? "");
    } else {
      const byAddress = locationOptions.find((opt) => opt?.address && String(opt.address) === String(stored));
      if (byAddress) {
        nextSelectedId = String(byAddress.id ?? byAddress.code ?? "");
        nextCustomAddress = "";
      } else {
        const byId = locationOptions.find((opt) => String(opt.id) === String(stored) || String(opt.code) === String(stored));
        if (byId) {
          nextSelectedId = String(byId.id ?? byId.code ?? "");
          nextCustomAddress = "";
        } else if (allowCustomizeOption && stored && String(stored).trim() !== "") {
          nextSelectedId = "customize";
          nextCustomAddress = String(stored);
        } else {
          nextSelectedId = null;
          nextCustomAddress = String(stored ?? "");
        }
      }
    }

    setSelectedId((prev) => (prev !== nextSelectedId ? nextSelectedId : prev));
    setCustomAddress((prev) => (prev !== nextCustomAddress ? nextCustomAddress : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, JSON.stringify(locationOptions), allowCustomizeOption]);

  // write when selectedId changes (guarded)
  useEffect(() => {
    let addrToStore = "";
    if (selectedId === null) {
      addrToStore = customAddress ? customAddress : "";
    } else if (selectedId === "customize") {
      addrToStore = customAddress ?? "";
    } else {
      const opt = locationOptions.find((o) => String(o.id) === String(selectedId) || String(o.code) === String(selectedId));
      addrToStore = opt?.address ?? opt?.name ?? "";
    }

    if (String(stored ?? "") === String(addrToStore ?? "")) {
      onValueChange?.(addrToStore ?? "");
      return;
    }

    setTrafficField(trafficType, field, addrToStore ?? "", specIndex);
    onValueChange?.(addrToStore ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, customAddress, specIndex, JSON.stringify(locationOptions), stored]);

  // write when customAddress changes (guarded)
  useEffect(() => {
    const isCustomActive = selectedId === "customize" || !Array.isArray(locationOptions) || locationOptions.length === 0;
    if (!isCustomActive) return;

    const addrToStore = customAddress ?? "";
    if (String(stored ?? "") === String(addrToStore)) return;

    setTrafficField(trafficType, field, addrToStore, specIndex);
    onValueChange?.(addrToStore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customAddress, selectedId, specIndex, stored]);

  if (!Array.isArray(locationOptions) || locationOptions.length === 0) {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
          {label ?? (field === "s_location" ? "픽업" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
        </Text>
        <TextInput placeholder="주소를 입력하세요" placeholderTextColor={colors.grey400} value={customAddress} onChangeText={setCustomAddress} style={[styles.input]} />
      </View>
    );
  }

  const selectedOption = locationOptions.find((o) => String(o.id) === String(selectedId) || String(o.code) === String(selectedId)) ?? null;
  const displayLabel = selectedOption ? (String(selectedOption.id) === "customize" ? (selectedOption.name ? `${selectedOption.name} (직접 입력)` : "직접 입력") : selectedOption.name) : (selectedId === "customize" ? customAddress ?? "직접 입력" : null);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label ?? (field === "s_location" ? "픽업" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen((p) => !p)} style={styles.input}>
        <Text style={{ color: displayLabel ? colors.grey800 : colors.grey400 }}>{displayLabel ?? "선택하세요"}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled>
            {locationOptions.map((opt, idx) => {
              const id = opt.id ?? opt.code ?? String(idx);
              const isCustomize = String(id) === "customize";
              const name = isCustomize ? (opt.name ? `${opt.name} (직접 입력)` : "직접 입력") : (opt.name ?? String(id));
              const active = String(id) === String(selectedId);
              return (
                <TouchableOpacity key={String(id) + String(idx)} onPress={() => { setSelectedId((prev) => (prev !== String(id) ? String(id) : prev)); setOpen(false); }} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
                  <Text style={active ? { color: "#fff" } : undefined}>{name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {allowCustomizeOption && selectedId === "customize" && (
        <TextInput placeholder="주소를 입력하세요" placeholderTextColor={colors.grey400} value={customAddress} onChangeText={setCustomAddress} style={[styles.input, { marginTop: 8 }]} />
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