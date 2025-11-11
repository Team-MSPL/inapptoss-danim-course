import React, { useEffect, useState } from "react";
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

  // touched state to avoid showing errors before user interacts
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  // local derived validity
  const [emailValid, setEmailValid] = useState<boolean>(() => validateEmail(buyerEmail));
  const [phoneValid, setPhoneValid] = useState<boolean>(() => validatePhone(buyerTelNumber));

  // sync validity when store values change externally
  useEffect(() => {
    setEmailValid(validateEmail(buyerEmail));
  }, [buyerEmail]);

  useEffect(() => {
    setPhoneValid(validatePhone(buyerTelNumber));
  }, [buyerTelNumber, buyerTelCountryCode]);

  // decide whether all required fields are present and valid
  const canComplete = Boolean(
    buyerLastName && buyerFirstName && emailValid && phoneValid
  );

  // helpers
  function validateEmail(v?: string | null): boolean {
    if (!v) return false;
    const s = String(v).trim();
    // RFC-like simple email validation
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(s);
  }

  function normalizePhone(v?: string | null): string {
    if (!v) return "";
    return String(v).replace(/\D+/g, "");
  }

  function validatePhone(v?: string | null): boolean {
    const digits = normalizePhone(v);
    // basic length check: between 7 and 15 digits (international)
    if (digits.length < 7 || digits.length > 15) return false;
    // optionally check country code if provided (we accept)
    return /^[0-9]+$/.test(digits);
  }

  return (
    <View style={styles.container}>
      <Text typography="t6" color={colors.grey800} style={styles.label}>구매자 성</Text>
      <TextInput
        placeholder="Last name"
        placeholderTextColor={colors.grey400}
        value={buyerLastName}
        onChangeText={setBuyerLastName}
        style={styles.input}
        accessibilityLabel="buyer-last-name"
      />

      <Text typography="t6" color={colors.grey800} style={[styles.label, { marginTop: 8 }]}>구매자 이름</Text>
      <TextInput
        placeholder="First name"
        placeholderTextColor={colors.grey400}
        value={buyerFirstName}
        onChangeText={setBuyerFirstName}
        style={styles.input}
        accessibilityLabel="buyer-first-name"
      />

      <Text typography="t6" color={colors.grey800} style={[styles.label, { marginTop: 8 }]}>이메일</Text>
      <TextInput
        placeholder="email@example.com"
        placeholderTextColor={colors.grey400}
        value={buyerEmail ?? ""}
        onChangeText={(t) => {
          setBuyerEmail(t);
          if (!emailTouched) setEmailTouched(true);
          setEmailValid(validateEmail(t));
        }}
        onBlur={() => setEmailTouched(true)}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="buyer-email"
      />
      {emailTouched && !emailValid ? (
        <Text typography="t8" color={colors.red400} style={styles.errorText}>
          이메일 형식이 올바르지 않습니다.
        </Text>
      ) : null}

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
          onChangeText={(t) => {
            setBuyerTelNumber(t);
            if (!phoneTouched) setPhoneTouched(true);
            setPhoneValid(validatePhone(t));
          }}
          onBlur={() => setPhoneTouched(true)}
          style={[styles.input, { flex: 1 }]}
          keyboardType="phone-pad"
          accessibilityLabel="buyer-phone"
        />
      </View>
      {phoneTouched && !phoneValid ? (
        <Text typography="t8" color={colors.red400} style={styles.errorText}>
          전화번호 형식이 올바르지 않습니다. 숫자만 입력하고 국가번호 포함 길이를 확인하세요.
        </Text>
      ) : null}

      <View style={{ height: 12 }} />

      <Button
        type="primary"
        style="fill"
        display="block"
        size="large"
        containerStyle={{ alignSelf: 'center', width: 130, height: 50 }}
        onPress={() => onComplete && onComplete()}
        disabled={!canComplete}
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
  errorText: {
    marginTop: 6,
    fontSize: 12,
  },
});