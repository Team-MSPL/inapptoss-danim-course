import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet, TextInput } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type LocationOption = { id?: string; code?: string; name?: string; address?: string; [k: string]: any; };

type Props = {
  trafficType: string;
  field: "s_location" | "e_location";
  rawFields?: any;
  specIndex?: number;
  label?: string;
  required?: boolean;
  onValueChange?: (v: string) => void;
};

export default function RentcarLocationSelector({ trafficType, field, rawFields, specIndex, label, required = false, onValueChange }: Props) {
  const trafficSpec = Array.isArray(rawFields?.traffics)
    ? rawFields.traffics[specIndex ?? rawFields.traffics.findIndex((t: any) => t?.traffic_type?.traffic_type_value === trafficType)] ?? null
    : null;

  const locationOptions: LocationOption[] = trafficSpec?.[field]?.location ?? [];
  const allowCustomizeOption = locationOptions.some((o) => String(o.id) === "customize");

  const stored = useBookingStore((s) =>
    (s.trafficArray ?? []).find((it) => {
      if (String(it?.traffic_type) !== String(trafficType)) return false;
      if (typeof specIndex === "number") return Number(it?.spec_index) === specIndex;
      return true;
    })?.[field] ?? ""
  );
  const setTrafficField = useBookingStore((s) => s.setTrafficField);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState<string>("");

  // 초기값 동기화: stored 값이 option id/code/address 인지 판단해서 selectedId/customAddress를 셋팅
  useEffect(() => {
    if (!Array.isArray(locationOptions) || locationOptions.length === 0) {
      setSelectedId(null);
      setCustomAddress(String(stored ?? ""));
      return;
    }

    const byAddress = locationOptions.find((opt) => opt?.address && String(opt.address) === String(stored));
    if (byAddress) { setSelectedId(String(byAddress.id ?? byAddress.code ?? "")); setCustomAddress(""); return; }

    const byId = locationOptions.find((opt) => String(opt.id) === String(stored) || String(opt.code) === String(stored));
    if (byId) { setSelectedId(String(byId.id ?? byId.code ?? "")); setCustomAddress(""); return; }

    if (allowCustomizeOption && stored && String(stored).trim() !== "") {
      setSelectedId("customize"); setCustomAddress(String(stored)); return;
    }

    setSelectedId(null);
    setCustomAddress(String(stored ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, JSON.stringify(locationOptions), allowCustomizeOption]);

  // selectedId 변경 시: 주소만 저장 (is_rent_customize 저장은 제거됨)
  useEffect(() => {
    if (selectedId === null) {
      setTrafficField(trafficType, field, customAddress ? customAddress : "", specIndex);
      onValueChange?.(customAddress ?? "");
      return;
    }

    if (selectedId === "customize") {
      const addr = customAddress ?? "";
      setTrafficField(trafficType, field, addr, specIndex);
      onValueChange?.(addr);
      return;
    }

    const opt = locationOptions.find((o) => String(o.id) === String(selectedId) || String(o.code) === String(selectedId));
    const addr = opt?.address ?? opt?.name ?? "";
    setTrafficField(trafficType, field, addr, specIndex);
    onValueChange?.(addr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // customAddress 변경 시: 주소만 저장 (is_rent_customize 저장은 제거됨)
  useEffect(() => {
    if (selectedId === "customize") {
      const addr = customAddress ?? "";
      setTrafficField(trafficType, field, addr, specIndex);
      onValueChange?.(addr);
    } else if (!locationOptions || locationOptions.length === 0) {
      const addr = customAddress ?? "";
      setTrafficField(trafficType, field, addr, specIndex);
      onValueChange?.(addr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customAddress]);

  // 렌더: 옵션이 없으면 단순 텍스트 입력
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
                <TouchableOpacity key={String(id) + String(idx)} onPress={() => { setSelectedId(String(id)); setOpen(false); }} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
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
  input: { height: 54, borderRadius: 14, backgroundColor: colors.greyOpacity100, paddingHorizontal: 12, justifyContent: "center" },
  dropdown: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.grey200, borderRadius: 10, marginTop: 8, maxHeight: 220 },
  optionRow: { paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.grey100 },
  optionRowActive: { backgroundColor: colors.blue500 },
});