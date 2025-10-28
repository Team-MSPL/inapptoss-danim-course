import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";

type City = {
  city_code?: string;
  name?: string;
  [k: string]: any;
};

type Country = {
  id?: string;
  code?: string;
  name?: string;
  cities?: City[];
  [k: string]: any;
};

type Props = {
  cusType: string; // "send"
  options?: Country[]; // rawFields.custom.country_cities.list_option
  labelCountry?: string;
  labelCity?: string;
  required?: boolean;
  onValueChange?: (cityCode: string | null) => void;
};

/**
 * CountryCitiesSelector
 * - first dropdown: country (options[].name)
 * - second dropdown: cities for selected country (cities[].name)
 * - final stored value: selected city's city_code as string in customMap[cusType].country_cities
 */
export default function CountryCitiesSelector({
                                                cusType,
                                                options = [],
                                                labelCountry = "국가",
                                                labelCity = "도시",
                                                required = false,
                                                onValueChange,
                                              }: Props) {
  // stored is city_code (string) per spec
  const stored = useBookingStore((s) => s.customMap?.[cusType]?.country_cities ?? "");
  const setCustomField = useBookingStore((s) => s.setCustomField);

  const [openCountry, setOpenCountry] = useState(false);
  const [openCity, setOpenCity] = useState(false);

  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedCityCode, setSelectedCityCode] = useState<string | null>(stored ?? null);

  // sync initial stored city_code -> find country & city
  useEffect(() => {
    if (!stored) {
      setSelectedCountryId(null);
      setSelectedCityCode(null);
      return;
    }
    // find country that contains a city with city_code === stored
    const found = (options || []).find((c) => Array.isArray(c.cities) && c.cities.some((ct) => String(ct.city_code) === String(stored)));
    if (found) {
      const countryId = found.id ?? found.code ?? String(found.name);
      setSelectedCountryId(String(countryId));
      setSelectedCityCode(String(stored));
    } else {
      // stored value exists but not in options => keep city code only
      setSelectedCountryId(null);
      setSelectedCityCode(String(stored));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, JSON.stringify(options)]);

  // persist selectedCityCode as custom field (string)
  useEffect(() => {
    if (selectedCityCode !== null && selectedCityCode !== "") {
      setCustomField(cusType, "country_cities", String(selectedCityCode));
      onValueChange?.(selectedCityCode);
    } else {
      setCustomField(cusType, "country_cities", "");
      onValueChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCityCode, cusType]);

  const countries = useMemo(() => (Array.isArray(options) ? options : []), [options]);

  const citiesForSelectedCountry: City[] = useMemo(() => {
    if (!selectedCountryId) return [];
    const found = countries.find(c => String(c.id ?? c.code ?? c.name) === String(selectedCountryId));
    return (found && Array.isArray(found.cities)) ? found.cities : [];
  }, [countries, selectedCountryId]);

  const selectedCountryLabel = countries.find(c => String(c.id ?? c.code ?? c.name) === String(selectedCountryId))?.name ?? null;
  const selectedCityLabel = (() => {
    const city = citiesForSelectedCountry.find(ct => String(ct.city_code) === String(selectedCityCode));
    if (city) return city.name ?? city.city_code;
    // fallback: if stored city not in selected country's cities (or country not selected),
    // try to find in any country list
    const anyCity = countries.flatMap(c => c.cities ?? []).find(ct => String(ct.city_code) === String(selectedCityCode));
    return anyCity ? anyCity.name ?? anyCity.city_code : null;
  })();

  // handlers
  const handleSelectCountry = (country: Country) => {
    const id = country.id ?? country.code ?? String(country.name);
    setSelectedCountryId(String(id));
    // reset city selection when changing country
    setSelectedCityCode(null);
    setOpenCountry(false);
  };

  const handleSelectCity = (city: City) => {
    const code = city.city_code ?? city.id ?? null;
    setSelectedCityCode(code ? String(code) : null);
    setOpenCity(false);
  };

  if (!Array.isArray(options) || options.length === 0) return null;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>
        국가/도시 {required ? <Text style={{ color: colors.red400 }}>*</Text> : null}
      </Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => { setOpenCountry(prev => !prev); setOpenCity(false); }} style={styles.input}>
            <Text style={{ color: selectedCountryLabel ? colors.grey800 : colors.grey400 }}>{selectedCountryLabel ?? "국가 선택"}</Text>
          </TouchableOpacity>
          {openCountry && (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled>
                {countries.map((c, idx) => {
                  const id = c.id ?? c.code ?? String(c.name);
                  const active = String(id) === String(selectedCountryId);
                  return (
                    <TouchableOpacity key={String(id) + String(idx)} onPress={() => handleSelectCountry(c)} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
                      <Text style={active ? { color: "#fff" } : undefined}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => { if (!selectedCountryId) return; setOpenCity(prev => !prev); setOpenCountry(false); }} style={styles.input}>
            <Text style={{ color: selectedCityLabel ? colors.grey800 : colors.grey400 }}>{selectedCityLabel ?? "도시 선택"}</Text>
          </TouchableOpacity>
          {openCity && (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled>
                {citiesForSelectedCountry.map((ct, idx) => {
                  const code = ct.city_code ?? ct.id ?? String(idx);
                  const active = String(code) === String(selectedCityCode);
                  return (
                    <TouchableOpacity key={String(code) + String(idx)} onPress={() => handleSelectCity(ct)} style={[styles.optionRow, active ? styles.optionRowActive : undefined]}>
                      <Text style={active ? { color: "#fff" } : undefined}>{ct.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
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