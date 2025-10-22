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
import { Image } from "@granite-js/react-native";
import {FixedBottomCTAProvider, Button, Text, colors, Icon, FixedBottomCTA} from "@toss-design-system/react-native";
import { useProductStore } from "../../zustand/useProductStore";
import { CollapsibleSection } from "../../components/product/collapsibleSection";
import { MiniProductCard } from "../../components/product/miniProductCard";

export const Route = createRoute("/product/pay", {
  validateParams: (params) => params,
  component: ProductPay,
});

function formatPrice(n?: number | null) {
  if (n === null || n === undefined) return "";
  return Math.floor(Number(n)).toLocaleString();
}

type PaymentMethod = "toss" | "naver" | "kakao" | "card" | null;
type ContactMethod = "WhatsApp" | "WeChat" | "Messenger" | "Line" | "Instagram" | "KakaoTalk" | "";

function ProductPay() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const pkgData = params?.pkgData ?? null;

  const { pdt } = useProductStore();
  if (!pdt) return null;

  const thumbnail = pdt?.prod_img_url ?? (pdt?.img_list && pdt.img_list[0]) ?? "";
  const title = pdt?.prod_name || pdt?.name;

  const totalPriceCalc =
    params?.total ??
    (params?.adult && params?.adult_price
      ? params.adult * params.adult_price + (params.child ?? 0) * (params.child_price ?? params.adult_price)
      : 0);

  // openSections map: independent toggles; booking (1) open by default
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: true });
  const [completedSections, setCompletedSections] = useState<Record<number, boolean>>({});

  // Booker fields
  const [lastNameEng, setLastNameEng] = useState<string>(params?.booker?.lastNameEng ?? "");
  const [firstNameEng, setFirstNameEng] = useState<string>(params?.booker?.firstNameEng ?? "");
  const [nationality, setNationality] = useState<string>(params?.booker?.nationality ?? "대한민국");
  const [phone, setPhone] = useState<string>(params?.booker?.phone ?? "");
  const [email, setEmail] = useState<string>(params?.booker?.email ?? "");

  // nationality lists (country labels)
  const [countries] = useState<string[]>([
    "미국",
    "베트남",
    "태국",
    "일본",
    "대한민국",
    "중국",
    "대만",
    "홍콩",
  ]);
  // separate dropdown visibility states to avoid focus conflict
  const [showBookerNationalityOptions, setShowBookerNationalityOptions] = useState<boolean>(false);
  const [showTravelerNationalityOptions, setShowTravelerNationalityOptions] = useState<boolean>(false);

  // Traveler fields
  // DEFAULT: unchecked (false)
  const [travelerSameAsBooker, setTravelerSameAsBooker] = useState<boolean>(false);
  const [travelerLastName, setTravelerLastName] = useState<string>("");
  const [travelerFirstName, setTravelerFirstName] = useState<string>("");
  const [travelerGender, setTravelerGender] = useState<"female" | "male" | null>(null);
  const [travelerNationality, setTravelerNationality] = useState<string>("대한민국");
  const [travelerPassport, setTravelerPassport] = useState<string>("");
  const [travelerContactDuring, setTravelerContactDuring] = useState<"none" | "has" | null>("none");

  // Contact
  const contactOptions: ContactMethod[] = ["WhatsApp", "WeChat", "Messenger", "Line", "Instagram", "KakaoTalk"];
  const [contactMethod, setContactMethod] = useState<ContactMethod>("");
  const [showContactMethodOptions, setShowContactMethodOptions] = useState<boolean>(false);
  const [contactId, setContactId] = useState<string>("");
  const [contactIdConfirm, setContactIdConfirm] = useState<string>("");
  const [contactVerified, setContactVerified] = useState<boolean>(false);
  const [contactError, setContactError] = useState<string>("");

  // Pickup
  const [pickupPlace, setPickupPlace] = useState<string>(params?.pickup?.pickupPlace ?? "");
  const [dropoffPlace, setDropoffPlace] = useState<string>(params?.pickup?.dropoffPlace ?? "");

  // Payment & agreements
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("toss");
  const [agreeAll, setAgreeAll] = useState<boolean>(false);
  const [agreePersonal, setAgreePersonal] = useState<boolean>(false);
  const [agreeService, setAgreeService] = useState<boolean>(false);
  const [agreeMarketing, setAgreeMarketing] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);

  const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
  const isValidPhone = (v: string) => v.replace(/\D/g, "").length >= 8;

  // When travelerSameAsBooker toggles:
  // - if set to true: copy from booker
  // - if set to false: clear traveler fields
  useEffect(() => {
    if (travelerSameAsBooker) {
      setTravelerLastName(lastNameEng);
      setTravelerFirstName(firstNameEng);
      setTravelerNationality(nationality);
    } else {
      // clear traveler fields when unchecked
      setTravelerLastName("");
      setTravelerFirstName("");
      setTravelerGender(null);
      setTravelerNationality("대한민국");
      setTravelerPassport("");
      setTravelerContactDuring("none");
      setContactMethod("");
      setContactId("");
      setContactIdConfirm("");
      setContactVerified(false);
      setContactError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travelerSameAsBooker]);

  // Also if booker changes while "same" is true, keep traveler in sync:
  useEffect(() => {
    if (travelerSameAsBooker) {
      setTravelerLastName(lastNameEng);
      setTravelerFirstName(firstNameEng);
      setTravelerNationality(nationality);
    }
  }, [lastNameEng, firstNameEng, nationality, travelerSameAsBooker]);

  const bookerCompleted = useMemo(() => {
    return !!(lastNameEng && firstNameEng && nationality && isValidPhone(phone) && isValidEmail(email));
  }, [lastNameEng, firstNameEng, nationality, phone, email]);

  const travelerCompleted = useMemo(() => {
    if (travelerSameAsBooker) {
      return !!(travelerPassport && (travelerContactDuring === "none" || (travelerContactDuring === "has" && contactVerified)));
    }
    return !!(travelerLastName && travelerFirstName && travelerGender && travelerNationality && travelerPassport && (travelerContactDuring === "none" || (travelerContactDuring === "has" && contactVerified)));
  }, [travelerSameAsBooker, travelerLastName, travelerFirstName, travelerGender, travelerNationality, travelerPassport, travelerContactDuring, contactVerified]);

  const paymentCompleted = useMemo(() => {
    return !!selectedPayment && agreePersonal && agreeService;
  }, [selectedPayment, agreePersonal, agreeService]);

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

  function verifyContactId() {
    setContactError("");
    setContactVerified(false);
    if (!contactMethod) {
      setContactError("연락 수단을 선택하세요.");
      return;
    }
    if (!contactId) {
      setContactError("아이디를 입력하세요.");
      return;
    }
    if (!contactIdConfirm) {
      setContactError("아이디 재확인을 입력하세요.");
      return;
    }
    if (contactId !== contactIdConfirm) {
      setContactError("아이디가 일치하지 않습니다.");
      return;
    }
    setContactVerified(true);
    setContactError("");
  }

  function resetContact() {
    setContactVerified(false);
    setContactId("");
    setContactIdConfirm("");
    setContactError("");
    setContactMethod("");
  }

  async function onPay() {
    if (!paymentCompleted) return;
    setSubmitting(true);
    try {
      const payload = {
        prod_no: params?.prod_no,
        pkg_no: params?.pkg_no,
        selected_date: params?.selected_date,
        booker: { lastNameEng, firstNameEng, nationality, phone, email },
        traveler: {
          sameAsBooker: travelerSameAsBooker,
          lastName: travelerLastName,
          firstName: travelerFirstName,
          gender: travelerGender,
          nationality: travelerNationality,
          passport: travelerPassport,
          contactDuringTravel: travelerContactDuring === "has" ? { method: contactMethod, id: contactId } : null,
        },
        pickup: (pickupPlace || dropoffPlace) ? { pickupPlace, dropoffPlace } : null,
        paymentMethod: selectedPayment,
        total: totalPriceCalc,
      };
      await new Promise(r => setTimeout(r, 700));
      navigation.navigate('/product/confirmation', { order: payload });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  // compute per-person prices and totals (prefer params, fallback to pkgData)
  const adultPrice = params?.adult_price ?? params?.display_price ?? pkgData?.item?.[0]?.b2c_min_price ?? pkgData?.b2c_min_price ?? 0;
  const childPrice = params?.child_price ?? adultPrice;
  const adultCount = Number(params?.adult ?? 1);
  const childCount = Number(params?.child ?? 0);
  const adultTotal = adultPrice * adultCount;
  const childTotal = childPrice * childCount;
  const productAmount = adultTotal + childTotal;

  // compute original per-person if available to show discount percent
  const originalPerPerson = params?.original_price ?? pkgData?.item?.[0]?.b2c_min_price ?? pkgData?.b2c_min_price ?? undefined;
  const salePerPerson = params?.display_price ?? adultPrice;
  const percent = (originalPerPerson && salePerPerson && originalPerPerson > salePerPerson)
    ? Math.floor(100 - (salePerPerson / originalPerPerson) * 100)
    : 0;

  const productDiscount = (originalPerPerson && salePerPerson && originalPerPerson > salePerPerson)
    ? Math.floor((originalPerPerson - salePerPerson) * (adultCount + childCount))
    : 0;

  // render
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

        {/* Booker */}
        <CollapsibleSection
          title="예약자 정보"
          open={!!openSections[1]}
          onToggle={() => toggleSection(1)}
          completed={!!completedSections[1]}
        >
          <View>
            <Text typography="t6" color={colors.grey800}>
              성(영문) <Text style={{ color: colors.red400 }}>*</Text>
            </Text>
            <TextInput
              placeholder="예) HONG"
              placeholderTextColor={colors.grey400}
              value={lastNameEng}
              onChangeText={setLastNameEng}
              style={styles.input}
            />
            <Text typography="t6" color={colors.grey800} style={{ marginTop: 8 }}>
              이름(영문) <Text style={{ color: colors.red400 }}>*</Text>
            </Text>
            <TextInput
              placeholder="예) GILDONG"
              placeholderTextColor={colors.grey400}
              value={firstNameEng}
              onChangeText={setFirstNameEng}
              style={styles.input}
            />

            {/* 국적 (Booker dropdown) */}
            <Text typography="t6" color={colors.grey800} style={{ marginTop: 8 }}>
              국적 <Text style={{ color: colors.red400 }}>*</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowBookerNationalityOptions(prev => !prev);
                setShowTravelerNationalityOptions(false);
                setShowContactMethodOptions(false);
              }}
              style={[styles.input, { justifyContent: 'center' }]}
            >
              <Text style={{ color: colors.grey800 }}>{nationality}</Text>
            </TouchableOpacity>

            {showBookerNationalityOptions && (
              <View style={[styles.dropdown, { maxHeight: 220 }]}>
                <ScrollView nestedScrollEnabled>
                  {countries.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => {
                        setNationality(c);
                        setShowBookerNationalityOptions(false);
                      }}
                      style={{ paddingVertical: 12, paddingHorizontal: 10 }}
                    >
                      <Text>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text typography="t6" color={colors.grey800} style={{ marginTop: 8 }}>
              전화번호 <Text style={{ color: colors.red400 }}>*</Text>
            </Text>
            <TextInput
              placeholder="예) 01012345678"
              placeholderTextColor={colors.grey400}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <Text typography="t6" color={colors.grey800} style={{ marginTop: 8 }}>
              이메일 <Text style={{ color: colors.red400 }}>*</Text>
            </Text>
            <TextInput
              placeholder="예) email@gmail.com"
              placeholderTextColor={colors.grey400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
            />
            <View style={{ height: 8 }} />

            {/* 이메일/전화 안내 (빨간글씨) */}
            <Text typography="t6" style={{ color: colors.red500, marginTop: 12, lineHeight: 20 }}>
              입력하신 이메일과 전화번호는 주문 내역 및 바우처 전달을 위해 사용됩니다.
            </Text>

            <View style={{ height: 8 }} />
            <Button
              type="primary"
              style="fill"
              display="block"
              size="large"
              containerStyle={{ width: 130, alignSelf: "center", height: 50, marginTop: 8 }}
              disabled={!bookerCompleted}
              onPress={() => markCompleteAndNext(1)}
            >
              작성 완료
            </Button>
          </View>
        </CollapsibleSection>

        {/* Traveler */}
        <CollapsibleSection
          title="여행자 정보"
          open={!!openSections[2]}
          onToggle={() => toggleSection(2)}
          completed={!!completedSections[2]}
        >
          <View>
            <View style={{ marginBottom: 12 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setTravelerSameAsBooker(prev => !prev)}
                style={[
                  styles.sameBox,
                  travelerSameAsBooker ? { borderColor: colors.blue500 } : undefined,
                ]}
                accessibilityRole="button"
                accessibilityState={{ checked: travelerSameAsBooker }}
                accessibilityLabel="예약자와 여행자가 같은지 여부"
              >
                <Text typography="t5" style={{ flex: 1, color: colors.grey800 }}>
                  예약자와 여행자가 같아요
                </Text>

                <View
                  style={[
                    styles.checkboxBox,
                    travelerSameAsBooker ? styles.checkboxBoxChecked : undefined,
                  ]}
                >
                  {travelerSameAsBooker ? (
                    <Icon name="icon-check" size={14} color="#fff" />
                  ) : null}
                </View>
              </TouchableOpacity>

              <Text style={{ color: colors.red400, marginTop: 8 }}>
                여권 정보와 정확히 일치하도록 입력해 주세요
              </Text>
            </View>

            <Text typography="t6" color={colors.grey800}>성(영문) <Text style={{ color: colors.red400 }}>*</Text></Text>
            <TextInput
              placeholder="예) HONG"
              placeholderTextColor={colors.grey400}
              value={travelerLastName}
              onChangeText={setTravelerLastName}
              style={styles.input}
            />
            <Text typography="t6" color={colors.grey800} style={{ marginTop: 8 }}>이름(영문) <Text style={{ color: colors.red400 }}>*</Text></Text>
            <TextInput
              placeholder="예) GILDONG"
              placeholderTextColor={colors.grey400}
              value={travelerFirstName}
              onChangeText={setTravelerFirstName}
              style={styles.input}
            />

            <Text typography="t6" color={colors.grey800} style={{ marginTop: 8 }}>성별 <Text style={{ color: colors.red400 }}>*</Text></Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity onPress={() => setTravelerGender('female')} style={[styles.smallOption, travelerGender === 'female' && styles.smallOptionActive, { marginRight: 8 }]}>
                <Text style={[travelerGender === 'female' && styles.smallOptionActiveText]}>여성</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTravelerGender('male')} style={[styles.smallOption, travelerGender === 'male' && styles.smallOptionActive]}>
                <Text style={[travelerGender === 'male' && styles.smallOptionActiveText]}>남성</Text>
              </TouchableOpacity>
            </View>

            <Text typography="t6" color={colors.grey800} style={{ marginTop: 12 }}>국적 <Text style={{ color: colors.red400 }}>*</Text></Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowTravelerNationalityOptions(prev => !prev);
                setShowBookerNationalityOptions(false);
                setShowContactMethodOptions(false);
              }}
              style={[styles.input, { justifyContent: 'center' }]}
            >
              <Text style={{ color: colors.grey800 }}>{travelerNationality}</Text>
            </TouchableOpacity>

            {showTravelerNationalityOptions && (
              <View style={[styles.dropdown, { maxHeight: 220 }]}>
                <ScrollView nestedScrollEnabled>
                  {countries.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => {
                        setTravelerNationality(c);
                        setShowTravelerNationalityOptions(false);
                      }}
                      style={{ paddingVertical: 12, paddingHorizontal: 10 }}
                    >
                      <Text>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text typography="t6" color={colors.grey800} style={{ marginTop: 12 }}>여권 번호 <Text style={{ color: colors.red400 }}>*</Text></Text>
            <TextInput
              placeholder="예) M12345678"
              placeholderTextColor={colors.grey400}
              value={travelerPassport}
              onChangeText={setTravelerPassport}
              style={styles.input}
            />

            <Text typography="t6" color={colors.grey800} style={{ marginTop: 12 }}>여행 중 연락 수단 <Text style={{ color: colors.red400 }}>*</Text></Text>

            {/* two buttons side-by-side filling width */}
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setTravelerContactDuring('none');
                  setShowContactMethodOptions(false);
                }}
                style={[styles.smallOption, travelerContactDuring === 'none' && styles.smallOptionActive, { marginRight: 8 }]}
              >
                <Text style={[travelerContactDuring === 'none' && styles.smallOptionActiveText]}>없음</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setTravelerContactDuring('has');
                  // open contact method dropdown when selecting 'has'
                  setShowContactMethodOptions(true);
                  setShowBookerNationalityOptions(false);
                  setShowTravelerNationalityOptions(false);
                }}
                style={[styles.smallOption, travelerContactDuring === 'has' && styles.smallOptionActive]}
              >
                <Text style={[travelerContactDuring === 'has' && styles.smallOptionActiveText]}>있음</Text>
              </TouchableOpacity>
            </View>

            {travelerContactDuring === 'has' && (
              <View style={{ marginTop: 12 }}>
                <Text typography="t6" color={colors.grey800}>연락 수단 이름 <Text style={{ color: colors.red400 }}>*</Text></Text>

                {/* Contact method dropdown (independent) */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setShowContactMethodOptions(prev => !prev);
                    setShowBookerNationalityOptions(false);
                    setShowTravelerNationalityOptions(false);
                  }}
                  style={[styles.input, { justifyContent: 'center' }]}
                >
                  <Text style={{ color: colors.grey800 }}>{contactMethod || '선택하세요'}</Text>
                </TouchableOpacity>

                {showContactMethodOptions && (
                  <View style={[styles.dropdown, { maxHeight: 220 }]}>
                    <ScrollView nestedScrollEnabled>
                      {contactOptions.map((m) => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => {
                            setContactMethod(m);
                            setShowContactMethodOptions(false);
                          }}
                          style={{ paddingVertical: 12, paddingHorizontal: 10 }}
                        >
                          <Text>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {contactMethod && !contactVerified && (
                  <View style={{ marginTop: 12 }}>
                    <Text typography="t6" color={colors.grey800}>아이디</Text>
                    <TextInput placeholder="아이디 입력" placeholderTextColor={colors.grey400} value={contactId} onChangeText={setContactId} style={styles.input} />
                    <Text typography="t6" color={colors.grey800} style={{ marginTop: 8 }}>아이디 재확인</Text>
                    <TextInput placeholder="아이디 재확인" placeholderTextColor={colors.grey400} value={contactIdConfirm} onChangeText={setContactIdConfirm} style={styles.input} />
                    {contactError ? <Text typography="t6" style={{ color: colors.red400, marginTop: 6 }}>{contactError}</Text> : null}
                    <View style={{ height: 12 }} />
                    <Button type="primary" style="fill" display="block" size="large" disabled={!contactId || !contactIdConfirm} onPress={verifyContactId} containerStyle={{ width: 130, alignSelf: "center", height: 50, marginVertical: 12 }}>입력 완료</Button>
                  </View>
                )}

                {contactMethod && contactVerified && (
                  <View style={{ marginTop: 12 }}>
                    <View
                      style={[styles.input, { justifyContent: 'center' }]}
                    >
                      <Text style={{ color: colors.grey800 }}>{contactId}</Text>
                    </View>
                    <Button type="primary" containerStyle={{ width: 130, alignSelf: "center", height: 50, marginVertical: 12 }} display="block" size="large" onPress={resetContact}>수정하기</Button>
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 12 }} />
            <Button type="primary" style="fill" display="block" size="large" containerStyle={{ alignSelf: 'center', width: 130, height: 50 }} disabled={!travelerCompleted} onPress={() => markCompleteAndNext(2)}>작성 완료</Button>
          </View>
        </CollapsibleSection>

        {/* Pickup */}
        <CollapsibleSection title="픽업 정보" open={!!openSections[3]} onToggle={() => toggleSection(3)} completed={!!completedSections[3]}>
          <Text typography="t6" color={colors.grey800}>픽업 장소 <Text style={{ color: colors.red400 }}>*</Text></Text>
          <TextInput placeholder="영문 장소명과 영문 주소를 입력해 주세요" placeholderTextColor={colors.grey400} value={pickupPlace} onChangeText={setPickupPlace} style={styles.input} />
          <Text typography="t6" color={colors.grey800} style={{ marginTop: 12 }}>드랍 장소 <Text style={{ color: colors.red400 }}>*</Text></Text>
          <TextInput placeholder="영문 장소명과 영문 주소를 입력해 주세요" placeholderTextColor={colors.grey400} value={dropoffPlace} onChangeText={setDropoffPlace} style={styles.input} />
          <View style={{ height: 12 }} />
          <Button type="primary" style="fill" display="block" size="large" containerStyle={{ alignSelf: 'center', width: 130, height: 50 }} disabled={!pickupPlace || !dropoffPlace} onPress={() => markCompleteAndNext(3)}>작성 완료</Button>
        </CollapsibleSection>

        {/* Requests */}
        <CollapsibleSection title="요청 사항" open={!!openSections[4]} onToggle={() => toggleSection(4)} completed={!!completedSections[4]}>
          <TextInput placeholder="요청사항을 입력하세요" placeholderTextColor={colors.grey400} style={styles.input} />
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

        <View style={{ paddingVertical: 8, paddingHorizontal: 20}}>
          <Text typography="t3" fontWeight='bold' style={{ marginVertical: 6, padding: 8 }}>개인 정보 수집  ·  이용 약관 동의</Text>
          <TouchableOpacity onPress={toggleAgreeAll} style={{flexDirection: "row", alignItems: "center", paddingVertical: 8,}}>
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
        <FixedBottomCTA onPress={onPay} disabled={!paymentCompleted || submitting}>
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