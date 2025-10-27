import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import { Image } from "@granite-js/react-native";
import { FixedBottomCTAProvider, Button, Text, colors, Icon, FixedBottomCTA } from "@toss-design-system/react-native";
import { useProductStore } from "../../zustand/useProductStore";
import { CollapsibleSection } from "../../components/product/collapsibleSection";
import { MiniProductCard } from "../../components/product/miniProductCard";
import { formatPrice } from "../../components/product/pay-function";
import {useBookingFields} from "../../kkday/kkdayBookingField";

export const Route = createRoute("/product/pay", {
  validateParams: (params) => params,
  component: ProductPay,
});

type PaymentMethod = "toss" | "naver" | "kakao" | "card" | null;

function ProductPay() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const pkgData = params?.pkgData ?? null;

  const { pdt } = useProductStore();
  if (!pdt) return null;

  const thumbnail = pdt?.prod_img_url ?? (pdt?.img_list && pdt.img_list[0]) ?? "";
  const title = pdt?.prod_name || pdt?.name;


  //BookingField
  const { fields: rawFields, loading: bfLoading, error: bfError } = useBookingFields({ prod_no: params?.prod_no ?? pdt?.prod_no, pkg_no: params?.pkg_no ?? null });
  console.log(rawFields);

  // openSections map
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: true });
  const [completedSections, setCompletedSections] = useState<Record<number, boolean>>({});

  // Requests
  const [orderNote, setOrderNote] = useState<string>(params?.order_note ?? "");

  // Payment & agreements
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("toss");
  const [agreeAll, setAgreeAll] = useState<boolean>(false);
  const [agreePersonal, setAgreePersonal] = useState<boolean>(false);
  const [agreeService, setAgreeService] = useState<boolean>(false);
  const [agreeMarketing, setAgreeMarketing] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (agreePersonal && agreeService && agreeMarketing) setAgreeAll(true);
    else if (agreeAll) setAgreeAll(false);
  }, [agreePersonal, agreeService, agreeMarketing]);

  function toggleAgreeAll() {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreePersonal(next);
    setAgreeService(next);
    setAgreeMarketing(next);
  }

  function toggleSection(idx: number) {
    setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  }

  function markCompleteAndNext(sectionIndex: number) {
    setCompletedSections((prev) => ({ ...prev, [sectionIndex]: true }));
    setOpenSections((prev) => ({ ...prev, [sectionIndex + 1]: true }));
  }

  // compute per-person prices and totals
  const adultPrice = params?.adult_price ?? params?.display_price ?? pkgData?.item?.[0]?.b2c_min_price ?? pkgData?.b2c_min_price ?? 0;
  const childPrice = params?.child_price ?? adultPrice;
  const adultCount = Number(params?.adult ?? 1);
  const childCount = Number(params?.child ?? 0);
  const adultTotal = adultPrice * adultCount;
  const childTotal = childPrice * childCount;
  const productAmount = adultTotal + childTotal;

  const originalPerPerson = params?.original_price ?? pkgData?.item?.[0]?.b2c_min_price ?? pkgData?.b2c_min_price ?? undefined;
  const salePerPerson = params?.display_price ?? adultPrice;
  const percent = (originalPerPerson && salePerPerson && originalPerPerson > salePerPerson)
    ? Math.floor(100 - (salePerPerson / originalPerPerson) * 100)
    : 0;

  const productDiscount = (originalPerPerson && salePerPerson && originalPerPerson > salePerPerson)
    ? Math.floor((originalPerPerson - salePerPerson) * (adultCount + childCount))
    : 0;

  // render (unchanged UI)
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FixedBottomCTAProvider>
        <View style={styles.container}>
          <Text typography="t5" color={colors.grey800}>예약/결제하기</Text>
        </View>

        {/* Tour info */}
        <CollapsibleSection
          title="투어 정보"
          open={!!openSections[0]}
          onToggle={() => toggleSection(0)}
          completed={!!completedSections[0]}
        >
          <Text typography="t4" fontWeight="bold" style={{ marginBottom: 12 }}>{title}</Text>
          <Image source={{ uri: thumbnail }} style={styles.tourImage} resizeMode="cover" />
          <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
            <Icon name="icon-calendar-timetable" size={20} color={colors.blue500} />
            <Text style={{ marginLeft: 8 }}>{params?.selected_date ?? "-"}</Text>

            <View style={{ width: 24 }} />

            <Icon name="icon-clock" size={20} color={colors.blue500} />
            <Text style={{ marginLeft: 8 }}>{params?.selected_time ?? params?.selected_time_slot ?? "-"}</Text>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
            <Icon name="icon-user-two-blue-tab" size={20} color={colors.blue500} />
            <Text style={{ marginLeft: 8 }}>{`인원수 성인 ${adultCount}명${childCount ? `, 아동 ${childCount}명` : ''}`}</Text>
          </View>
        </CollapsibleSection>


        {/* Requests */}
        <CollapsibleSection title="요청 사항" open={!!openSections[4]} onToggle={() => toggleSection(4)} completed={!!completedSections[4]}>
          <TextInput placeholder="요청사항을 입력하세요" placeholderTextColor={colors.grey400} value={orderNote} onChangeText={setOrderNote} style={[styles.input]} multiline />
          <View style={{ height: 12 }} />
          <Button type="primary" display="block" size="large" containerStyle={{ alignSelf: 'center', width: 130, height: 50 }} onPress={() => markCompleteAndNext(4)}>작성 완료</Button>
        </CollapsibleSection>

        {/* Payment details */}
        <CollapsibleSection title="결제 세부 내역" open={!!openSections[6]} onToggle={() => toggleSection(6)} completed={!!completedSections[6]}>
          <MiniProductCard
            image={thumbnail}
            title={title}
            originPrice={originalPerPerson}
            salePrice={salePerPerson}
            percent={percent}
            perPersonText={`${formatPrice(salePerPerson)}원 X ${adultCount + childCount}명`}
          />

          <View style={{ marginTop: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.grey100 }}>
            <View style={styles.row}>
              <Text typography='t5'>상품 금액</Text>
              <Text typography='t5'>{formatPrice(productAmount)}원</Text>
            </View>
            <View style={styles.row}>
              <Text typography='t5'>상품 할인</Text>
              <Text typography='t5'>{formatPrice(productDiscount)}원</Text>
            </View>
          </View>

          <View style={{ marginTop: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.grey100 }}>
            <View style={styles.row}>
              <Text typography="t4" fontWeight="bold" style={{ color: '#5350FF' }}>총 결제 금액</Text>
              <Text typography="t4" fontWeight="bold" style={{ color: '#5350FF' }}>{formatPrice(Math.max(0, productAmount - productDiscount))}원</Text>
            </View>
          </View>
        </CollapsibleSection>

        {/* separator */}
        <View style={{ height: 12, backgroundColor: colors.grey100, marginTop: 8 }} />

        {/* Payment area (standalone) */}
        <View style={[styles.sectionContainer, { paddingHorizontal: 24, paddingVertical: 24 }]}>
          <Text typography="t3" fontWeight='bold' style={{ marginBottom: 12 }}>결제 수단</Text>
          <View style={styles.paymentRow}>
            <TouchableOpacity style={[styles.paymentBtn, selectedPayment === "toss" && styles.paymentBtnActive]} onPress={() => setSelectedPayment("toss")}><Text>tosspay</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.paymentBtn, selectedPayment === "naver" && styles.paymentBtnActive]} onPress={() => setSelectedPayment("naver")}><Text>npay</Text></TouchableOpacity>
          </View>
          <View style={styles.paymentRow}>
            <TouchableOpacity style={[styles.paymentBtn, selectedPayment === "kakao" && styles.paymentBtnActive]} onPress={() => setSelectedPayment("kakao")}><Text>kpay</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.paymentBtn, selectedPayment === "card" && styles.paymentBtnActive]} onPress={() => setSelectedPayment("card")}><Text>신용카드/체크카드</Text></TouchableOpacity>
          </View>
        </View>

        {/* separator */}
        <View style={{ height: 12, backgroundColor: colors.grey100, marginTop: 8 }} />

        <View style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
          <Text typography="t3" fontWeight='bold' style={{ marginVertical: 6, padding: 8 }}>개인 정보 수집  ·  이용 약관 동의</Text>
          <TouchableOpacity onPress={toggleAgreeAll} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, }}>
            <View style={styles.checkbox}>{agreeAll && <Icon name="icon-check" size={14} color={colors.blue500} />}</View>
            <Text>전체 동의하기</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAgreePersonal(s => !s)} style={styles.agreeRow}>
            <View style={styles.checkbox}>{agreePersonal && <Icon name="icon-check" size={14} color={colors.blue500} />}</View>
            <Text style={{ marginLeft: 8 }}>(필수) 개인정보 처리방침 동의</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAgreeService(s => !s)} style={styles.agreeRow}>
            <View style={styles.checkbox}>{agreeService && <Icon name="icon-check" size={14} color={colors.blue500} />}</View>
            <Text style={{ marginLeft: 8 }}>(필수) 서비스 이용 약관 동의</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAgreeMarketing(s => !s)} style={styles.agreeRow}>
            <View style={styles.checkbox}>{agreeMarketing && <Icon name="icon-check" size={14} color={colors.blue500} />}</View>
            <Text style={{ marginLeft: 8 }}>(선택) 마케팅 수신 동의</Text>
          </TouchableOpacity>
        </View>

        {/* bottom CTA */}
        <FixedBottomCTA onPress={() => {}} disabled={!false || submitting}>
          {submitting ? "결제중..." : `${formatPrice(Math.max(0, productAmount - productDiscount))}원 결제하기`}
        </FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionBody: {
    paddingBottom: 18,
    paddingTop: 6,
  },
  input: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.greyOpacity100,
    paddingHorizontal: 12,
    marginTop: 8,
    color: colors.grey800,
  },
  select: {
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.grey50,
    paddingHorizontal: 12,
    justifyContent: "center",
    marginTop: 8,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paymentBtn: {
    flex: 1,
    height: 46,
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.grey200,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentBtnActive: {
    borderColor: colors.blue500,
  },
  agreeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginLeft: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.grey300,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  smallOption: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.greyOpacity100,
    backgroundColor: colors.grey50,
  },
  smallOptionActive: {
    borderWidth: 1,
    borderColor: colors.blue500,
  },
  smallOptionActiveText: {
    color: colors.blue500,
  },
  tourImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 200,
    zIndex: 999,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  sameBox: {
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grey300,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    backgroundColor: '#fff',
  },

  checkboxBoxChecked: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
});

export default ProductPay;