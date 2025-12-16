import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Button, Text, Icon, colors, FixedBottomCTA } from "@toss-design-system/react-native";

export default function PaymentFooter({
                                        selectedPayment,
                                        setSelectedPayment,
                                        agreeAll,
                                        agreePersonal,
                                        agreeService,
                                        agreeMarketing,
                                        setAgreePersonal,
                                        setAgreeService,
                                        setAgreeMarketing,
                                        toggleAgreeAll,
                                        onPay,
                                        bookingLoading,
                                      }: any) {
  return (
    <>
      <View style={{ height: 12, backgroundColor: colors.grey100, marginTop: 8 }} />

      <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
        <Text typography="t3" fontWeight='bold' style={{ marginBottom: 12 }}>결제 수단</Text>
        <TouchableOpacity style={[{ flex: 1, height: 46, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.grey200, flexDirection: 'row', alignItems: "center", justifyContent: "center" }, selectedPayment === "toss" && { borderColor: colors.blue500 }]} onPress={() => setSelectedPayment("toss")}>
          <Icon name='icn-bank-toss' />
          <View style={{flexDirection: 'row', gap: 4}}>
            <Text typography="t3" fontWeight='bold'>toss</Text>
            <Text typography="t3" fontWeight='medium'>pay</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
        <Text typography="t3" fontWeight='bold' style={{ marginVertical: 6, padding: 8 }}>개인 정보 수집  ·  이용 약관 동의</Text>

        <TouchableOpacity onPress={toggleAgreeAll} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.grey300, alignItems: "center", marginRight: 8, justifyContent: "center" }}>{agreeAll && <Icon name="icon-check" size={14} color={colors.blue500} />}</View>
          <Text>전체 동의하기</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setAgreePersonal((s: boolean) => !s)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, marginLeft: 12 }}>
          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.grey300, alignItems: "center", marginRight: 8, justifyContent: "center" }}>{agreePersonal && <Icon name="icon-check" size={14} color={colors.blue500} />}</View>
          <Text>(필수) 개인정보 처리방침 동의</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setAgreeService((s: boolean) => !s)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, marginLeft: 12 }}>
          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.grey300, alignItems: "center", marginRight: 8, justifyContent: "center" }}>{agreeService && <Icon name="icon-check" size={14} color={colors.blue500} />}</View>
          <Text>(필수) 서비스 이용 약관 동의</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setAgreeMarketing((s: boolean) => !s)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, marginLeft: 12 }}>
          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.grey300, alignItems: "center", marginRight: 8, justifyContent: "center" }}>{agreeMarketing && <Icon name="icon-check" size={14} color={colors.blue500} />}</View>
          <Text>(선택) 마케팅 수신 동의</Text>
        </TouchableOpacity>
      </View>

      <FixedBottomCTA onPress={onPay} disabled={bookingLoading}>
        {bookingLoading ? "결제중입니다..." : "결제하기"}
      </FixedBottomCTA>
    </>
  );
}