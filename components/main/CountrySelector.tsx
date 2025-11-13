import React from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { Text } from "@toss-design-system/react-native";
import TendencyButton from "../tendency-button";

type Country = { code: string; dial?: string; label: string; lang?: string; iconName?: string };

/**
 * CountrySelector
 * - Renders a simple grid of country buttons using the project's TendencyButton component.
 * - Uses an explicit mapping for the 8 known country codes (without the `-white` suffix),
 *   and falls back to a flag image from flagcdn if the icon is not available.
 *
 * Usage:
 * <CountrySelector countries={COUNTRY_OPTIONS} onSelect={(code) => ...} columns={2} selectedCode={selectedCountry}/>
 *
 * The TendencyButton props mirror how other screens use it (marginBottom, bgColor, divide, imageUrl, onPress).
 */

const ICON_BY_CODE: Record<string, string> = {
  kr: "icon-flag-kr",
  jp: "icon-flag-jp",
  us: "icon-flag-us",
  vn: "icon-flag-vn",
  tw: "icon-flag-tw",
  cn: "icon-flag-cn",
  th: "icon-flag-th",
  hk: "icon-flag-hk",
};

function makeFlagImageUrl(code?: string, size = 40) {
  if (!code) return undefined;
  const c = String(code).trim().toLowerCase();
  return `https://flagcdn.com/w${size}/${c}.png`;
}

export default function CountrySelector({
                                          countries,
                                          onSelect,
                                          columns = 2,
                                          selectedCode,
                                        }: {
  countries: Country[];
  onSelect: (code: string) => void;
  columns?: number;
  selectedCode?: string | null;
}) {
  // chunk countries into rows of `columns`
  const chunked: Country[][] = [];
  for (let i = 0; i < countries.length; i += columns) {
    chunked.push(countries.slice(i, i + columns));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {chunked.map((row, rIdx) => (
        <View key={rIdx} style={styles.row}>
          {row.map((c, idx) => {
            const code = (c.code ?? "").toLowerCase();
            // prefer explicit iconName if provided; otherwise use known mapping
            const mappedIcon = c.iconName ?? ICON_BY_CODE[code];
            // TendencyButton renders <Image> if imageUrl startsWith('http')
            // So we pass either the icon name (string) or a fallback image url
            const flagImage = makeFlagImageUrl(code, 40);
            const imageUrl = mappedIcon ? mappedIcon : flagImage;
            const isSelected = selectedCode ? selectedCode.toLowerCase() === code : false;

            return (
              <View key={`${c.code}-${idx}`} style={styles.cell}>
                <TendencyButton
                  marginBottom={0}
                  bgColor={isSelected}
                  label={c.label}
                  divide
                  imageUrl={imageUrl}
                  onPress={() => onSelect(c.code)}
                />
              </View>
            );
          })}
          {/* fill empty cells if row shorter than columns */}
          {row.length < columns && Array.from({ length: columns - row.length }).map((_, i) => <View key={`fill-${i}`} style={styles.cell} />)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 36,
    alignItems: "stretch",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cell: {
    flex: 1,
    marginRight: 8,
  },
});