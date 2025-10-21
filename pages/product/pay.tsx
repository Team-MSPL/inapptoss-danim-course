import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import { FixedBottomCTAProvider, Button, Text, colors, Icon } from "@toss-design-system/react-native";

export const Route = createRoute("/product/pay", {
  validateParams: (params) => params,
  component: ProductPay,
});

type PaymentMethod = "toss" | "naver" | "kakao" | "card" | null;

function formatPrice(n?: number | null) {
  if (n === null || n === undefined) return "";
  return Math.floor(Number(n)).toLocaleString();
}

function CollapsibleSection({
                              title,
                              open,
                              onToggle,
                              completed,
                              children,
                            }: {
  title: string;
  open: boolean;
  onToggle: () => void;
  completed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text typography="t5" style={{ marginRight: 8 }}>
            {title}
          </Text>
          {completed && <Icon name="icon-check" size={16} color={colors.blue500} />}
        </View>
        <Icon name={open ? "icon-chevron-up" : "icon-chevron-down"} size={20} color={colors.grey400} />
      </TouchableOpacity>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

function ProductPay() {
  const navigation = useNavigation();
  const params = Route.useParams(); // get params passed from previous screen

  console.log(params);

  // params may include selected_date, display_price, original_price, discount_amount, b2b_min_price, b2c_min_price
  const displayPriceParam = params?.display_price ?? params?.total ?? params?.b2b_min_price ?? params?.display_price;
  const parsedDisplayPrice = typeof displayPriceParam === "string" ? Number(displayPriceParam) : displayPriceParam;

  // Section open state: 0=tour,1:booker,2:traveler,3:pickup,4:requests,5:pay-details
  const [openSection, setOpenSection] = useState<number>(1); // start with Booker (like image)
  const [completedSections, setCompletedSections] = useState<Record<number, boolean>>({});

  // Booker (예약자) fields
  const [lastNameEng, setLastNameEng] = useState<string>(""); // 성(영문) placeholder shows sample
  const [firstNameEng, setFirstNameEng] = useState<string>("");
  const [nationality, setNationality] = useState<string>("대한민국");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // Traveler info simplified (one traveler: same as booker toggle)
  const [travelerSameAsBooker, setTravelerSameAsBooker] = useState<boolean>(true);

  // Payment
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("toss");

  // Agreements
  const [agreeAll, setAgreeAll] = useState<boolean>(false);
  const [agreePersonal, setAgreePersonal] = useState<boolean>(false); // 필수
  const [agreeService, setAgreeService] = useState<boolean>(false); // 필수
  const [agreeMarketing, setAgreeMarketing] = useState<boolean>(false); // optional

  // loading state for submit
  const [submitting, setSubmitting] = useState<boolean>(false);

  // validation helpers
  const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
  const isValidPhone = (v: string) => v.replace(/\D/g, "").length >= 8;

  // Booker completed when required fields valid
  const bookerCompleted = useMemo(() => {
    return !!(lastNameEng && firstNameEng && nationality && isValidPhone(phone) && isValidEmail(email));
  }, [lastNameEng, firstNameEng, nationality, phone, email]);

  // Payment details section considered completed if a payment method selected and agreements accepted
  const paymentCompleted = useMemo(() => {
    return !!selectedPayment && agreePersonal && agreeService;
  }, [selectedPayment, agreePersonal, agreeService]);

  // total price derived from params or fallback
  const totalPrice = parsedDisplayPrice ?? 0;
  const totalPriceText = formatPrice(totalPrice);

  // When user completes a section, we mark it completed and auto open next section
  function markCompleteAndNext(sectionIndex: number) {
    setCompletedSections((prev) => ({ ...prev, [sectionIndex]: true }));
    setOpenSection((prev) => {
      const next = sectionIndex + 1;
      return next; // open next by default (if exists)
    });
  }

  // Toggle agreement all
  useEffect(() => {
    if (agreePersonal && agreeService && agreeMarketing) setAgreeAll(true);
    else if (agreeAll) setAgreeAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreePersonal, agreeService, agreeMarketing]);

  // If user toggles "전체 동의", set all
  function toggleAgreeAll() {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreePersonal(next);
    setAgreeService(next);
    setAgreeMarketing(next);
  }

  // Submit / 결제 진행
  async function onPay() {
    if (!paymentCompleted) return;
    setSubmitting(true);
    try {
      // Here you would call your payment API or open payment SDK with params:
      // build payload from store/params and current fields
      const payload = {
        prod_no: params?.prod_no,
        pkg_no: params?.pkg_no,
        selected_date: params?.selected_date,
        booker: {
          lastNameEng,
          firstNameEng,
          nationality,
          phone,
          email,
        },
        travelerSameAsBooker,
        paymentMethod: selectedPayment,
        total: totalPrice,
      };
      // For demo we just simulate a delay
      await new Promise((r) => setTimeout(r, 700));
      // Navigate to a confirmation screen or show success
      navigation.navigate("/product/confirmation", { payload });
    } catch (err) {
      // handle errors (show toast/snackbar)
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FixedBottomCTAProvider>
        <View style={styles.container}>
          <Text typography="t5" fontWeight='medium'>
            예약/결제하기
          </Text>
        </View>

        {/* Tour info (collapsed by default) */}
        <CollapsibleSection
          title="투어 정보"
          open={openSection === 0}
          onToggle={() => setOpenSection(openSection === 0 ? -1 : 0)}
          completed={!!completedSections[0]}
        >
          <Text style={{ color: colors.grey700 }}>{params?.prod_name ?? "상품명"}</Text>
          <Text style={{ marginTop: 6, color: colors.grey500 }}>
            선택일: {params?.selected_date ?? "-"}
          </Text>
        </CollapsibleSection>

        {/* Booker info (예약자) */}
        <CollapsibleSection
          title="예약자 정보"
          open={openSection === 1}
          onToggle={() => setOpenSection(openSection === 1 ? -1 : 1)}
          completed={!!completedSections[1]}
        >
          <View style={{ marginBottom: 10 }}>
            <Text typography="t6" color={colors.grey500}>
              성(영문) *
            </Text>
            <TextInput
              placeholder="예) HONG"
              value={lastNameEng}
              onChangeText={setLastNameEng}
              style={styles.input}
            />
          </View>

          <View style={{ marginBottom: 10 }}>
            <Text typography="t6" color={colors.grey500}>
              이름(영문) *
            </Text>
            <TextInput
              placeholder="예) GILDONG"
              value={firstNameEng}
              onChangeText={setFirstNameEng}
              style={styles.input}
            />
          </View>

          <View style={{ marginBottom: 10 }}>
            <Text typography="t6" color={colors.grey500}>
              국적 *
            </Text>
            <TouchableOpacity style={styles.select}>
              <Text>{nationality}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 10 }}>
            <Text typography="t6" color={colors.grey500}>
              전화번호 *
            </Text>
            <TextInput
              placeholder="예) 01012345678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={{ marginBottom: 6 }}>
            <Text typography="t6" color={colors.grey500}>
              이메일 *
            </Text>
            <TextInput
              placeholder="예) email@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <Text style={{ color: colors.red400, fontSize: 12, marginVertical: 8 }}>
            입력하신 이메일과 전화번호는 주문 내역 및 바우처 전달을 위해 사용됩니다.
          </Text>

          <Button
            type="primary"
            style="fill"
            display="block"
            size="medium"
            disabled={!bookerCompleted}
            onPress={() => markCompleteAndNext(1)}
          >
            작성 완료
          </Button>
        </CollapsibleSection>

        {/* Traveler info */}
        <CollapsibleSection
          title="여행자 정보"
          open={openSection === 2}
          onToggle={() => setOpenSection(openSection === 2 ? -1 : 2)}
          completed={!!completedSections[2]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => setTravelerSameAsBooker(!travelerSameAsBooker)}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: travelerSameAsBooker ? colors.blue500 : colors.grey300,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              {travelerSameAsBooker && <Icon name="icon-check" size={14} color={colors.blue500} />}
            </TouchableOpacity>
            <Text>예약자 정보와 동일</Text>
          </View>

          <Button
            type="primary"
            style="ghost"
            display="block"
            size="medium"
            onPress={() => markCompleteAndNext(2)}
          >
            작성 완료
          </Button>
        </CollapsibleSection>

        {/* Pickup info (collapsed) */}
        <CollapsibleSection
          title="픽업 정보"
          open={openSection === 3}
          onToggle={() => setOpenSection(openSection === 3 ? -1 : 3)}
          completed={!!completedSections[3]}
        >
          <Text color={colors.grey600}>픽업 정보가 필요하지 않은 경우 생략하세요.</Text>
          <Button type="primary" style="ghost" display="block" size="medium" onPress={() => markCompleteAndNext(3)}>
            작성 완료
          </Button>
        </CollapsibleSection>

        {/* Requests */}
        <CollapsibleSection
          title="요청 사항"
          open={openSection === 4}
          onToggle={() => setOpenSection(openSection === 4 ? -1 : 4)}
          completed={!!completedSections[4]}
        >
          <TextInput placeholder="요청사항을 입력하세요" style={[styles.input, { height: 80 }]} multiline />
          <Button type="primary" style="ghost" display="block" size="medium" onPress={() => markCompleteAndNext(4)}>
            작성 완료
          </Button>
        </CollapsibleSection>

        {/* Payment details */}
        <CollapsibleSection
          title="결제 수단"
          open={openSection === 5}
          onToggle={() => setOpenSection(openSection === 5 ? -1 : 5)}
          completed={!!completedSections[5]}
        >
          <View style={styles.paymentRow}>
            <TouchableOpacity
              style={[styles.paymentBtn, selectedPayment === "toss" && styles.paymentBtnActive]}
              onPress={() => setSelectedPayment("toss")}
            >
              <Text>tosspay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentBtn, selectedPayment === "naver" && styles.paymentBtnActive]}
              onPress={() => setSelectedPayment("naver")}
            >
              <Text>npay</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paymentRow}>
            <TouchableOpacity
              style={[styles.paymentBtn, selectedPayment === "kakao" && styles.paymentBtnActive]}
              onPress={() => setSelectedPayment("kakao")}
            >
              <Text>kpay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentBtn, selectedPayment === "card" && styles.paymentBtnActive]}
              onPress={() => setSelectedPayment("card")}
            >
              <Text>신용카드/체크카드</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 12 }} />

          {/* Agreements */}
          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity onPress={toggleAgreeAll} style={styles.agreeRow}>
              <View style={styles.checkbox}>
                {agreeAll && <Icon name="icon-check" size={14} color={colors.blue500} />}
              </View>
              <Text>전체 동의하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAgreePersonal((s) => !s)}
              style={styles.agreeRow}
            >
              <View style={styles.checkbox}>
                {agreePersonal && <Icon name="icon-check" size={14} color={colors.blue500} />}
              </View>
              <Text style={{ marginLeft: 8 }}>
                (필수) 개인정보 처리방침 동의
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAgreeService((s) => !s)}
              style={styles.agreeRow}
            >
              <View style={styles.checkbox}>
                {agreeService && <Icon name="icon-check" size={14} color={colors.blue500} />}
              </View>
              <Text style={{ marginLeft: 8 }}>
                (필수) 서비스 이용 약관 동의
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAgreeMarketing((s) => !s)}
              style={styles.agreeRow}
            >
              <View style={styles.checkbox}>
                {agreeMarketing && <Icon name="icon-check" size={14} color={colors.blue500} />}
              </View>
              <Text style={{ marginLeft: 8 }}>
                (선택) 마케팅 수신 동의
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 12 }} />

          <Button
            type="primary"
            style="fill"
            display="block"
            size="large"
            disabled={!paymentCompleted}
            onPress={() => {
              // mark payment section done (for visual) and scroll to bottom (CTA)
              setCompletedSections((s) => ({ ...s, [5]: true }));
            }}
          >
            결제수단 선택 완료
          </Button>
        </CollapsibleSection>

        <View style={{ height: 120 }} />
        {/* Fixed bottom CTA */}
        <View style={styles.bottomBar}>
          <View style={{ flex: 1 }}>
            <Text typography="t6" color={colors.grey500}>
              총 금액
            </Text>
            <Text typography="t2" fontWeight="bold">
              {totalPriceText ? `${totalPriceText}원` : "-"}
            </Text>
          </View>

          <View style={{ width: 180 }}>
            <Button
              type="primary"
              style="fill"
              display="block"
              size="large"
              disabled={!paymentCompleted || submitting}
              onPress={onPay}
            >
              {submitting ? "결제중..." : `${totalPriceText ? `${totalPriceText}원 결제하기` : "결제하기"}`}
            </Button>
          </View>
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
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
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.grey50,
    paddingHorizontal: 12,
    marginTop: 8,
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
    backgroundColor: colors.blue50,
  },
  agreeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
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
});

export default ProductPay;