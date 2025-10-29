import React, { useEffect, useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text, colors, Icon } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  trafficType: string;         // e.g. "rentcar_01"
  spec?: any;                  // the rawFields.traffics[specIndex] object (optional)
  specIndex?: number;          // optional, to match the exact traffic entry in store
  label?: string;              // override label (if not provided, will use spec label)
  onValueChange?: (v: boolean) => void;
};

/**
 * RentcarCustomizeToggle
 *
 * - Only renders if spec?.is_rent_customize is present (truthy). If you pass `spec`,
 *   the component will check spec.is_rent_customize and use its label/default if provided.
 * - Persists user choice to the traffic entry under key "is_rent_customize" via setTrafficField.
 * - Reads existing stored value from trafficArray (matched by trafficType + optional specIndex).
 * - If nothing is stored, falls back to spec.is_rent_customize.default (if provided).
 */
export default function RentcarCustomizeToggle({
                                                 trafficType,
                                                 spec,
                                                 specIndex,
                                                 label,
                                                 onValueChange,
                                               }: Props) {
  // If spec is provided and it does not declare is_rent_customize, do not render anything.
  if (spec && !spec?.is_rent_customize) return null;

  const trafficArray = useBookingStore((s: any) => s.trafficArray ?? []);
  const setTrafficField = useBookingStore((s: any) => s.setTrafficField);

  const findStoredRaw = () => {
    const arr = trafficArray ?? [];
    const entry = arr.find((it: any) => {
      if (String(it?.traffic_type) !== String(trafficType)) return false;
      if (typeof specIndex === "number") return Number(it?.spec_index) === specIndex;
      return true;
    });
    if (!entry) return undefined;
    // return undefined when not present to allow spec default fallback
    if (typeof entry.is_rent_customize === "undefined") return undefined;
    const raw = entry.is_rent_customize;
    if (raw === true || raw === "true") return true;
    return false;
  };

  // determine initial value: stored -> spec default -> false
  const initialFromSpec = spec?.is_rent_customize?.default === true || spec?.is_rent_customize?.default === "true";
  const initialStored = findStoredRaw();
  const [value, setValue] = useState<boolean>(() => {
    if (typeof initialStored !== "undefined") return initialStored;
    return !!initialFromSpec;
  });

  // sync with store if it changes (or specIndex/trafficType changes)
  useEffect(() => {
    const storedVal = findStoredRaw();
    if (typeof storedVal !== "undefined") {
      if (storedVal !== value) setValue(storedVal);
    } else {
      // no stored value -> if spec has a default and it's different from local, update local
      const specDefault = spec?.is_rent_customize?.default === true || spec?.is_rent_customize?.default === "true";
      if (specDefault !== value) setValue(!!specDefault);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(trafficArray), trafficType, specIndex, JSON.stringify(spec?.is_rent_customize ?? {})]);

  // persist to store when user toggles
  useEffect(() => {
    setTrafficField(trafficType, "is_rent_customize", value ? true : false, specIndex);
    onValueChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, trafficType, specIndex]);

  const displayLabel = label ?? spec?.is_rent_customize?.label ?? "직접 주소 입력 여부";

  return (
    <TouchableOpacity
      onPress={() => setValue((v) => !v)}
      style={styles.row}
      accessibilityRole="button"
      accessibilityState={{ checked: value }}
    >
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Icon name="icon-check" size={14} color="#fff" />}
      </View>
      <Text style={{ marginLeft: 8 }}>{displayLabel}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.grey300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
});