import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import { FixedBottomCTAProvider, Text, colors } from "@toss-design-system/react-native";
import { useProductStore } from "../../zustand/useProductStore";
import { MiniProductCard } from "../../components/product/miniProductCard";
import { formatPrice } from "../../components/product/pay-function";
import { useBookingFields } from "../../kkday/kkdayBookingField";
import useBookingStore from "../../zustand/useBookingStore";
import { useReservationStore } from "../../zustand/useReservationStore";
import { buildReservationPayload } from "../../components/product/booking/buildReservationPayload";
import {
  validateSection as validateSectionHelper,
  validateSectionBuilt as makeValidateSectionBuilt,
} from "../../components/product/booking/validationHelpers";
import useBookingApi from "../../hooks/useBookingApi";
import axios from "axios";
import useAuthStore from "../../zustand/useAuthStore";
import * as PayField from '../../components/product/payfield';
import * as Traffic from '../../components/product/traffic';
import ProductSections from "../../components/product/ProductSections";
import PaymentFooter from "../../components/product/PaymentFooter";
import { startTossPayment } from "../../hooks/useTossCheckout";

export const Route = createRoute("/product/pay", {
  validateParams: (params) => params,
  component: ProductPay,
});

type PaymentMethod = "toss" | "naver" | "kakao" | "card" | null;

function ProductPay() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const pkgData = params?.pkgData ?? null;

  useEffect(() => {
    useBookingStore.getState().resetAll();
  }, [params?.prod_no, params?.pkg_no]);

  const { pdt } = useProductStore();
  if (!pdt) return null;

  const thumbnail = pdt?.prod_img_url ?? (pdt?.img_list && pdt.img_list[0]) ?? "";
  const title = pdt?.prod_name || pdt?.name;

  const s_date = useReservationStore((s: any) => s.s_date);

  const { fields: rawFields, loading: bfLoading, error: bfError } = useBookingFields({
    prod_no: params?.prod_no ?? pdt?.prod_no,
    pkg_no: params?.pkg_no ?? null,
  });

  const uses: string[] = useMemo(() => {
    if (!rawFields || !rawFields.custom) return [];
    const cust = rawFields.custom.custom_type ?? rawFields.custom.cus_type ?? null;
    if (!cust) return [];
    if (Array.isArray(cust.use)) return cust.use;
    return [];
  }, [rawFields]);

  const hasCus01 = uses.includes("cus_01");
  const hasCus02 = uses.includes("cus_02");
  const hasContact = uses.includes("contact");
  const hasSend = uses.includes("send");

  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true });
  const [completedSections, setCompletedSections] = useState<Record<number, boolean>>({});

  const [orderNote, setOrderNote] = useState<string>(params?.order_note ?? "");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("toss");
  const [agreeAll, setAgreeAll] = useState<boolean>(false);
  const [agreePersonal, setAgreePersonal] = useState<boolean>(false);
  const [agreeService, setAgreeService] = useState<boolean>(false);
  const [agreeMarketing, setAgreeMarketing] = useState<boolean>(false);

  const [isPaying, setIsPaying] = useState<boolean>(false);

  const [pendingBookingPayload, setPendingBookingPayload] = useState<any | null>(null);
  const [pendingPayToken, setPendingPayToken] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const setGuideLangCode = useBookingStore((s: any) => s.setGuideLangCode);

  useEffect(() => {
    if (agreePersonal && agreeService && agreeMarketing) setAgreeAll(true);
    else if (agreeAll) setAgreeAll(false);
  }, [agreePersonal, agreeService, agreeMarketing]);

  const toggleAgreeAll = useCallback(() => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreePersonal(next);
    setAgreeService(next);
    setAgreeMarketing(next);
  }, [agreeAll]);

  const toggleSection = useCallback((idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const markCompleteAndNext = useCallback((sectionIndex: number) => {
    setCompletedSections((prev) => ({ ...prev, [sectionIndex]: true }));
    setOpenSections((prev) => ({ ...prev, [sectionIndex + 1]: true }));
    useBookingStore.getState();
  }, []);

  const adultPrice = params?.adult_price ?? params?.display_price ?? pkgData?.item?.[0]?.b2c_min_price ?? pkgData?.b2c_min_price ?? 0;
  const productAmount = params?.total;

  const originalPerPerson = params?.original_price ?? pkgData?.item?.[0]?.b2c_min_price ?? pkgData?.b2c_min_price ?? undefined;
  const salePerPerson = params?.display_price ?? adultPrice;

  const engLastSpec = rawFields?.custom?.english_last_name ?? null;
  const engLastUse: string[] = engLastSpec && Array.isArray(engLastSpec.use) ? engLastSpec.use : [];

  const engFirstSpec = rawFields?.custom?.english_first_name ?? null;
  const engFirstUse: string[] = engFirstSpec && Array.isArray(engFirstSpec.use) ? engFirstSpec.use : [];

  const genderSpec = rawFields?.custom?.gender ?? null;
  const genderUse: string[] = genderSpec && Array.isArray(genderSpec.use) ? genderSpec.use : [];

  const nationalitySpec = rawFields?.custom?.nationality ?? null;
  const nationalityOptions = nationalitySpec?.list_option ?? [];
  const nationalityUse: string[] = nationalitySpec && Array.isArray(nationalitySpec.use) ? nationalitySpec.use : [];

  const trafficSpec = rawFields?.traffics ?? [];
  const availableTrafficTypes: string[] = useMemo(() => {
    if (!Array.isArray(trafficSpec)) return [];
    return Array.from(new Set(trafficSpec.map((t: any) => t?.traffic_type?.traffic_type_value).filter(Boolean)));
  }, [rawFields]);

  const hasFlight = availableTrafficTypes.includes("flight");
  const hasPsgQty = availableTrafficTypes.includes("psg_qty");
  const hasVoucher = availableTrafficTypes.includes("voucher");
  const hasRentcar01 = availableTrafficTypes.includes("rentcar_01");
  const hasRentcar02 = availableTrafficTypes.includes("rentcar_02");
  const hasRentcar03 = availableTrafficTypes.includes("rentcar_03");
  const hasPickup03 = availableTrafficTypes.includes("pickup_03");
  const hasPickup04 = availableTrafficTypes.includes("pickup_04");

  const { loading: bookingLoading, error: bookingError, run } = useBookingApi();

  const userKey = useAuthStore.getState().userKey;
  const TOSS_PAY_API_KEY = import.meta.env.TOSS_PAY_API_KEY;

  const refundTossPayment = useCallback(async (payToken: string | null, amount: number) => {
    if (!payToken) return { success: false, error: "no_paytoken" };
    const url = "https://pay.toss.im/api/v2/refunds";
    const refundNo = `refund-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const body: any = { apiKey: TOSS_PAY_API_KEY, payToken, refundNo, amount, amountTaxFree: 0 };
    try {
      const resp = await axios.post(url, body, { headers: { "Content-Type": "application/json" }, timeout: 15000 });
      return { success: true, data: resp.data };
    } catch (err: any) {
      return { success: false, error: err?.response?.data ?? err?.message ?? err };
    }
  }, [TOSS_PAY_API_KEY]);

  const preparePayment = useCallback(() => {
    const currentBuyerEmail = useBookingStore.getState().buyer_Email;
    const emailValue = String(currentBuyerEmail ?? "").trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailValue)) throw new Error("INVALID_EMAIL");
    if (!rawFields) throw new Error("NO_FIELDS");

    const validateSectionFn = makeValidateSectionBuilt(rawFields, requiredMap);
    const sectionsToCheck = Object.keys(requiredMap).map((k) => Number(k)).filter((n) => !Number.isNaN(n) && n !== 12);
    for (const sectionIndex of sectionsToCheck) {
      const missing = typeof validateSectionFn === "function"
        ? validateSectionFn(sectionIndex)
        : validateSectionHelper(rawFields, sectionIndex, {
          hasCus01, hasCus02, hasContact, hasSend,
          hasFlight, hasPsgQty, hasRentcar01, hasRentcar02, hasRentcar03,
          hasPickup03, hasPickup04, hasVoucher
        });
      if (Array.isArray(missing) && missing.length > 0) throw new Error(`MISSING_FIELDS_IN_SECTION_${sectionIndex}`);
    }

    if (!agreePersonal || !agreeService) throw new Error("AGREEMENTS_NOT_ACCEPTED");

    const payload = buildReservationPayload({ params, pkgData, pdt, s_date, orderNote });
    const amount = Number(payload?.total ?? payload?.total_price ?? 0);
    if (isNaN(amount) || amount <= 0) throw new Error("INVALID_AMOUNT");

    const orderNoForMake = `order-${Date.now().toString(36)}`;
    const makeBody: any = {
      orderNo: orderNoForMake,
      productDesc: payload?.product?.name ?? payload?.productName ?? title,
      amount,
      amountTaxFree: 0,
      isTestPayment: true,
    };

    return { payload, amount, makeBody, orderNo: orderNoForMake };
  }, [
    rawFields, requiredMap, makeValidateSectionBuilt, params, pkgData, pdt, s_date, orderNote,
    agreePersonal, agreeService, title, hasCus01, hasCus02, hasContact, hasSend,
    hasFlight, hasPsgQty, hasRentcar01, hasRentcar02, hasRentcar03, hasPickup03, hasPickup04, hasVoucher
  ]);

  const onCompletePress = useCallback((sectionIndex: number) => {
    try {
      const validateSectionFn = makeValidateSectionBuilt(rawFields, requiredMap);
      const missing = typeof validateSectionFn === "function"
        ? validateSectionFn(sectionIndex)
        : validateSectionHelper(rawFields, sectionIndex, {
          hasCus01, hasCus02, hasContact, hasSend,
          hasFlight, hasPsgQty, hasRentcar01, hasRentcar02, hasRentcar03,
          hasPickup03, hasPickup04, hasVoucher
        });
      if (Array.isArray(missing) && missing.length > 0) {
        Alert.alert("입력 오류", `다음 항목이 비어있습니다:\n${missing.slice(0,20).join("\n")}`);
        return false;
      }
      markCompleteAndNext(sectionIndex);
      return true;
    } catch {
      Alert.alert("검증 오류", "입력 검증 중 오류가 발생했습니다.");
      return false;
    }
  }, [rawFields, requiredMap, makeValidateSectionBuilt, hasCus01, hasCus02, hasContact, hasSend, hasFlight, hasPsgQty, hasRentcar01, hasRentcar02, hasRentcar03, hasPickup03, hasPickup04, hasVoucher, markCompleteAndNext]);

  const onPay = useCallback(async () => {
    if (isPaying) return;
    setIsPaying(true);

    try {
      const { payload, amount, makeBody } = preparePayment();
      // makeBody가 토스 API에 전송할 바디입니다.
      // 숫자 필드(amount 등)이 숫자 타입으로 들어가도록 preparePayment에서 보장합니다.
      setPendingBookingPayload(payload);
      setPendingAmount(amount);

      // userKey는 useAuthStore에서 가져옵니다.
      const result = await startTossPayment(makeBody, userKey);

      if (!result?.success) {
        Alert.alert("결제 실패", result?.errorMessage ?? "결제 시작에 실패했습니다.");
        setIsPaying(false);
        return;
      }

      const payToken = result.payToken ?? null;
      if (payToken) setPendingPayToken(payToken);

      try {
        const runResult = await run(payload);
        let bookingAllSucceeded = true;
        if (Array.isArray((runResult as any).results)) {
          for (const r of (runResult as any).results) {
            const br = r?.bookingResponse;
            const ok = !!(br?.order_no ?? br?.orderNo ?? (br?.data && br.data.order_no));
            if (!ok) { bookingAllSucceeded = false; break; }
          }
        } else {
          const br = (runResult as any).bookingResponse ?? null;
          bookingAllSucceeded = !!(br?.order_no ?? br?.orderNo ?? (br?.data && br.data.order_no));
        }

        if (bookingAllSucceeded) {
          Alert.alert("예약 및 결제 성공", "결제 및 예약이 정상적으로 처리되었습니다.");
          setPendingBookingPayload(null); setPendingPayToken(null); setPendingAmount(null); setIsPaying(false);
          navigation.reset({ index: 1, routes: [{ name: `/${import.meta.env.APP_START_MODE}` }, { name: "/product/pay-success" }] });
          return;
        } else {
          const refundRes = await refundTossPayment(payToken, amount);
          if (refundRes.success) {
            Alert.alert("예약 실패 - 환불 완료", "예약 처리에 실패하여 결제 금액을 환불했습니다.");
          } else {
            Alert.alert("예약 실패 - 환불 실패", `예약 처리에 실패했습니다. 환불도 실패했습니다. 관리자에게 문의해주세요. (${String(refundRes.error)})`);
          }
          setPendingBookingPayload(null); setPendingPayToken(null); setPendingAmount(null); setIsPaying(false);
          navigation.reset({ index: 1, routes: [{ name: `/${import.meta.env.APP_START_MODE}` }, { name: "/product/pay-fail" }] });
          return;
        }
      } catch (bookingErr: any) {
        const refundRes = await refundTossPayment(payToken, amount);
        if (refundRes.success) {
          Alert.alert("예약 오류 및 환불 완료", "예약 처리 중 오류가 발생하여 결제 금액을 환불했습니다.");
        } else {
          Alert.alert("예약 오류 - 환불 실패", `예약 처리 중 오류가 발생했고, 환불에도 실패했습니다. 관리자에게 문의하세요. (${String(refundRes.error)})`);
        }
        setPendingBookingPayload(null); setPendingPayToken(null); setPendingAmount(null); setIsPaying(false);
        navigation.reset({ index: 1, routes: [{ name: `/${import.meta.env.APP_START_MODE}` }, { name: "/product/pay-fail" }] });
        return;
      }
    } catch (err: any) {
      const code = String(err?.message ?? err);
      if (code === "INVALID_EMAIL") Alert.alert("이메일 형식 오류", "유효한 이메일을 입력해 주세요.");
      else if (code === "NO_FIELDS") Alert.alert("입력 오류", "입력 필드 정보를 불러오지 못했습니다.");
      else if (code.startsWith("MISSING_FIELDS_IN_SECTION_")) Alert.alert("입력 오류", "필수 항목을 모두 채워주세요.");
      else if (code === "AGREEMENTS_NOT_ACCEPTED") Alert.alert("약관 동의 필요", "개인정보 처리방침 및 서비스 이용 약관에 동의해 주세요.");
      else if (code === "INVALID_AMOUNT") Alert.alert("결제 오류", "결제 금액이 올바르지 않습니다.");
      else {
        console.error("[ProductPay][onPay] unexpected error:", err);
        Alert.alert("결제 오류", "결제 준비 중 오류가 발생했습니다. 콘솔을 확인하세요.");
      }
      setIsPaying(false);
      return;
    }
  }, [preparePayment, userKey, run, refundTossPayment, isPaying]);

  const requiredMap = useMemo(() => {
    const map: Record<number, Array<any>> = {};
    const pushField = (section: number, item: any) => {
      if (!map[section]) map[section] = [];
      map[section].push(item);
    };

    map[1] = [
      { key: "buyer_last_name", label: "구매자 성" },
      { key: "buyer_first_name", label: "구매자 이름" },
      { key: "buyer_Email", label: "이메일" },
      { key: "buyer_tel_number", label: "전화번호" },
      { key: "buyer_country", label: "국가 코드" },
    ];

    if (rawFields?.guide_lang) {
      const isReq = String(rawFields.guide_lang?.is_require ?? "true").toLowerCase() === "true";
      if (isReq) pushField(2, { key: "guide_lang", label: "가이드 언어" });
    }

    if (rawFields?.custom && typeof rawFields.custom === "object") {
      Object.entries(rawFields.custom).forEach(([fieldId, specObj]: any) => {
        const useArr = specObj?.use ?? [];
        const isReq = String(specObj?.is_require ?? "").toLowerCase() === "true";
        if (!isReq || !Array.isArray(useArr)) return;
        useArr.forEach((cusType: string) => {
          let sectionIndex = -1;
          if (cusType === "cus_01") sectionIndex = 3;
          else if (cusType === "cus_02") sectionIndex = 4;
          else if (cusType === "contact") sectionIndex = 5;
          else if (cusType === "send") sectionIndex = 6;
          if (sectionIndex > 0) {
            pushField(sectionIndex, { key: fieldId, label: (specObj?.label ?? fieldId), cusType });
          }
        });
      });
    }

    if (Array.isArray(rawFields?.traffics)) {
      rawFields.traffics.forEach((spec: any, specIndex: number) => {
        const t = spec?.traffic_type?.traffic_type_value;
        if (!t) return;
        const sectionIndex =
          t === "flight" ? 7 :
            t === "psg_qty" ? 8 :
              t.startsWith("rentcar") ? 9 :
                t.startsWith("pickup") ? 10 :
                  t === "voucher" ? 11 : -1;
        if (sectionIndex === -1) return;

        Object.entries(spec).forEach(([fieldId, fieldSpec]: any) => {
          if (fieldId === "traffic_type") return;
          if (!fieldSpec || typeof fieldSpec !== "object") return;
          const isReq = String(fieldSpec?.is_require ?? "").toLowerCase() === "true";
          if (!isReq) return;
          pushField(sectionIndex, { key: fieldId, label: (fieldSpec?.label ?? fieldId), trafficType: t, specIndex });
        });
      });
    }

    return map;
  }, [rawFields]);

  if (bfLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>필드를 불러오는 중...</Text>
      </View>
    );
  }
  if (bfError) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Text color={colors.red500}>필드 로드 실패</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FixedBottomCTAProvider>
        <View style={styles.container}>
          <Text typography="t5" color={colors.grey800}>예약/결제하기</Text>
        </View>

        <ProductSections
          openSections={openSections}
          toggleSection={toggleSection}
          completedSections={completedSections}
          onCompletePress={onCompletePress}
          rawFields={rawFields}
          thumbnail={thumbnail}
          title={title}
          engLastUse={engLastUse}
          engFirstUse={engFirstUse}
          engLastSpec={engLastSpec}
          engFirstSpec={engFirstSpec}
          genderUse={genderUse}
          genderSpec={genderSpec}
          nationalityUse={nationalityUse}
          nationalityOptions={nationalityOptions}
          nationalitySpec={nationalitySpec}
          hasCus01={hasCus01}
          hasCus02={hasCus02}
          hasContact={hasContact}
          hasSend={hasSend}
          hasFlight={hasFlight}
          hasPsgQty={hasPsgQty}
          hasVoucher={hasVoucher}
          hasRentcar01={hasRentcar01}
          hasRentcar02={hasRentcar02}
          hasRentcar03={hasRentcar03}
          hasPickup03={hasPickup03}
          hasPickup04={hasPickup04}
          PayField={PayField}
          Traffic={Traffic}
          styles={styles}
          MiniProductCard={MiniProductCard}
          formatPrice={formatPrice}
          productAmount={productAmount}
          originalPerPerson={originalPerPerson}
          salePerPerson={salePerPerson}
        />

        <PaymentFooter
          selectedPayment={selectedPayment}
          setSelectedPayment={setSelectedPayment}
          agreeAll={agreeAll}
          agreePersonal={agreePersonal}
          agreeService={agreeService}
          agreeMarketing={agreeMarketing}
          setAgreePersonal={setAgreePersonal}
          setAgreeService={setAgreeService}
          setAgreeMarketing={setAgreeMarketing}
          toggleAgreeAll={toggleAgreeAll}
          onPay={onPay}
          bookingLoading={bookingLoading}
        />
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tourImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  input: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.greyOpacity100,
    paddingHorizontal: 12,
    marginTop: 8,
    color: colors.grey800,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.grey300,
    alignItems: "center",
    marginRight: 8,
    justifyContent: "center",
  },
  agreeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, marginLeft: 12 },
});

export default ProductPay;