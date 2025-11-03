import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { Text, Icon, colors } from "@toss-design-system/react-native";
import styles from "./countrySelectorStyles";

const countryOptions = [
  { code: "KR", dial: "82", label: "한국 (KR) +82", lang: "ko" },
  { code: "JP", dial: "81", label: "日本 (JP) +81", lang: "ja" },
  { code: "US", dial: "1",  label: "United States (US) +1", lang: "en" },
  { code: "VN", dial: "84", label: "Việt Nam (VN) +84", lang: "vi" },
  { code: "TH", dial: "66", label: "ไทย (TH) +66", lang: "th" },
  { code: "CN", dial: "86", label: "中国 (CN) +86", lang: "zh-cn" },
  { code: "TW", dial: "886",label: "台灣 (TW) +886", lang: "zh-tw" },
  { code: "HK", dial: "852",label: "香港 (HK) +852", lang: "zh-hk" },
];

export default function CountrySelector({
                                          valueCode,
                                          onSelect,
                                          label,
                                        }: {
  valueCode?: string | null;
  onSelect: (opt: { code: string; dial: string }) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = countryOptions.find((c) => c.code === valueCode) ?? null;

  return (
    <View style={{ marginBottom: 8 }}>
      {label ? <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>{label}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen((s) => !s)}
        style={styles.countrySelect}
      >
        <Text style={{ color: selected ? colors.grey800 : colors.grey400 }}>
          {selected ? selected.label : "국가를 선택하세요"}
        </Text>
        <Icon name="icon-arrow-down" size={18} color={colors.grey400} />
      </TouchableOpacity>

      {open && (
        <View style={[styles.dropdown, { maxHeight: 240 }]}>
          <ScrollView nestedScrollEnabled>
            {countryOptions.map((opt) => {
              const active = opt.code === valueCode;
              return (
                <TouchableOpacity
                  key={opt.code}
                  onPress={() => {
                    onSelect({ code: opt.code, dial: opt.dial });
                    setOpen(false);
                  }}
                  style={[styles.optionRow, active ? styles.optionRowActive : undefined]}
                >
                  <Text style={active ? { color: "#fff" } : undefined}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}