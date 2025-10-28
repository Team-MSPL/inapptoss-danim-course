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
  trafficType: string; // "voucher"
  field?: "s_location" | "e_location";
  rawFields?: any;
  specIndex?: number;
  label?: string;
  required?: boolean;
  onValueChange?: (v: string) => void;
};

/**
 * VoucherLocationInput
 * - PickupLocationInput과 동일한 동작을 독립 구현:
 *   - rawFields에서 해당 spec (specIndex 우선) 의 location 옵션을 읽음
 *   - location 옵션이 있으면 드롭다운으로 name을 보여주고 선택 시 address (또는 name) 을 저장
 *   - location 옵션에 id === "customize" 가 있으면 그 항목 자체가 직접 입력 트리거가 되어
 *     선택 시 텍스트 입력이 노출되고 사용자가 입력한 값을 저장
 *   - location 옵션이 없으면 단순 텍스트 입력(문자열 저장)
 * - 상태는 useBookingStore.setTrafficField(trafficType, field, value, specIndex) 로 갱신
 */
export default function VoucherLocationInput({
                                               trafficType,
                                               field = "s_location",
                                               rawFields,
                                               specIndex,
                                               label,
                                               required = false,
                                               onValueChange,
                                             }: Props) {
  // find traffic spec instance (prefer specIndex, otherwise first matching type)
  const trafficSpec =
    Array.isArray(rawFields?.traffics)
      ? rawFields.traffics[specIndex ?? rawFields.traffics.findIndex((t: any) => t?.traffic_type?.traffic_type_value === trafficType)] ?? null
      : null;

  const locationOptions: LocationOption[] = trafficSpec?.[field]?.location ?? [];

  // read stored value for this trafficType (+ specIndex if provided)
  const stored = useBookingStore((s) =>
    (s.trafficArray ?? []).find((it) => {
      if (String(it?.traffic_type) !== String(trafficType)) return false;
      if (typeof specIndex === "number") return Number(it?.spec_index) === specIndex;
      return true;
    })?.[field] ?? ""
  );

  const setTrafficField = useBookingStore((s) => s.setTrafficField);

  const allowCustomizeOption = locationOptions.some((o) => String(o.id) === "customize");

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState<string>("");

  // derive initial selectedId / customAddress from stored
  useEffect(() => {
    if (!Array.isArray(locationOptions) || locationOptions.length === 0) {
      setSelectedId(null);
      setCustomAddress(String(stored ?? ""));
      return;
    }

    // match by address first
    const byAddress = locationOptions.find((opt) => opt?.address && String(opt.address) === String(stored));
    if (byAddress) {
      setSelectedId(String(byAddress.id ?? byAddress.code ?? ""));
      setCustomAddress("");
      return;
    }

    // match by id/code
    const byId = locationOptions.find((opt) => String(opt.id) === String(stored) || String(opt.code) === String(stored));
    if (byId) {
      setSelectedId(String(byId.id ?? byId.code ?? ""));
      setCustomAddress("");
      return;
    }

    // if customize exists and stored is a free-text -> treat as customize
    if (allowCustomizeOption && stored && String(stored).trim() !== "") {
      setSelectedId("customize");
      setCustomAddress(String(stored));
      return;
    }

    // fallback: no selection, keep stored as typed text (for location-less specs)
    setSelectedId(null);
    setCustomAddress(String(stored ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, JSON.stringify(locationOptions), allowCustomizeOption]);

  // write to store when selectedId changes
  useEffect(() => {
    if (!setTrafficField) {
      console.warn("VoucherLocationInput: setTrafficField not available in store");
      return;
    }

    if (selectedId === null) {
      // If no option selected, for specs without options we still save typed string.
      const val = customAddress ?? "";
      setTrafficField(trafficType, field, val, specIndex);
      onValueChange?.(val);
      return;
    }

    if (selectedId === "customize") {
      // use customAddress (may be empty until user types)
      const val = customAddress ?? "";
      setTrafficField(trafficType, field, val, specIndex);
      onValueChange?.(val);
      return;
    }

    // selected a normal option by id/code
    const opt = locationOptions.find((o) => String(o.id) === String(selectedId) || String(o.code) === String(selectedId));
    const addr = opt?.address ?? opt?.name ?? "";
    setTrafficField(trafficType, field, addr, specIndex);
    onValueChange?.(addr ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, setTrafficField, customAddress]);

  // when customAddress changed and customize selected (or when no options exist), write to store
  useEffect(() => {
    if (!setTrafficField) return;
    if (selectedId === "customize") {
      setTrafficField(trafficType, field, customAddress ?? "", specIndex);
      onValueChange?.(customAddress ?? "");
    } else if (!Array.isArray(locationOptions) || locationOptions.length === 0) {
      // no options: always write typed string
      setTrafficField(trafficType, field, customAddress ?? "", specIndex);
      onValueChange?.(customAddress ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customAddress, setTrafficField]);

  // If there are no location options, render a simple TextInput (string input)
  if (!Array.isArray(locationOptions) || locationOptions.length === 0) {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
          {label ?? (field === "s_location" ? "수령" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
        </Text>
        <TextInput
          placeholder="주소를 입력하세요"
          placeholderTextColor={colors.grey400}
          value={customAddress}
          onChangeText={setCustomAddress}
          style={[styles.input]}
          accessibilityLabel={`voucher-${field}-${specIndex ?? "0"}`}
        />
      </View>
    );
  }

  const selectedOption = locationOptions.find((o) => String(o.id) === String(selectedId) || String(o.code) === String(selectedId)) ?? null;
  const displayLabel = selectedOption
    ? (String(selectedOption.id) === "customize" ? (selectedOption.name ? `${selectedOption.name} (직접 입력)` : "직접 입력") : selectedOption.name)
    : (selectedId === "customize" ? customAddress ?? "직접 입력" : null);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        {label ?? (field === "s_location" ? "수령" : "하차")} {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
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
                  onPress={() => {
                    setSelectedId(String(id));
                    setOpen(false);
                  }}
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