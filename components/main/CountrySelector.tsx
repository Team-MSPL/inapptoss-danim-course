import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text } from "@toss-design-system/react-native";
import TendencyButton from "../tendency-button";

type Country = { code: string; dial?: string; label: string; lang?: string; iconName?: string };

/**
 * CountrySelector
 * - Renders a simple grid of country buttons using the project's TendencyButton component.
 * - Uses an explicit mapping for known country codes, and falls back to a flag image from flagcdn if the icon is not available.
 *
 * Usage:
 * <CountrySelector countries={COUNTRY_OPTIONS} onSelect={(code) => ...} columns={2} selectedCode={selectedCountry}/>
 *
 * Notes:
 * - TendencyButton will render an <Image> when imageUrl starts with 'http' (flagcdn) or render an internal icon when a named icon string is provided.
 * - The layout tries to evenly space items; last item in a row doesn't get extra right margin.
 */

const ICON_BY_CODE: Record<string, string> = {
  kr: "icon-flag-kr",
  jp: "icon-flag-jp",
  cn: "icon-flag-cn",
  vn: "icon-flag-vn",
  th: "icon-flag-th",
  ph: "icon-flag-ph",
  sg: "icon-flag-sg",
};

function makeFlagImageUrl(code?: string, size = 40) {
  if (!code) return undefined;
  const c = String(code).trim().toLowerCase();
  // flagcdn supports paths like /w40/{cc}.png
  // ensure two-letter code is passed (kr, jp, cn, vn, th, ph, sg)
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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {chunked.map((row, rIdx) => (
        <View key={rIdx} style={styles.row}>
          {row.map((c, idx) => {
            const code = (c.code ?? "").toLowerCase();
            // prefer explicit iconName if provided; otherwise use known mapping
            const mappedIcon = c.iconName ?? ICON_BY_CODE[code];
            // fallback to flagcdn image if no mapped icon
            const flagImage = makeFlagImageUrl(code, 40);
            const imageUrl = mappedIcon ? mappedIcon : flagImage;
            const isSelected = selectedCode ? selectedCode.toLowerCase() === code : false;

            // determine style for cell: remove right margin for last item in row
            const isLastInRow = idx === row.length - 1;
            const cellStyle = [styles.cell, isLastInRow && styles.cellLast];

            return (
              <View key={`${c.code}-${idx}`} style={cellStyle}>
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
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, i) => (
              <View key={`fill-${i}`} style={[styles.cell, styles.cellLast]} />
            ))}
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
  // remove right margin for last element in row so visual center alignment is correct
  cellLast: {
    marginRight: 0,
  },
});