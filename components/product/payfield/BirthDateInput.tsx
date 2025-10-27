import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type Props = {
  cusType: string; // "cus_01" | "cus_02"
  required?: boolean;
  onValueChange?: (value: string) => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateYYYYMMDD(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

export default function BirthDateInput({ cusType, required = false, onValueChange }: Props) {
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.birth ?? "");
  const setCustomField = useBookingStore((s) => s.setCustomField);

  // derive initial parts from stored "YYYY-MM-DD" or default to empty
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);

  const [openPart, setOpenPart] = useState<"year" | "month" | "day" | null>(null);

  useEffect(() => {
    if (stored && typeof stored === "string") {
      const parts = stored.split("-");
      if (parts.length === 3) {
        const y = Number(parts[0]);
        const m = Number(parts[1]);
        const d = Number(parts[2]);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setYear(y);
          setMonth(m);
          setDay(d);
          return;
        }
      }
    }
    // if no valid stored value, clear
    setYear(null);
    setMonth(null);
    setDay(null);
  }, [stored]);

  // year range: currentYear - 100 ... currentYear
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr: number[] = [];
    const start = currentYear - 100;
    for (let y = currentYear; y >= start; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const daysInMonth = (y: number, m: number) => {
    return new Date(y, m, 0).getDate();
  };

  const days = useMemo(() => {
    if (year && month) {
      return Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);
    }
    return Array.from({ length: 31 }, (_, i) => i + 1);
  }, [year, month]);

  // when parts change, persist if full date available
  useEffect(() => {
    if (year && month && day) {
      const val = formatDateYYYYMMDD(year, month, day);
      setCustomField(cusType, "birth", val);
      onValueChange?.(val);
    } else {
      // keep as empty string if not complete
      setCustomField(cusType, "birth", "");
      onValueChange?.("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, day, cusType]);

  // helpers to render a compact "picker input"
  const renderPickerButton = (label: string, valueText: string | null, onPress: () => void) => (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.pickerButton}>
      <Text style={{ color: valueText ? colors.grey800 : colors.grey400 }}>{valueText ?? label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        생년월일 {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {renderPickerButton("연도", year ? String(year) : null, () => setOpenPart(openPart === "year" ? null : "year"))}
        {renderPickerButton("월", month ? pad(month) : null, () => setOpenPart(openPart === "month" ? null : "month"))}
        {renderPickerButton("일", day ? pad(day) : null, () => setOpenPart(openPart === "day" ? null : "day"))}
      </View>

      {openPart && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled>
            {openPart === "year" && years.map((y) => {
              const active = y === year;
              return (
                <TouchableOpacity
                  key={y}
                  onPress={() => {
                    setYear(y);
                    // if month/day invalid for new year, adjust day
                    if (month && day && day > daysInMonth(y, month)) {
                      setDay(daysInMonth(y, month));
                    }
                    setOpenPart(null);
                  }}
                  style={[styles.optionRow, active ? styles.optionRowActive : undefined]}
                >
                  <Text style={active ? { color: "#fff" } : undefined}>{y}</Text>
                </TouchableOpacity>
              );
            })}

            {openPart === "month" && months.map((m) => {
              const active = m === month;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    setMonth(m);
                    // adjust day if it exceeds new month's length
                    if (year && day && day > daysInMonth(year, m)) {
                      setDay(daysInMonth(year, m));
                    }
                    setOpenPart(null);
                  }}
                  style={[styles.optionRow, active ? styles.optionRowActive : undefined]}
                >
                  <Text style={active ? { color: "#fff" } : undefined}>{pad(m)}</Text>
                </TouchableOpacity>
              );
            })}

            {openPart === "day" && days.map((d) => {
              const active = d === day;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => { setDay(d); setOpenPart(null); }}
                  style={[styles.optionRow, active ? styles.optionRowActive : undefined]}
                >
                  <Text style={active ? { color: "#fff" } : undefined}>{pad(d)}</Text>
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
  pickerButton: {
    flex: 1,
    height: 54,
    marginRight: 8,
    borderRadius: 14,
    backgroundColor: colors.greyOpacity100,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 220,
    zIndex: 999,
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