import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Button, Text, colors } from "@toss-design-system/react-native";
import useBookingStore from "../../../zustand/useBookingStore";
import CountrySelector from "../payfield/CountrySelector";

export default function BuyerInfoSection({ onComplete }: { onComplete?: () => void }) {
  const buyerLastName = useBookingStore((s) => s.buyer_last_name);
  const setBuyerLastName = useBookingStore((s) => s.setBuyerLastName);
  const buyerFirstName = useBookingStore((s) => s.buyer_first_name);
  const setBuyerFirstName = useBookingStore((s) => s.setBuyerFirstName);
  const buyerEmail = useBookingStore((s) => s.buyer_Email);
  const setBuyerEmail = useBookingStore((s) => s.setBuyerEmail);
  const buyerCountry = useBookingStore((s) => s.buyer_country);
  const setBuyerCountry = useBookingStore((s) => s.setBuyerCountry);
  const buyerTelCountryCode = useBookingStore((s) => s.buyer_tel_country_code);
  const setBuyerTelCountryCode = useBookingStore((s) => s.setBuyerTelCountryCode);
  const buyerTelNumber = useBookingStore((s) => s.buyer_tel_number);
  const setBuyerTelNumber = useBookingStore((s) => s.setBuyerTelNumber);

  return (
    <View style={styles.container}>
      <Text typography="t6" color={colors.grey800} style={styles.label}>구매자 성</Text>
      <TextInput
        placeholder="Last name"
        placeholderTextColor={colors.grey400}
        value={buyerLastName}
        onChangeText={setBuyerLastName}
        style={styles.input}
      />

      <Text typography="t6" color={colors.grey800} style={[styles.label, { marginTop: 8 }]}>구매자 이름</Text>
      <TextInput
        placeholder="First name"
        placeholderTextColor={colors.grey400}
        value={buyerFirstName}
        onChangeText={setBuyerFirstName}
        style={styles.input}
      />

      <Text typography="t6" color={colors.grey800} style={[styles.label, { marginTop: 8 }]}>이메일</Text>
      <TextInput
        placeholder="email@example.com"
        placeholderTextColor={colors.grey400}
        value={buyerEmail}
        onChangeText={setBuyerEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text typography="t6" color={colors.grey800} style={[styles.label, { marginTop: 8 }]}>전화번호</Text>
      <CountrySelector
        valueCode={buyerCountry}
        label="국가 선택"
        onSelect={({ code, dial }) => {
          setBuyerCountry(code);
          setBuyerTelCountryCode(String(dial));
        }}
      />

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
        <TouchableOpacity activeOpacity={0.85} style={styles.countryDialBox}>
          <Text style={styles.countryDialText}>{buyerTelCountryCode ? `+${String(buyerTelCountryCode)}` : "+82"}</Text>
        </TouchableOpacity>

        <View style={{ width: 12 }} />

        <TextInput
          placeholder="01012345678"
          placeholderTextColor={colors.grey400}
          value={String(buyerTelNumber ?? "")}
          onChangeText={setBuyerTelNumber}
          style={[styles.input, { flex: 1 }]}
          keyboardType="phone-pad"
        />
      </View>

      <View style={{ height: 12 }} />

      <Button
        type="primary"
        style="fill"
        display="block"
        size="large"
        containerStyle={{ alignSelf: 'center', width: 130, height: 50 }}
        onPress={() => onComplete && onComplete()}
      >
        작성 완료
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 0 },
  label: { marginBottom: 6 },
  input: {
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.greyOpacity100,
    paddingHorizontal: 12,
    color: colors.grey800,
  },
  countryDialBox: {
    height: 54,
    width: 90,
    borderRadius: 12,
    backgroundColor: colors.greyOpacity100,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  countryDialText: {
    color: colors.grey800,
  },
});