import React, { useEffect, useState } from "react";
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
  trafficType: string; // e.g. "rentcar_01"
  field: "s_location" | "e_location";
  rawFields?: any;
  label?: string;
  required?: boolean;
  onValueChange?: (v: string) => void;
};

/**
 * RentcarLocationSelector
 * - locationOptions에 id === "customize"가 있으면 그 옵션 자체가 "직접 입력" 역할을 함.
 * - customize 옵션 선택 시 텍스트 입력창이 표시되고 입력값을 해당 field에 저장.
 * - customize 옵션이 없으면 별도의 직접 입력 선택 항목은 노출되지 않음.
 */
export default function RentcarLocationSelector({
                                                  trafficType,
                                                  field,
                                                  rawFields,
                                                  label,
                                                  required = false,
                                                  onValueChange,
                                                }: Props) {
  const trafficSpec = Array.isArray(rawFields?.traffics)
    ? rawFields.traffics.find((t: any) => t?.traffic_type?.traffic_type_value === trafficType) ?? null
    : null;

  const locationOptions: LocationOption[] = trafficSpec?.[field]?.location ?? [];

  const stored = useBookingStore((s) => s.trafficArray?.find(it => String(it?.traffic_type) === String(trafficType))?.[field] ?? "");
  const setTrafficField = useBookingStore((s) => s.setTrafficField);

  const hasCustomizeSpec = Boolean(trafficSpec?.is_rent_customize); // 스펙상 is_rent_customize 존재 여부
  const allowCustomizeOption = locationOptions.some((o) => String(o.id) === "customize");

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState<string>("");

  // derive selectedId / customAddress from stored
  useEffect(() => {
    if (!Array.isArray(locationOptions) || locationOptions.length === 0) {
      setSelectedId(null);
      setCustomAddress("");
      return;
    }

    // 1) try match by address (most likely)
    const byAddress = locationOptions.find(opt => opt?.address && String(opt.address) === String(stored));
    if (byAddress) {
      setSelectedId(String(byAddress.id ?? byAddress.code ?? ""));
      setCustomAddress("");
      return;
    }

    // 2) try match by id/code (if stored is id/code)
    const byId = locationOptions.find(opt => String(opt.id) === String(stored) || String(opt.code) === String(stored));
    if (byId) {
      setSelectedId(String(byId.id ?? byId.code ?? ""));
      setCustomAddress("");
      return;
    }

    // 3) if customize option exists and stored is a non-empty free-text => treat as customize
    if (allowCustomizeOption && stored && String(stored).trim() !== "") {
      setSelectedId("customize");
      setCustomAddress(String(stored));
      return;
    }

    // else clear
    setSelectedId(null);
    setCustomAddress("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, JSON.stringify(locationOptions), allowCustomizeOption]);

  // when selectedId changes, write to store
  useEffect(() => {
    if (selectedId === null) {
      setTrafficField(trafficType, field, "");
      if (hasCustomizeSpec) setTrafficField(trafficType, "is_rent_customize", false);
      onValueChange?.("");
      return;
    }

    if (selectedId === "customize") {
      // Selected the customize option -> use customAddress (may be empty initially)
      setTrafficField(trafficType, field, customAddress ?? "");
      if (hasCustomizeSpec) setTrafficField(trafficType, "is_rent_customize", true);
      onValueChange?.(customAddress ?? "");
      return;
    }

    // selected a normal option by id/code
    const opt = locationOptions.find((o) => String(o.id) === String(selectedId) || String(o.code) === String(selectedId));
    const addr = opt?.address ?? opt?.name ?? "";
    setTrafficField(trafficType, field, addr);
    if (hasCustomizeSpec) setTrafficField(trafficType, "is_rent_customize", false);
    onValueChange?.(addr ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // when customAddress changes while customize is selected, write to store
  useEffect(() => {
    if (selectedId === "customize") {
      setTrafficField(trafficType, field, customAddress ?? "");
      if (hasCustomizeSpec) setTrafficField(trafficType, "is_rent_customize", true);
      onValueChange?.(customAddress ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customAddress]);

  if (!Array.isArray(locationOptions) || locationOptions.length === 0) return null;

  // display label: if option is customize, show "직접 입력" (사용자 요청)
  const selectedOption = locationOptions.find((o) => String(o.id) === String(selectedId) || String(o.code) === String(selectedId)) ?? null;
  const displayLabel = selectedOption
    ? (String(selectedOption.id) === "customize" ? (selectedOption.name ? `${selectedOption.name} (직접 입력)` : "직접 입력") : selectedOption.name)
    : (selectedId === "customize" ? customAddress ?? "직접 입력" : null);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label ?? (field === "s_location" ? "픽업 위치" : "하차 위치")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
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
                <TouchableOpacity
                  key={String(id) + String(idx)}
                  onPress={() => { setSelectedId(String(id)); setOpen(false); }}
                  style={[styles.optionRow, active ? styles.optionRowActive : undefined]}
                >
                  <Text style={active ? { color: "#fff" } : undefined}>{name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {allowCustomizeOption && selectedId === "customize" && (
        <TextInput
          placeholder="주소를 입력하세요"
          placeholderTextColor={colors.grey400}
          value={customAddress}
          onChangeText={setCustomAddress}
          style={[styles.input, { marginTop: 8 }]}
        />
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