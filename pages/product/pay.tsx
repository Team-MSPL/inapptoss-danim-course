import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import { Image } from "@granite-js/react-native";
import { FixedBottomCTAProvider, Button, Text, colors, Icon, FixedBottomCTA } from "@toss-design-system/react-native";
import { useProductStore } from "../../zustand/useProductStore";
import { MiniProductCard } from "../../components/product/miniProductCard";
import { formatPrice } from "../../components/product/pay-function";
import { useBookingFields } from "../../kkday/kkdayBookingField";
import GuideLangSelector from "../../components/product/payfield/GuideLangSelector";
import EngLastNameInput from "../../components/product/payfield/EngLastNameInput";
import EngFirstNameInput from "../../components/product/payfield/EngFirstNameInput";
import useBookingStore from "../../zustand/useBookingStore";
import GenderSelector from "../../components/product/payfield/GenderSelector";
import NationalitySelector from "../../components/product/payfield/NationalitySelector";
import MtpNoInput from "../../components/product/payfield/MtpNoInput";
import IdNoInput from "../../components/product/payfield/IdNoInput";
import PassportNoInput from "../../components/product/payfield/PassportNoInput";
import BirthDateInput from "../../components/product/payfield/BirthDateInput";
import HeightInput from "../../components/product/payfield/HeightInput";
import HeightUnitSelector from "../../components/product/payfield/HeightUnitSelector";
import WeightInput from "../../components/product/payfield/WeightInput";
import WeightUnitSelector from "../../components/product/payfield/WeightUnitSelector";
import ShoeInput from "../../components/product/payfield/ShoeInput";
import ShoeUnitSelector from "../../components/product/payfield/ShoeUnitSelector";
import ShoeTypeSelector from "../../components/product/payfield/ShoeTypeSelector";
import GlassDegreeSelector from "../../components/product/payfield/GlassDegreeSelector";
import MealSelector from "../../components/product/payfield/MealSelector";
import AllergyFoodSelector from "../../components/product/payfield/AllergyFoodSelector";
import NativeLastNameInput from "../../components/product/payfield/NativeLastNameInput";
import NativeFirstNameInput from "../../components/product/payfield/NativeFirstNameInput";
import TelCountryCodeSelector from "../../components/product/payfield/TelCountryCodeSelector";
import TelNumberInput from "../../components/product/payfield/TelNumberInput";
import CountryCitiesSelector from "../../components/product/payfield/CountryCitiesSelector";
import AddressInput from "../../components/product/payfield/AddressInput";
import HotelNameInput from "../../components/product/payfield/HotelNameInput";
import HotelTelNumberInput from "../../components/product/payfield/HotelNumberInput";
import BookingOrderNoInput from "../../components/product/payfield/BookingOrderNoInput";
import CheckInDateInput from "../../components/product/payfield/CheckInDateInput";
import CheckOutDateInput from "../../components/product/payfield/CheckOutDateInput";
import ContactAppSelector from "../../components/product/payfield/ContactAppSelector";
import ContactAppAccountInput from "../../components/product/payfield/ContactAppAccountInput";
import HaveAppToggle from "../../components/product/payfield/HaveAppToggle";
import ArrivalFlightTypeSelector from "../../components/product/traffic/ArrivalFlightTypeSelector"; // 기존
import ArrivalAirportSelector from "../../components/product/traffic/ArrivalAirportSelector"; // 기존
import ArrivalFlightNoInput from "../../components/product/traffic/ArrivalFlightNoInput";
import ArrivalTerminalInput from "../../components/product/traffic/ArrivalTerminalInput";
import ArrivalVisaToggle from "../../components/product/traffic/ArrivalVisaToggle";
import ArrivalDateInput from "../../components/product/traffic/ArrivalDateInput";
import ArrivalTimeInput from "../../components/product/traffic/ArrivalTimeInput";
import DepartureFlightTypeSelector from "../../components/product/traffic/DepartureFlightTypeSelector";
import DepartureAirportSelector from "../../components/product/traffic/DepartureAirportSelector";
import DepartureAirlineInput from "../../components/product/traffic/DepartureAirlineInput";
import DepartureFlightNoInput from "../../components/product/traffic/DepartureFlightNoInput";
import DepartureTerminalInput from "../../components/product/traffic/DepartureTerminalInput";
import DepartureHaveBeenInCountryInput from "../../components/product/traffic/DepartureHaveBeenInCountryInput";
import DepartureDateInput from "../../components/product/traffic/DepartureDateInput";
import DepartureTimeInput from "../../components/product/traffic/DepartureTimeInput";
import CarPsgAdultInput from "../../components/product/traffic/CarPsgAdultInput";
import CarPsgChildInput from "../../components/product/traffic/CarPsgChildInput";
import CarPsgInfantInput from "../../components/product/traffic/CarPsgInfantInput";
import SafetyseatSupChildInput from "../../components/product/traffic/SafetyseatSupChildInput";
import SafetyseatSelfChildInput from "../../components/product/traffic/SafetyseatSelfChildInput";
import SafetyseatSupInfantInput from "../../components/product/traffic/SafetyseatSupInfantInput";
import LuggageCarryInput from "../../components/product/traffic/LuggageCarryInput";
import LuggageCheckInput from "../../components/product/traffic/LuggageCheckInput";
import RentcarLocationSelector from "../../components/product/traffic/RentcarLocationSelector";
import RentcarDateInput from "../../components/product/traffic/RentcarDateInput";
import RentcarTimeInput from "../../components/product/traffic/RentcarTimeInput";
import PickupLocationInput from "../../components/product/traffic/PickupLocationInput";
import PickupDateInput from "../../components/product/traffic/PickupDateInput";
import PickupTimeInput from "../../components/product/traffic/PickupTimeInput";
import VoucherLocationInput from "../../components/product/traffic/VoucherLocationInput";
import PassportExpDateInput from "../../components/product/payfield/PassportExpDateInput";
import ZipcodeInput from "../../components/product/payfield/ZipcodeInput";
import ArrivalAirlineInput from "../../components/product/traffic/ArrivalAirlineInput";
import SafetyseatSelfInfantInput from "../../components/product/traffic/SafetyseatSelfInfantInput";
import RentcarCustomizeToggle from "../../components/product/traffic/RentcarCustomizeToggle";
import CollapsibleSection from "../../components/product/collapsibleSection";
import axiosAuth from "../../redux/api";

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

  const setGuideLangCode = useBookingStore((s) => s.setGuideLangCode);
  const buyerFirstName = useBookingStore((s) => s.buyer_first_name);
  const setBuyerFirstName = useBookingStore((s) => s.setBuyerFirstName);
  const buyerLastName = useBookingStore((s) => s.buyer_last_name);
  const setBuyerLastName = useBookingStore((s) => s.setBuyerLastName);
  const buyerEmail = useBookingStore((s) => s.buyer_Email);
  const setBuyerEmail = useBookingStore((s) => s.setBuyerEmail);
  const buyerTelCountryCode = useBookingStore((s) => s.buyer_tel_country_code);
  const setBuyerTelCountryCode = useBookingStore((s) => s.setBuyerTelCountryCode);
  const buyerTelNumber = useBookingStore((s) => s.buyer_tel_number);
  const setBuyerTelNumber = useBookingStore((s) => s.setBuyerTelNumber);
  const buyerCountry = useBookingStore((s) => s.buyer_country);
  const setBuyerCountry = useBookingStore((s) => s.setBuyerCountry);

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
    setOpenSections(prev => {
      // 항상 불변성 유지하고 함수형 업데이트 사용
      return { ...prev, [idx]: !prev[idx] };
    });
  }

  function markCompleteAndNext(sectionIndex: number) {
    setCompletedSections((prev) => ({ ...prev, [sectionIndex]: true }));
    setOpenSections((prev) => ({ ...prev, [sectionIndex + 1]: true }));
    const store = useBookingStore.getState();
    console.log("[BookingStore] guideLangCode:", store.guideLangCode);
    console.log("[BookingStore] customMap:", store.customMap);
    console.log("[BookingStore] customArray:", store.getCustomArray());
    console.log("[BookingStore] trafficArray:", store.getTrafficArray());
  }

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
    return Array.from(
      new Set(
        trafficSpec
          .map((t: any) => t?.traffic_type?.traffic_type_value)
          .filter(Boolean)
      )
    );
  }, [rawFields]);

  const hasFlight = availableTrafficTypes.includes("flight");
  const hasPsgQty = availableTrafficTypes.includes("psg_qty");
  const hasVoucher = availableTrafficTypes.includes("voucher");
  const hasRentcar01 = availableTrafficTypes.includes("rentcar_01");
  const hasRentcar02 = availableTrafficTypes.includes("rentcar_02");
  const hasRentcar03 = availableTrafficTypes.includes("rentcar_03");
  const hasPickup03 = availableTrafficTypes.includes("pickup_03");
  const hasPickup04 = availableTrafficTypes.includes("pickup_04");

  function buildReservationPayload() {
    // local helpers (ensure these exist in this file)
    const toNumber = (v: any): number | undefined => {
      if (v === null || v === undefined) return undefined;
      const n = Number(String(v).replace(/,/g, ''));
      return Number.isFinite(n) ? n : undefined;
    };
    const safeNum = (v: any): number | undefined => {
      if (v === null || v === undefined) return undefined;
      if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
      if (typeof v === 'string') {
        const n = Number(v.replace(/,/g, ''));
        return Number.isFinite(n) ? n : undefined;
      }
      return undefined;
    };

    const store = useBookingStore.getState();
    const customArray = store.getCustomArray ? store.getCustomArray() : [];
    const trafficArr = store.getTrafficArray ? store.getTrafficArray() : [];
    const buyerObj = store.getBuyerObject ? store.getBuyerObject() : {
      buyer_first_name: (store as any).buyer_first_name,
      buyer_last_name: (store as any).buyer_last_name,
      buyer_email: (store as any).buyer_Email ?? (store as any).buyer_email,
      buyer_tel_country_code: (store as any).buyer_tel_country_code,
      buyer_tel_number: (store as any).buyer_tel_number,
      buyer_country: (store as any).buyer_country,
    };

    if ((buyerObj as any).buyer_Email && !(buyerObj as any).buyer_email) {
      (buyerObj as any).buyer_email = (buyerObj as any).buyer_Email;
      delete (buyerObj as any).buyer_Email;
    }

    const itemNo =
      Array.isArray(params?.item_no) && params.item_no.length > 0
        ? params.item_no[0]
        : pkgData?.item?.[0]?.item_no ?? undefined;

    const selectedDate = params?.selected_date ?? null;

    const adultCount = Number(store?.adult ?? params?.adult ?? 1) || 0;
    const childCount = Number(store?.child ?? params?.child ?? 0) || 0;
    const totalQty = adultCount + childCount;

    const unitAdult = toNumber(params?.adult_price) ?? toNumber(params?.display_price) ?? toNumber(pkgData?.item?.[0]?.b2c_min_price) ?? toNumber(pkgData?.b2c_min_price) ?? 0;
    const unitChild = toNumber(params?.child_price) ?? unitAdult;

    const buildSkuMapFromItem = (item: any) => {
      const map: Record<string, any[]> = { adult: [], child: [], other: [] };
      if (!item || !Array.isArray(item.skus)) return map;
      item.skus.forEach((sku: any) => {
        const keys: string[] = [];
        if (sku?.ticket_rule_spec_item) keys.push(String(sku.ticket_rule_spec_item).toLowerCase());
        if (sku?.spec && typeof sku.spec === 'object') {
          Object.values(sku.spec).forEach((v: any) => { if (typeof v === 'string') keys.push(v.toLowerCase()); });
        }
        if (Array.isArray(sku?.specs_ref)) {
          sku.specs_ref.forEach((r: any) => {
            if (r?.spec_value_id) keys.push(String(r.spec_value_id).toLowerCase());
            if (r?.spec_item_id) keys.push(String(r.spec_item_id).toLowerCase());
          });
        }
        let mapped = 'other';
        for (const c of keys) {
          if (!c) continue;
          if (c.includes('child') || c.includes('kid') || c.includes('youth') || c.includes('infant')) { mapped = 'child'; break; }
          if (c.includes('adult') || c.includes('man') || c.includes('woman')) { mapped = 'adult'; break; }
        }
        if (mapped === 'other' && item.skus.length === 1) mapped = 'adult';
        map[mapped] = map[mapped] || [];
        map[mapped].push(sku);
      });
      return map;
    };

    const normalizeParamsSkus = (raw: any[] | undefined) => {
      if (!Array.isArray(raw) || raw.length === 0) return [];
      const out: Array<{ sku_id: any; qty: number; price: number }> = [];
      for (const r of raw) {
        if (!r) continue;
        const skuId = r.sku_id ?? r.skuId ?? r.id ?? null;
        if (!skuId) continue;
        const qty = Number(r.qty ?? r.quantity ?? r.count ?? 0) || 0;
        // determine unit price for this sku: check explicit mapping hints first (params.adult_sku_id/child_sku_id)
        let unit: number | undefined = undefined;
        const adultSkuHint = params?.adult_sku_id ?? params?.adult_skuId ?? undefined;
        const childSkuHint = params?.child_sku_id ?? params?.child_skuId ?? undefined;

        if (adultSkuHint && String(skuId) === String(adultSkuHint)) unit = unitAdult;
        else if (childSkuHint && String(skuId) === String(childSkuHint)) unit = unitChild;
        // allow type hint in object
        const typeHint = (r.type ?? r.ticket_type ?? '').toString().toLowerCase();
        if (!unit && typeHint.includes('child')) unit = unitChild;
        if (!unit && typeHint.includes('adult')) unit = unitAdult;

        // if explicit price provided, treat it as total price or unit depending on presence of unit_price flag
        const explicitPrice = toNumber(r.price ?? r.total_price);
        const explicitUnit = toNumber(r.unit_price ?? r.unitPrice);
        let totalPrice: number;
        if (explicitPrice !== undefined) {
          // assume provided price is total price for this sku entry
          totalPrice = explicitPrice;
        } else {
          // prefer explicit unit if present, else the computed unit, else fallbacks
          const useUnit = explicitUnit ?? unit ?? unitAdult;
          totalPrice = Number(useUnit * (qty || totalQty || 1));
        }

        out.push({ sku_id: skuId, qty: qty || totalQty, price: totalPrice });
      }
      return out;
    };

    let skusPayload: Array<{ sku_id: any; qty: number; price: number }> | undefined = undefined;
    if (Array.isArray(params?.sku) && params.sku.length > 0) {
      // 최소 정규화: ensure objects have sku_id, qty, price fields (coerce types)
      skusPayload = (params.sku as any[]).map(s => ({
        sku_id: s.sku_id ?? s.skuId ?? s.id ?? null,
        qty: Number(s.qty ?? s.quantity ?? s.count ?? 0),
        price: Number(s.price ?? s.total_price ?? 0),
      })).filter(s => s.sku_id && s.qty > 0);
    }

    if ((!Array.isArray(skusPayload) || skusPayload.length === 0) && Array.isArray(params?.skus) && params.skus.length > 0) {
      skusPayload = normalizeParamsSkus(params.skus);
    }

    if ((!Array.isArray(skusPayload) || skusPayload.length === 0) && typeof store?.getSelectedSkus === 'function') {
      const sel = store.getSelectedSkus();
      if (Array.isArray(sel) && sel.length > 0) {
        skusPayload = normalizeParamsSkus(sel);
      }
    }

    if ((!Array.isArray(skusPayload) || skusPayload.length === 0) && pkgData) {
      const item = pkgData?.item?.[0] ?? null;
      const skuMap = item ? buildSkuMapFromItem(item) : { adult: [], child: [], other: [] };
      const final: Array<{ sku_id: any; qty: number; price: number }> = [];

      if (adultCount > 0) {
        const adultSku = skuMap.adult?.[0] ?? item?.skus?.[0] ?? null;
        const skuId = adultSku?.sku_id ?? adultSku?.id ?? null;
        const unitFromSku = safeNum(adultSku?.b2c_price ?? adultSku?.b2b_price ?? adultSku?.official_price) ?? unitAdult;
        if (skuId) final.push({ sku_id: skuId, qty: adultCount, price: Number(unitFromSku * adultCount) });
      }

      if (childCount > 0) {
        const childSku = skuMap.child?.[0] ?? null;
        if (childSku) {
          const skuId = childSku?.sku_id ?? childSku?.id ?? null;
          const unitFromSku = safeNum(childSku?.b2c_price ?? childSku?.b2b_price ?? childSku?.official_price) ?? unitChild;
          if (skuId) final.push({ sku_id: skuId, qty: childCount, price: Number(unitFromSku * childCount) });
        } else {
          // merge into adult sku if no child-specific sku found
          if (final.length > 0) {
            final[0].qty = final[0].qty + childCount;
            final[0].price = Number(final[0].price + (unitChild * childCount));
          }
        }
      }

      // if still empty try calendar metadata
      if (final.length === 0) {
        const dateSkus = pkgData?.calendar_detail_merged?.[selectedDate]?.skus ?? pkgData?.item?.[0]?.skus ?? pkgData?.pkg?.[0]?.skus ?? [];
        if (Array.isArray(dateSkus) && dateSkus.length > 0) {
          const only = dateSkus[0];
          const skuId = only?.sku_id ?? only?.id ?? null;
          const unitFromSku = safeNum(only?.b2c_price ?? only?.b2b_price ?? only?.filled_price) ?? unitAdult;
          if (skuId) final.push({ sku_id: skuId, qty: totalQty, price: Number(unitFromSku * totalQty) });
        }
      }

      skusPayload = final.filter(s => s.sku_id && s.qty > 0);
    }

    if ((!Array.isArray(skusPayload) || skusPayload.length === 0) && totalQty > 0) {
      const fallbackSkuId = pkgData?.item?.[0]?.skus?.[0]?.sku_id ?? pkgData?.pkg?.[0]?.skus?.[0]?.sku_id ?? null;
      if (fallbackSkuId) {
        skusPayload = [{
          sku_id: fallbackSkuId,
          qty: totalQty,
          price: Number(unitAdult * adultCount + unitChild * childCount)
        }];
      } else {
        skusPayload = [];
      }
    }

    skusPayload = (skusPayload || []).map(s => ({
      sku_id: s.sku_id,
      qty: Number(s.qty || 0),
      price: Number(s.price || 0),
    })).filter(s => s.sku_id && s.qty > 0);

    // Build final payload
    const payload: Record<string, any> = {
      guid: params?.pkgData?.guid ?? pkgData?.guid ?? undefined,
      pay_type: "01",
      partner_order_no: "1",
      prod_no: params?.prod_no ?? pdt?.prod_no ?? undefined,
      pkg_no: params?.pkg_no ?? undefined,
      item_no: itemNo,
      locale: "ko",
      state: "KR",
      ...buyerObj,
      s_date: selectedDate ?? undefined,
      e_date: selectedDate ?? undefined,
      event_time: params?.selected_time ?? null,
      ...(store?.guideLangCode ? { guide_lang: store.guideLangCode } : {}),
      ...(customArray && customArray.length ? { custom: customArray } : {}),
      ...(trafficArr && trafficArr.length ? { traffic: trafficArr } : {}),
      ...(orderNote ? { order_note: orderNote } : {}),
    };

    if (skusPayload.length > 0) {
      payload.skus = skusPayload;
    }

    if (params?.total !== undefined && params?.total !== null) {
      const totalNum = Number(params.total);
      if (!Number.isNaN(totalNum)) {
        payload.total_price = totalNum;
      } else {
        // params.total이 숫자로 변환 불가하면 기존 store.total로 fallback
        if (typeof store?.total === 'number') payload.total_price = store.total;
      }
    } else if (typeof store?.total === 'number') {
      payload.total_price = store.total;
    }

    // Debug log
    console.log('[buildReservationPayload] skusPayload:', payload.skus);
    console.log('[buildReservationPayload] unitAdult, unitChild, counts:', unitAdult, unitChild, adultCount, childCount);
    console.log('[buildReservationPayload] total_price:', payload.total_price);

    return payload;
  }

  async function onPay() {
    const store = useBookingStore.getState();
    const customArray = store.getCustomArray();
    const payload = buildReservationPayload();
    console.log(payload)
    if (uses.includes("cus_01") && !customArray.some((c) => c.cus_type === "cus_01")) {
      Alert.alert("입력 오류", "예약자 정보(필수)를 입력해주세요.");
      return;
    }
    const sendGroup = store.customMap?.["send"] ?? {};
    if (sendGroup?.check_in_date && sendGroup?.check_out_date) {
      const inT = new Date(sendGroup.check_in_date).getTime();
      const outT = new Date(sendGroup.check_out_date).getTime();
      if (!isNaN(inT) && !isNaN(outT) && inT > outT) {
        Alert.alert("입력 오류", "체크인 날짜는 체크아웃 날짜 이전이어야 합니다.");
        return;
      }
    }

    Alert.alert("테스트 페이로드", JSON.stringify(payload, null, 2));

    // try {
    //   console.log(payload);
    //   const resp = await axiosAuth.post(`${import.meta.env.API_ROUTE_RELEASE}/kkday/Booking/`, payload);
    //   console.log("Booking response:", resp.data);
    //   Alert.alert("예약 완료", "예약이 정상적으로 접수되었습니다.");
    // } catch (err) {
    //   console.warn("Booking failed", err);
    //   Alert.alert("예약 실패", err?.message ?? "Unknown error");
    // }
  }

  const requiredMap = useMemo(() => {
    // structure: { sectionIndex: Array<{ key: string, label: string, cusType?:string, trafficType?:string, specIndex?:number }> }
    const map: Record<number, Array<any>> = {};

    // helper to push
    const pushField = (section: number, item: any) => {
      if (!map[section]) map[section] = [];
      map[section].push(item);
    };

    // Section 1: buyer basic info - always required
    map[1] = [
      { key: "buyer_last_name", label: "구매자 성" },
      { key: "buyer_first_name", label: "구매자 이름" },
      { key: "buyer_Email", label: "이메일" },
      { key: "buyer_tel_number", label: "전화번호" },
      { key: "buyer_country", label: "국가 코드" },
    ];

    // Section 2: guide_lang - if rawFields has guide_lang and it's required
    if (rawFields?.guide_lang) {
      const isReq = String(rawFields.guide_lang?.is_require ?? "true").toLowerCase() === "true";
      if (isReq) pushField(2, { key: "guide_lang", label: "가이드 언어" });
    }

    // custom sections (cus_01 => section 3, cus_02 => section 4, contact => 5, send => 6)
    if (rawFields?.custom && typeof rawFields.custom === "object") {
      Object.entries(rawFields.custom).forEach(([fieldId, specObj]: any) => {
        const useArr = specObj?.use ?? [];
        const isReq = String(specObj?.is_require ?? "").toLowerCase() === "true";
        if (!isReq || !Array.isArray(useArr)) return;
        // for each cusType in useArr, map to section
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
          // push with specIndex so we can try exact-match
          pushField(sectionIndex, { key: fieldId, label: (fieldSpec?.label ?? fieldId), trafficType: t, specIndex });
        });
      });
    }

    return map;
  }, [rawFields]);
  // 3) helper to read custom value (tolerant)
  function readCustomValue(cusType: string, fieldId: string) {
    const store = useBookingStore.getState();
    // direct map
    const group = store.customMap?.[cusType];
    if (group && Object.prototype.hasOwnProperty.call(group, fieldId)) return group[fieldId];

    // check getCustomArray entry
    const arr = store.getCustomArray();
    const entry = Array.isArray(arr) ? arr.find((e) => String(e?.cus_type) === String(cusType)) : undefined;
    if (entry && Object.prototype.hasOwnProperty.call(entry, fieldId)) return entry[fieldId];

    // tolerant variants
    const variants = [fieldId, fieldId.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase()), fieldId.replace(/_/g, "")];
    if (group) {
      for (const v of variants) if (Object.prototype.hasOwnProperty.call(group, v)) return group[v];
    }
    if (entry) {
      for (const v of variants) if (Object.prototype.hasOwnProperty.call(entry, v)) return entry[v];
    }
    return undefined;
  }

// 4) helper to read traffic stored value (prefer rawTraffic)
  function findStoredTrafficEntry(trafficType: string, specIndex?: number) {
    const store = useBookingStore.getState();
    const rawTraffic = (store as any).getRawTrafficArray ? (store as any).getRawTrafficArray() : store.getTrafficArray();
    if (!Array.isArray(rawTraffic)) return undefined;
    // 1) exact by spec_index
    if (typeof specIndex === "number") {
      const exact = rawTraffic.find((r: any) => String(r?.traffic_type) === String(trafficType) && Number(r?.spec_index) === Number(specIndex));
      if (exact) return exact;
    }
    // 2) try to map by occurrence order (count how many specs of this type appear before specIndex)
    const storedByType: any[] = rawTraffic.filter((r: any) => String(r?.traffic_type) === String(trafficType));
    if (storedByType.length === 0) return undefined;

    if (typeof specIndex === "number") {
      // compute occurrence index of this spec in rawFields
      let occurrence = 0;
      for (let i = 0; i <= specIndex && i < (rawFields?.traffics?.length ?? 0); i++) {
        if (String(rawFields.traffics[i]?.traffic_type?.traffic_type_value) === String(trafficType)) {
          if (i === specIndex) break;
          occurrence++;
        }
      }
      if (storedByType.length > occurrence) return storedByType[occurrence];
    }

    // 3) fallback: first stored entry of that type
    return storedByType[0];
  }

// 5) isFilled util
  function isFilled(v: any) {
    if (v === undefined || v === null) return false;
    if (typeof v === "string") return v.trim() !== "";
    return true; // number/boolean considered filled
  }
  // 6) validateSection uses requiredMap
  function validateSectionBuilt(sectionIndex: number) {
    const missing: string[] = [];
    const list = requiredMap[sectionIndex] ?? [];
    list.forEach((req: any) => {
      if (req.cusType) {
        const val = readCustomValue(req.cusType, req.key);
        if (!isFilled(val)) missing.push(req.label || req.key);
      } else if (req.trafficType) {
        const entry = findStoredTrafficEntry(req.trafficType, req.specIndex);
        const val = entry ? entry[req.key] : undefined;
        if (!isFilled(val)) missing.push(req.label || `${req.trafficType}.${req.key}`);
      } else {
        // general keys (buyer, guide_lang)
        const st = useBookingStore.getState();
        const val = (req.key === "guide_lang") ? st.guideLangCode : (st as any)[req.key];
        if (!isFilled(val)) missing.push(req.label || req.key);
      }
    });
    return missing;
  }

  function getRequiredCustomFields(cusType: string) {
    if (!rawFields?.custom) return [];
    const fields: string[] = [];
    Object.entries(rawFields.custom).forEach(([fieldId, specObj]: any) => {
      const useArr = specObj?.use ?? [];
      if (!Array.isArray(useArr) || !useArr.includes(cusType)) return;
      const isReq = String(specObj?.is_require ?? "").toLowerCase() === "true";
      if (isReq) fields.push(fieldId);
    });
    return fields;
  }

  function getRequiredTrafficEntries(typesArr: string[]) {
    const required: Array<{ traffic_type: string; spec_index?: number; fieldId: string }> = [];
    if (!Array.isArray(rawFields?.traffics)) return required;

    rawFields.traffics.forEach((spec: any, specIndex: number) => {
      const t = spec?.traffic_type?.traffic_type_value;
      if (!t || !typesArr.includes(t)) return;
      Object.entries(spec).forEach(([fieldId, fieldSpec]: any) => {
        if (fieldId === "traffic_type") return;
        if (!fieldSpec || typeof fieldSpec !== "object") return;
        const isReq = String(fieldSpec?.is_require ?? "").toLowerCase() === "true";
        if (isReq) required.push({ traffic_type: t, spec_index: specIndex, fieldId });
      });
    });

    return required;
  }

  // validateCustomSection (로그 제거된 버전)
  function validateCustomSection(cusType: string) {
    const missing: string[] = [];
    const reqFields = getRequiredCustomFields(cusType);
    if (reqFields.length === 0) return missing;

    const arr = useBookingStore.getState().getCustomArray() ?? [];
    const entry = arr.find(e => String(e?.cus_type) === String(cusType));
    if (!entry) {
      reqFields.forEach(f => missing.push(`${cusType} - ${f}`));
      return missing;
    }
    reqFields.forEach((f) => {
      if (!isFilled(entry[f])) missing.push(`${cusType} - ${f}`);
    });
    return missing;
  }

// validateTrafficSection (렌더시 로그 제거, 매칭은 기존 로직 유지)
  function validateTrafficSection(typesArr: string[]) {
    const missing: string[] = [];
    const requiredEntries = getRequiredTrafficEntries(typesArr);
    if (requiredEntries.length === 0) return missing;

    const store = useBookingStore.getState();
    const rawTraffic = (store as any).getRawTrafficArray ? (store as any).getRawTrafficArray() : store.getTrafficArray();
    if (!Array.isArray(rawTraffic)) return missing;

    // group stored entries by traffic_type in insertion order
    const storedByType: Record<string, any[]> = {};
    rawTraffic.forEach((r: any) => {
      const t = String(r?.traffic_type ?? "");
      if (!storedByType[t]) storedByType[t] = [];
      storedByType[t].push(r);
    });

    requiredEntries.forEach((req) => {
      const t = String(req.traffic_type);

      // 1) exact match by traffic_type + spec_index if possible
      let match = rawTraffic.find((r: any) => String(r?.traffic_type) === t && (typeof req.spec_index === "number" ? Number(r?.spec_index) === Number(req.spec_index) : true));

      // 2) if no exact match, try occurrence mapping:
      if (!match) {
        // compute occurrence index of this spec among rawFields.traffics of same type up to spec_index
        let occurrenceIndex = 0;
        if (Array.isArray(rawFields?.traffics)) {
          let count = 0;
          for (let i = 0; i <= (req.spec_index ?? rawFields.traffics.length - 1); i++) {
            const s = rawFields.traffics[i];
            if (!s) continue;
            if (String(s?.traffic_type?.traffic_type_value) === t) {
              if (i === req.spec_index) {
                occurrenceIndex = count;
                break;
              }
              count++;
            }
          }
        }

        const storedList = storedByType[t] ?? [];
        if (storedList.length > occurrenceIndex) {
          match = storedList[occurrenceIndex];
        }
      }

      // 3) final fallback: first stored entry of same type
      if (!match) {
        const anyMatch = (rawTraffic || []).find((r: any) => String(r?.traffic_type) === t);
        if (anyMatch) match = anyMatch;
      }

      const foundVal = match ? match[req.fieldId] : undefined;
      if (!isFilled(foundVal)) {
        missing.push(`${t} - ${req.fieldId}`);
      }
    });

    return missing;
  }
  /**
   * validateSection (indexes adapted to your layout)
   * returns array of missing item descriptions (empty => valid)
   */
  function validateSection(sectionIndex: number) {
    const miss: string[] = [];

    switch (sectionIndex) {
      case 1: { // 구매자 정보
        const st = useBookingStore.getState();
        if (!isFilled(st.buyer_last_name)) miss.push("구매자 성 (Last name)");
        if (!isFilled(st.buyer_first_name)) miss.push("구매자 이름 (First name)");
        // support both buyer_Email or buyer_email
        if (!isFilled(st.buyer_Email) && !isFilled((st as any).buyer_email)) miss.push("이메일");
        if (!isFilled(st.buyer_tel_number)) miss.push("전화번호");
        if (!isFilled(st.buyer_country)) miss.push("국가 코드");
        break;
      }

      case 2: { // 가이드 언어
        if (rawFields?.guide_lang) {
          // rawFields.guide_lang may be an object with is_require flag; default to require = true if you want mandatory
          const isReq = String(rawFields.guide_lang?.is_require ?? "true").toLowerCase() === "true";
          if (isReq && !isFilled(useBookingStore.getState().guideLangCode)) {
            miss.push("가이드 언어 선택");
          }
        }
        break;
      }

      case 3: { // 예약자 정보 cus_01
        if (hasCus01) {
          miss.push(...validateCustomSection("cus_01"));
        }
        break;
      }

      case 4: { // 여행자 정보 cus_02
        if (hasCus02) miss.push(...validateCustomSection("cus_02"));
        break;
      }

      case 5: { // 연락 수단 contact
        if (hasContact) miss.push(...validateCustomSection("contact"));
        break;
      }

      case 6: { // 투숙 정보 send
        if (hasSend) miss.push(...validateCustomSection("send"));
        break;
      }

      case 7: { // 항공 flight
        if (hasFlight) miss.push(...validateTrafficSection(["flight"]));
        break;
      }

      case 8: { // psg_qty
        if (hasPsgQty) miss.push(...validateTrafficSection(["psg_qty"]));
        break;
      }

      case 9: { // rentcar group
        const types: string[] = [];
        if (hasRentcar01) types.push("rentcar_01");
        if (hasRentcar02) types.push("rentcar_02");
        if (hasRentcar03) types.push("rentcar_03");
        if (types.length) miss.push(...validateTrafficSection(types));
        break;
      }

      case 10: { // pickup group
        const types: string[] = [];
        if (hasPickup03) types.push("pickup_03");
        if (hasPickup04) types.push("pickup_04");
        if (types.length) miss.push(...validateTrafficSection(types));
        break;
      }

      case 11: { // voucher
        if (hasVoucher) miss.push(...validateTrafficSection(["voucher"]));
        break;
      }

      case 12: { // 요청 사항 (order note) - no required fields typically
        // optional; skip
        break;
      }

      case 13: { // 결제 세부 내역 - nothing required here
        break;
      }

      default:
        break;
    }

    return miss;
  }

  // ProductPay 내부에 붙여넣을 새 함수 (기존 validateSectionBuilt / validateSection are reused)
  function onCompletePress(sectionIndex: number) {
    try {
      // validateSectionBuilt 또는 validateSection (프로젝트에서 사용하는 구현 하나를 호출)
      // 저는 당신 코드에서 requiredMap 기반 validateSectionBuilt이 이미 존재하므로 그걸 사용합니다.
      const missing = typeof validateSectionBuilt === "function" ? validateSectionBuilt(sectionIndex) : validateSection(sectionIndex);

      if (missing.length > 0) {
        // 사용자에게 보기좋게 보여주기 (줄바꿈)
        const msg = missing.slice(0, 20).join("\n");
        // Debug snapshots (optional) — 필요한 경우 콘솔 확인

        Alert.alert("입력 오류", `다음 항목이 비어있습니다:\n${msg}`);
        return false;
      }

      // 모두 채워져 있으면 기존 동작(완료 표시 + 다음 섹션 열기)
      markCompleteAndNext(sectionIndex);
      return true;
    } catch (err) {
      console.warn("[onCompletePress] validation error", err);
      Alert.alert("오류", "입력 검증 중 오류가 발생했습니다. 콘솔을 확인하세요.");
      return false;
    }
  }

  // ProductPay 내부: countryOptions + CountrySelector 컴포넌트
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

  function CountrySelector({
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
          style={styles.countrySelect} // 일관된 스타일
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

        <CollapsibleSection
          title="투어 정보"
          open={!!openSections[0]}
          onToggle={() => toggleSection(0)}
          completed={!!completedSections[0]}
        >
          <Text typography="t4" fontWeight="bold" style={{ marginBottom: 12 }}>{title}</Text>
          <Image source={{ uri: thumbnail }} style={styles.tourImage} resizeMode="cover" />
        </CollapsibleSection>

        <CollapsibleSection
          title="구매자 정보"
          open={!!openSections[1]} // 원하는 인덱스로 조정
          onToggle={() => toggleSection(1)}
          completed={!!completedSections[1]}
        >
          <View>
            <Text typography="t6" color={colors.grey800} style={{ marginBottom: 6 }}>구매자 성</Text>
            <TextInput
              placeholder="Last name"
              placeholderTextColor={colors.grey400}
              value={buyerLastName}
              onChangeText={setBuyerLastName}
              style={styles.input}
            />

            <Text typography="t6" color={colors.grey800} style={{ marginTop: 8, marginBottom: 6 }}>구매자 이름</Text>
            <TextInput
              placeholder="First name"
              placeholderTextColor={colors.grey400}
              value={buyerFirstName}
              onChangeText={setBuyerFirstName}
              style={styles.input}
            />

            <Text typography="t6" color={colors.grey800} style={{ marginTop: 8, marginBottom: 6 }}>이메일</Text>
            <TextInput
              placeholder="email@example.com"
              placeholderTextColor={colors.grey400}
              value={buyerEmail}
              onChangeText={setBuyerEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* 전화번호: 국가(드롭다운) + 번호 입력 */}
            <Text typography="t6" color={colors.grey800} style={{ marginTop: 8, marginBottom: 6 }}>전화번호</Text>

            <View>
              <CountrySelector
                valueCode={buyerCountry}
                label="국가 선택"
                onSelect={({ code, dial }) => {
                  setBuyerCountry(code);
                  setBuyerTelCountryCode(String(dial));
                }}
              />

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* 전화 국가코드 박스: 시각/수직 중앙 정렬 유지 */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    // 선택 재노출: 간단하게 CountrySelector 재사용을 유도할 수 있음.
                    // (선택 UI 로직이 필요하면 여기에 핸들러 추가)
                  }}
                  style={styles.countryDialBox}
                >
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

              <Text typography="t6" color={colors.grey800} style={{ marginTop: 8, marginBottom: 6 }}>국가 코드</Text>
              <TouchableOpacity activeOpacity={0.85} style={styles.countrySelect}>
                <Text style={{ color: buyerCountry ? colors.grey800 : colors.grey400 }}>{buyerCountry ?? "KR"}</Text>
              </TouchableOpacity>
            </View>

            <Button
              type="primary"
              style="fill"
              display="block"
              size="large"
              containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
              onPress={() => onCompletePress(1)}
            >
              작성 완료
            </Button>
          </View>
        </CollapsibleSection>

        {rawFields?.guide_lang && (
          <CollapsibleSection
            title={"가이드 언어"}
            open={!!openSections[2]}
            onToggle={() => toggleSection(2)}
            completed={!!completedSections[2]}
          >
            {/* Store에 값 저장하도록 변경 */}
            <GuideLangSelector
              rawFields={rawFields}
              onSelect={(code) => {
                // save selected guide language into booking store
                setGuideLangCode(code);
              }}
            />
            <Button
              type="primary"
              style="fill"
              display="block"
              size="large"
              containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
              onPress={() => onCompletePress(2)}
            >
              작성 완료
            </Button>
          </CollapsibleSection>
        )}

        {hasCus01 && (
          <CollapsibleSection title="예약자 정보" open={!!openSections[3]} onToggle={() => toggleSection(3)} completed={!!completedSections[3]}>
            <View>
              {engLastUse.includes("cus_01") && <EngLastNameInput cusType="cus_01" required={String(engLastSpec?.is_require ?? "").toLowerCase() === "true"} />}
              {engFirstUse.includes("cus_01") && <EngFirstNameInput cusType="cus_01" required={String(engFirstSpec?.is_require ?? "").toLowerCase() === "true"} />}
              {genderUse.includes("cus_01") && <GenderSelector cusType="cus_01" required={String(genderSpec?.is_require ?? "").toLowerCase() === "true"} />}
              {nationalityUse.includes("cus_01") && <NationalitySelector cusType="cus_01" options={nationalityOptions} required={String(nationalitySpec?.is_require ?? "").toLowerCase() === "true"} />}
              {rawFields?.custom?.mtp_no && Array.isArray(rawFields.custom.mtp_no.use) && rawFields.custom.mtp_no.use.includes("cus_01") && (
                <MtpNoInput cusType="cus_01" required={String(rawFields.custom.mtp_no.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.id_no && Array.isArray(rawFields.custom.id_no.use) && rawFields.custom.id_no.use.includes("cus_01") && (
                <IdNoInput cusType="cus_01" required={String(rawFields.custom.id_no.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.passport_no && Array.isArray(rawFields.custom.passport_no.use) && rawFields.custom.passport_no.use.includes("cus_01") && (
                <PassportNoInput cusType="cus_01" required={String(rawFields.custom.passport_no.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.passport_expdate && Array.isArray(rawFields.custom.passport_expdate.use) && rawFields.custom.passport_expdate.use.includes("cus_01") && (
                <PassportExpDateInput
                  cusType="cus_01"
                  required={String(rawFields.custom.passport_expdate.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.birth && Array.isArray(rawFields.custom.birth.use) && rawFields.custom.birth.use.includes("cus_01") && (
                <BirthDateInput cusType="cus_01" required={String(rawFields.custom.birth.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.height && Array.isArray(rawFields.custom.height.use) && rawFields.custom.height.use.includes("cus_01") && (
                <HeightInput cusType="cus_01" required={String(rawFields.custom.height.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.height_unit && Array.isArray(rawFields.custom.height_unit.use) && rawFields.custom.height_unit.use.includes("cus_01") && (
                <HeightUnitSelector cusType="cus_01" options={rawFields.custom.height_unit.list_option} required={String(rawFields.custom.height_unit.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.weight && Array.isArray(rawFields.custom.weight.use) && rawFields.custom.weight.use.includes("cus_01") && (
                <WeightInput cusType="cus_01" required={String(rawFields.custom.weight.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.weight_unit && Array.isArray(rawFields.custom.weight_unit.use) && rawFields.custom.weight_unit.use.includes("cus_01") && (
                <WeightUnitSelector cusType="cus_01" options={rawFields.custom.weight_unit.list_option} required={String(rawFields.custom.weight_unit.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.shoe && Array.isArray(rawFields.custom.shoe.use) && rawFields.custom.shoe.use.includes("cus_01") && (
                <ShoeInput cusType="cus_01" required={String(rawFields.custom.shoe.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.shoe_unit && Array.isArray(rawFields.custom.shoe_unit.use) && rawFields.custom.shoe_unit.use.includes("cus_01") && (
                <ShoeUnitSelector cusType="cus_01" options={rawFields.custom.shoe_unit.list_option} required={String(rawFields.custom.shoe_unit.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.shoe_type && Array.isArray(rawFields.custom.shoe_type.use) && rawFields.custom.shoe_type.use.includes("cus_01") && (
                <ShoeTypeSelector cusType="cus_01" options={rawFields.custom.shoe_type.list_option} required={String(rawFields.custom.shoe_type.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.glass_degree && Array.isArray(rawFields.custom.glass_degree.use) && rawFields.custom.glass_degree.use.includes("cus_01") && (
                <GlassDegreeSelector cusType="cus_01" options={rawFields.custom.glass_degree.list_option} required={String(rawFields.custom.glass_degree.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.meal && Array.isArray(rawFields.custom.meal.use) && rawFields.custom.meal.use.includes("cus_01") && (
                <MealSelector cusType="cus_01" options={rawFields.custom.meal.list_option} required={String(rawFields.custom.meal.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.allergy_food && Array.isArray(rawFields.custom.allergy_food.use) && rawFields.custom.allergy_food.use.includes("cus_01") && (
                <AllergyFoodSelector cusType="cus_01" options={rawFields.custom.allergy_food.list_option} required={String(rawFields.custom.allergy_food.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.native_last_name && Array.isArray(rawFields.custom.native_last_name.use) && rawFields.custom.native_last_name.use.includes("cus_01") && (
                <NativeLastNameInput
                  cusType="cus_01"
                  required={String(rawFields.custom.native_last_name.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.native_first_name && Array.isArray(rawFields.custom.native_first_name.use) && rawFields.custom.native_first_name.use.includes("cus_01") && (
                <NativeFirstNameInput
                  cusType="cus_01"
                  required={String(rawFields.custom.native_first_name.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              <Button
                type="primary"
                style="fill"
                display="block"
                size="large"
                containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                onPress={() => onCompletePress(3)}
              >
                작성 완료
              </Button>
            </View>
          </CollapsibleSection>
        )}

        {hasCus02 && (
          <CollapsibleSection title="여행자 정보" open={!!openSections[4]} onToggle={() => toggleSection(4)} completed={!!completedSections[4]}>
            <View>
              {engLastUse.includes("cus_02") && <EngLastNameInput cusType="cus_02" required={String(engLastSpec?.is_require ?? "").toLowerCase() === "true"} />}
              {engFirstUse.includes("cus_02") && <EngFirstNameInput cusType="cus_02" required={String(engFirstSpec?.is_require ?? "").toLowerCase() === "true"} />}
              {genderUse.includes("cus_02") && <GenderSelector cusType="cus_02" required={String(genderSpec?.is_require ?? "").toLowerCase() === "true"} />}
              {nationalityUse.includes("cus_02") && <NationalitySelector cusType="cus_02" options={nationalityOptions} required={String(nationalitySpec?.is_require ?? "").toLowerCase() === "true"} />}
              {rawFields?.custom?.mtp_no && Array.isArray(rawFields.custom.mtp_no.use) && rawFields.custom.mtp_no.use.includes("cus_02") && (
                <MtpNoInput cusType="cus_02" required={String(rawFields.custom.mtp_no.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.id_no && Array.isArray(rawFields.custom.id_no.use) && rawFields.custom.id_no.use.includes("cus_02") && (
                <IdNoInput cusType="cus_02" required={String(rawFields.custom.id_no.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.passport_no && Array.isArray(rawFields.custom.passport_no.use) && rawFields.custom.passport_no.use.includes("cus_02") && (
                <PassportNoInput cusType="cus_02" required={String(rawFields.custom.passport_no.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.passport_expdate && Array.isArray(rawFields.custom.passport_expdate.use) && rawFields.custom.passport_expdate.use.includes("cus_02") && (
                <PassportExpDateInput
                  cusType="cus_02"
                  required={String(rawFields.custom.passport_expdate.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.birth && Array.isArray(rawFields.custom.birth.use) && rawFields.custom.birth.use.includes("cus_02") && (
                <BirthDateInput cusType="cus_02" required={String(rawFields.custom.birth.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.height && Array.isArray(rawFields.custom.height.use) && rawFields.custom.height.use.includes("cus_02") && (
                <HeightInput cusType="cus_02" required={String(rawFields.custom.height.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.height_unit && Array.isArray(rawFields.custom.height_unit.use) && rawFields.custom.height_unit.use.includes("cus_02") && (
                <HeightUnitSelector cusType="cus_02" options={rawFields.custom.height_unit.list_option} required={String(rawFields.custom.height_unit.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.weight && Array.isArray(rawFields.custom.weight.use) && rawFields.custom.weight.use.includes("cus_02") && (
                <WeightInput cusType="cus_02" required={String(rawFields.custom.weight.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.weight_unit && Array.isArray(rawFields.custom.weight_unit.use) && rawFields.custom.weight_unit.use.includes("cus_02") && (
                <WeightUnitSelector cusType="cus_02" options={rawFields.custom.weight_unit.list_option} required={String(rawFields.custom.weight_unit.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.shoe && Array.isArray(rawFields.custom.shoe.use) && rawFields.custom.shoe.use.includes("cus_02") && (
                <ShoeInput cusType="cus_02" required={String(rawFields.custom.shoe.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.shoe_unit && Array.isArray(rawFields.custom.shoe_unit.use) && rawFields.custom.shoe_unit.use.includes("cus_02") && (
                <ShoeUnitSelector cusType="cus_02" options={rawFields.custom.shoe_unit.list_option} required={String(rawFields.custom.shoe_unit.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.shoe_type && Array.isArray(rawFields.custom.shoe_type.use) && rawFields.custom.shoe_type.use.includes("cus_02") && (
                <ShoeTypeSelector cusType="cus_02" options={rawFields.custom.shoe_type.list_option} required={String(rawFields.custom.shoe_type.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.glass_degree && Array.isArray(rawFields.custom.glass_degree.use) && rawFields.custom.glass_degree.use.includes("cus_02") && (
                <GlassDegreeSelector cusType="cus_02" options={rawFields.custom.glass_degree.list_option} required={String(rawFields.custom.glass_degree.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.meal && Array.isArray(rawFields.custom.meal.use) && rawFields.custom.meal.use.includes("cus_02") && (
                <MealSelector cusType="cus_02" options={rawFields.custom.meal.list_option} required={String(rawFields.custom.meal.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.allergy_food && Array.isArray(rawFields.custom.allergy_food.use) && rawFields.custom.allergy_food.use.includes("cus_02") && (
                <AllergyFoodSelector cusType="cus_02" options={rawFields.custom.allergy_food.list_option} required={String(rawFields.custom.allergy_food.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.native_last_name && Array.isArray(rawFields.custom.native_last_name.use) && rawFields.custom.native_last_name.use.includes("cus_02") && (
                <NativeLastNameInput
                  cusType="cus_02"
                  required={String(rawFields.custom.native_last_name.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.native_first_name && Array.isArray(rawFields.custom.native_first_name.use) && rawFields.custom.native_first_name.use.includes("cus_02") && (
                <NativeFirstNameInput
                  cusType="cus_02"
                  required={String(rawFields.custom.native_first_name.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              <Button
                type="primary"
                style="fill"
                display="block"
                size="large"
                containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                onPress={() => onCompletePress(4)}
              >
                작성 완료
              </Button>
            </View>
          </CollapsibleSection>
        )}

        {hasContact && (
          <CollapsibleSection title="연락 수단" open={!!openSections[5]} onToggle={() => toggleSection(5)} completed={!!completedSections[5]}>
            <View>
              {rawFields?.custom?.native_last_name && Array.isArray(rawFields.custom.native_last_name.use) && rawFields.custom.native_last_name.use.includes("contact") && (
                <NativeLastNameInput
                  cusType="contact"
                  required={String(rawFields.custom.native_last_name.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.native_first_name && Array.isArray(rawFields.custom.native_first_name.use) && rawFields.custom.native_first_name.use.includes("contact") && (
                <NativeFirstNameInput
                  cusType="contact"
                  required={String(rawFields.custom.native_first_name.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.tel_country_code && Array.isArray(rawFields.custom.tel_country_code.use) && rawFields.custom.tel_country_code.use.includes("contact") && (
                <TelCountryCodeSelector
                  cusType="contact"
                  options={rawFields.custom.tel_country_code.list_option}
                  required={String(rawFields.custom.tel_country_code.is_require ?? "").toLowerCase() === "true"}
                />
              )}

              {rawFields?.custom?.tel_number && Array.isArray(rawFields.custom.tel_number.use) && rawFields.custom.tel_number.use.includes("contact") && (
                <TelNumberInput
                  cusType="contact"
                  required={String(rawFields.custom.tel_number.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.contact_app && Array.isArray(rawFields.custom.contact_app.list_option) && rawFields.custom.contact_app.use?.includes("contact") && (
                <ContactAppSelector
                  cusType="contact"
                  options={rawFields.custom.contact_app.list_option}
                  required={String(rawFields.custom.contact_app.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.contact_app_account && Array.isArray(rawFields.custom.contact_app_account.use) && rawFields.custom.contact_app_account.use.includes("contact") && (
                <ContactAppAccountInput cusType="contact" required={String(rawFields.custom.contact_app_account.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.have_app && Array.isArray(rawFields.custom.have_app.use) && rawFields.custom.have_app.use.includes("contact") && (
                <HaveAppToggle cusType="contact" label="연락 앱 설치 여부" />
              )}
              <Button
                type="primary"
                style="fill"
                display="block"
                size="large"
                containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                onPress={() => onCompletePress(5)}
              >
                작성 완료
              </Button>
            </View>
          </CollapsibleSection>
        )}

        {hasSend && (
          <CollapsibleSection title="투숙 정보" open={!!openSections[6]} onToggle={() => toggleSection(6)} completed={!!completedSections[6]}>
            <View>
              {rawFields?.custom?.native_last_name && Array.isArray(rawFields.custom.native_last_name.use) && rawFields.custom.native_last_name.use.includes("send") && (
                <NativeLastNameInput
                  cusType="send"
                  required={String(rawFields.custom.native_last_name.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.native_first_name && Array.isArray(rawFields.custom.native_first_name.use) && rawFields.custom.native_first_name.use.includes("send") && (
                <NativeFirstNameInput
                  cusType="send"
                  required={String(rawFields.custom.native_first_name.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.tel_country_code && Array.isArray(rawFields.custom.tel_country_code.use) && rawFields.custom.tel_country_code.use.includes("send") && (
                <TelCountryCodeSelector cusType="send" options={rawFields.custom.tel_country_code.list_option} required={String(rawFields.custom.tel_country_code.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.tel_number && Array.isArray(rawFields.custom.tel_number.use) && rawFields.custom.tel_number.use.includes("send") && (
                <TelNumberInput cusType="send" required={String(rawFields.custom.tel_number.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.country_cities && Array.isArray(rawFields.custom.country_cities.list_option) && rawFields.custom.country_cities.use?.includes("send") && (
                <CountryCitiesSelector
                  cusType="send"
                  options={rawFields.custom.country_cities.list_option}
                  required={String(rawFields.custom.country_cities.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.zipcode && Array.isArray(rawFields.custom.zipcode.use) && rawFields.custom.zipcode.use.includes("send") && (
                <ZipcodeInput
                  cusType="send"
                  required={String(rawFields.custom.zipcode.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.address && Array.isArray(rawFields.custom.address.use) && rawFields.custom.address.use.includes("send") && (
                <AddressInput cusType="send" required={String(rawFields.custom.address.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.hotel_name && Array.isArray(rawFields.custom.hotel_name.use) && rawFields.custom.hotel_name.use.includes("send") && (
                <HotelNameInput cusType="send" required={String(rawFields.custom.hotel_name.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.hotel_tel_number && Array.isArray(rawFields.custom.hotel_tel_number.use) && rawFields.custom.hotel_tel_number.use.includes("send") && (
                <HotelTelNumberInput cusType="send" required={String(rawFields.custom.hotel_tel_number.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.booking_order_no && Array.isArray(rawFields.custom.booking_order_no.use) && rawFields.custom.booking_order_no.use.includes("send") && (
                <BookingOrderNoInput cusType="send" required={String(rawFields.custom.booking_order_no.is_require ?? "").toLowerCase() === "true"} />
              )}
              {rawFields?.custom?.check_in_date && Array.isArray(rawFields.custom.check_in_date.use) && rawFields.custom.check_in_date.use.includes("send") && (
                <CheckInDateInput
                  cusType="send"
                  required={String(rawFields.custom.check_in_date.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              {rawFields?.custom?.check_out_date && Array.isArray(rawFields.custom.check_out_date.use) && rawFields.custom.check_out_date.use.includes("send") && (
                <CheckOutDateInput
                  cusType="send"
                  required={String(rawFields.custom.check_out_date.is_require ?? "").toLowerCase() === "true"}
                />
              )}
              <Button
                type="primary"
                style="fill"
                display="block"
                size="large"
                containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                onPress={() => onCompletePress(6)}
              >
                작성 완료
              </Button>
            </View>
          </CollapsibleSection>
        )}

        {rawFields?.traffics && Array.isArray(rawFields.traffics) && rawFields.traffics.some((t:any) => t?.traffic_type?.traffic_type_value === "flight") && (
          <CollapsibleSection title="항공편 정보" open={!!openSections[7]} onToggle={() => toggleSection(7)} completed={!!completedSections[7]}>
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_flightType && (
              <ArrivalFlightTypeSelector trafficType="flight" rawFields={rawFields} trafficTypeValue="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_flightType?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_airport && (
              <ArrivalAirportSelector trafficType="flight" rawFields={rawFields} trafficTypeValue="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_airport?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_airlineName && (
              <ArrivalAirlineInput
                trafficType="flight"
                required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_airlineName?.is_require ?? "").toLowerCase() === "true"}
              />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_flightNo && (
              <ArrivalFlightNoInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_flightNo?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_terminalNo && (
              <ArrivalTerminalInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_terminalNo?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_visa && (
              <ArrivalVisaToggle trafficType="flight" />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_date && (
              <ArrivalDateInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_date?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_time && (
              <ArrivalTimeInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_time?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_flightType && (
              <DepartureFlightTypeSelector
                trafficType="flight"
                rawFields={rawFields}
                trafficTypeValue="flight"
                required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_flightType?.is_require ?? "").toLowerCase() === "true"}
              />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_airport && (
              <DepartureAirportSelector
                trafficType="flight"
                rawFields={rawFields}
                trafficTypeValue="flight"
                required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_airport?.is_require ?? "").toLowerCase() === "true"}
              />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_airlineName && (
              <DepartureAirlineInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_airlineName?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_flightNo && (
              <DepartureFlightNoInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_flightNo?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_terminalNo && (
              <DepartureTerminalInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_terminalNo?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_haveBeenInCountry && (
              <DepartureHaveBeenInCountryInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_haveBeenInCountry?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_date && (
              <DepartureDateInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_date?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_time && (
              <DepartureTimeInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_time?.is_require ?? "").toLowerCase() === "true"} />
            )}
            <Button
              type="primary"
              style="fill"
              display="block"
              size="large"
              containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
              onPress={() => onCompletePress(7)}
            >
              작성 완료
            </Button>
          </CollapsibleSection>
        )}

        {hasPsgQty && (
          <CollapsibleSection title="탑승자 수 (psg_qty)" open={!!openSections[8]} onToggle={() => toggleSection(8)} completed={!!completedSections[8]}>
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.carpsg_adult && (
              <CarPsgAdultInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.carpsg_adult?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.carpsg_child && (
              <CarPsgChildInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.carpsg_child?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.carpsg_infant && (
              <CarPsgInfantInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.carpsg_infant?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.safetyseat_sup_child && (
              <SafetyseatSupChildInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.safetyseat_sup_child?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.safetyseat_self_child && (
              <SafetyseatSelfChildInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.safetyseat_self_child?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.safetyseat_sup_infant && (
              <SafetyseatSupInfantInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.safetyseat_sup_infant?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.safetyseat_self_infant && (
              <SafetyseatSelfInfantInput
                trafficType="psg_qty"
                required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.safetyseat_self_infant?.is_require ?? "").toLowerCase() === "true"}
              />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.luggage_carry && (
              <LuggageCarryInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.luggage_carry?.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.luggage_check && (
              <LuggageCheckInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.luggage_check?.is_require ?? "").toLowerCase() === "true"} />
            )}
            <Button
              type="primary"
              style="fill"
              display="block"
              size="large"
              containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
              onPress={() => onCompletePress(8)}
            >
              작성 완료
            </Button>
          </CollapsibleSection>
        )}

        {(hasRentcar01 || hasRentcar02 || hasRentcar03) && (
          <CollapsibleSection
            title="렌터카 정보"
            open={!!openSections[9]}
            onToggle={() => toggleSection(9)}
            completed={!!completedSections[9]}
          >
            <View>
              {Array.isArray(rawFields?.traffics) &&
                rawFields.traffics
                  .map((spec: any, specIndex: number) => ({ spec, specIndex }))
                  .filter(({ spec }) => {
                    const t = spec?.traffic_type?.traffic_type_value;
                    return !!t && ["rentcar_01", "rentcar_02", "rentcar_03"].includes(t) && availableTrafficTypes.includes(t);
                  })
                  .map(({ spec, specIndex }, renderedIdx) => {
                    const tValue = spec?.traffic_type?.traffic_type_value;
                    return (
                      <View key={`${tValue}__${specIndex}`} style={{ marginBottom: 12 }}>
                        <Text typography="t5" color={colors.grey800} style={{ marginBottom: 8 }}>{`렌터카 정보 ${renderedIdx + 1}`}</Text>

                        {spec?.s_location && (
                          <RentcarLocationSelector
                            trafficType={tValue}
                            field="s_location"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.s_location?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}

                        {spec?.e_location && (
                          <RentcarLocationSelector
                            trafficType={tValue}
                            field="e_location"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.e_location?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}

                        {spec?.s_date && (
                          <RentcarDateInput
                            trafficType={tValue}
                            field="s_date"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.s_date?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}

                        {spec?.s_time && (
                          <RentcarTimeInput
                            trafficType={tValue}
                            field="s_time"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.s_time?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}

                        {spec?.e_date && (
                          <RentcarDateInput
                            trafficType={tValue}
                            field="e_date"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.e_date?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}

                        {spec?.e_time && (
                          <RentcarTimeInput
                            trafficType={tValue}
                            field="e_time"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.e_time?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}

                        {spec?.is_rent_customize && (
                          <RentcarCustomizeToggle
                            trafficType={tValue}
                            spec={spec}
                            specIndex={specIndex}
                            label={spec.is_rent_customize?.label ?? "직접 주소 입력"}
                            onValueChange={(v) => console.log("is_rent_customize for", tValue, specIndex, v)}
                          />
                        )}
                      </View>
                    );
                  })}
              <Button
                type="primary"
                style="fill"
                display="block"
                size="large"
                containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                onPress={() => onCompletePress(9)}
              >
                작성 완료
              </Button>
            </View>
          </CollapsibleSection>
        )}

        {(hasPickup03 || hasPickup04) && (
          <CollapsibleSection
            title="픽업 정보"
            open={!!openSections[10]}
            onToggle={() => toggleSection(10)}
            completed={!!completedSections[10]}
          >
            <View>
              {Array.isArray(rawFields?.traffics) &&
                rawFields.traffics
                  .map((spec: any, specIndex: number) => ({ spec, specIndex }))
                  .filter(({ spec }) => {
                    const t = spec?.traffic_type?.traffic_type_value;
                    return (
                      !!t &&
                      (t === "pickup_03" || t === "pickup_04") &&
                      availableTrafficTypes.includes(t)
                    );
                  })
                  .map(({ spec, specIndex }, renderedIdx) => {
                    const tValue = spec?.traffic_type?.traffic_type_value;
                    return (
                      <View key={`${tValue}__${specIndex}`} style={{ marginBottom: 12 }}>
                        <Text typography="t5" color={colors.grey800} style={{marginBottom: 8}}>{`픽업 정보 ${renderedIdx + 1}`}</Text>
                        {spec?.s_location && (
                          <PickupLocationInput
                            trafficType={tValue}
                            field="s_location"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.s_location?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}
                        {spec?.s_date && (
                          <PickupDateInput
                            trafficType={tValue}
                            field="s_date"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.s_date?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}
                        {spec?.s_time && (
                          <PickupTimeInput
                            trafficType={tValue}
                            field="s_time"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.s_time?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}
                        {spec?.e_location && (
                          <PickupLocationInput
                            trafficType={tValue}
                            field="e_location"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.e_location?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}
                        {spec?.e_date && (
                          <PickupDateInput
                            trafficType={tValue}
                            field="e_date"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.e_date?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}
                        {spec?.e_time && (
                          <PickupTimeInput
                            trafficType={tValue}
                            field="e_time"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.e_time?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}
                      </View>
                    );
                  })}
              <Button
                type="primary"
                style="fill"
                display="block"
                size="large"
                containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                onPress={() => onCompletePress(10)}
              >
                작성 완료
              </Button>
            </View>
          </CollapsibleSection>
        )}

        {hasVoucher && (
          <CollapsibleSection
            title="바우처/픽업 위치"
            open={!!openSections[11]}
            onToggle={() => toggleSection(11)}
            completed={!!completedSections[11]}
          >
            <View>
              {Array.isArray(rawFields?.traffics) &&
                rawFields.traffics
                  .map((spec: any, specIndex: number) => ({ spec, specIndex }))
                  .filter(({ spec }) => {
                    const t = spec?.traffic_type?.traffic_type_value;
                    return !!t && t === "voucher" && availableTrafficTypes.includes(t);
                  })
                  .map(({ spec, specIndex }, renderedIdx) => {
                    const tValue = spec?.traffic_type?.traffic_type_value;
                    return (
                      <View key={`${tValue}__${specIndex}`} style={{ marginBottom: 12 }}>
                        {spec?.s_location && (
                          <VoucherLocationInput
                            trafficType={tValue}
                            field="s_location"
                            rawFields={rawFields}
                            specIndex={specIndex}
                            required={String(spec.s_location?.is_require ?? "").toLowerCase() === "true"}
                          />
                        )}
                      </View>
                    );
                  })}
              <Button
                type="primary"
                style="fill"
                display="block"
                size="large"
                containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                onPress={() => onCompletePress(11)}
              >
                작성 완료
              </Button>
            </View>
          </CollapsibleSection>
        )}

        <CollapsibleSection title="요청 사항" open={!!openSections[12]} onToggle={() => toggleSection(12)} completed={!!completedSections[12]}>
          <TextInput placeholder="요청사항을 입력하세요" placeholderTextColor={colors.grey400} value={orderNote} onChangeText={setOrderNote} style={[styles.input]} multiline />
          <View style={{ height: 12 }} />
          <Button
            type="primary"
            style="fill"
            display="block"
            size="large"
            containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
            onPress={() => onCompletePress(12)}
          >
            작성 완료
          </Button>
        </CollapsibleSection>

        <CollapsibleSection title="결제 세부 내역" open={!!openSections[13]} onToggle={() => toggleSection(13)} completed={!!completedSections[13]}>
          <MiniProductCard
            image={thumbnail}
            title={title}
            originPrice={originalPerPerson}
            salePrice={salePerPerson}
            perPersonText={`${formatPrice(productAmount)}원`}
          />
          <View style={{ marginTop: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.grey100 }}>
            <View style={styles.row}>
              <Text typography='t5'>상품 금액</Text>
              <Text typography='t5'>{formatPrice(productAmount)}원</Text>
            </View>
            {/*<View style={styles.row}>*/}
            {/*  <Text typography='t5'>상품 할인</Text>*/}
            {/*  <Text typography='t5'>{formatPrice(productDiscount)}원</Text>*/}
            {/*</View>*/}
          </View>
        </CollapsibleSection>

        <View style={{ height: 12, backgroundColor: colors.grey100, marginTop: 8 }} />

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

        <FixedBottomCTA onPress={onPay} disabled={false}>
          {"결제하기"}
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

  trafficItem: {
    borderWidth: 1,
    borderColor: colors.grey100,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  // styles 객체 안에 추가하세요
  countrySelect: {
    height: 54, // input과 같은 높이로 맞춤
    borderRadius: 14,
    backgroundColor: colors.greyOpacity100,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  countryDialBox: {
    height: 54,
    width: 90,
    borderRadius: 14,
    backgroundColor: colors.greyOpacity100,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  countryDialText: {
    color: colors.grey800,
  },
// 재사용 가능한 optionRowActive 스타일이 이미 있; 없다면 아래 추가:
  optionRowActive: {
    backgroundColor: colors.blue500,
  },
});

export default ProductPay;