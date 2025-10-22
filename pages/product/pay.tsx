import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text as RNText,
} from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import { Image } from "@granite-js/react-native";
import { FixedBottomCTAProvider, Button, Text, colors, Icon, Badge } from "@toss-design-system/react-native";
import {useProductStore} from "../../zustand/useProductStore";

export const Route = createRoute("/product/pay", {
  validateParams: (params) => params,
  component: ProductPay,
});

type PaymentMethod = "toss" | "naver" | "kakao" | "card" | null;
type ContactMethod = "WhatsApp" | "WeChat" | "Messenger" | "Line" | "Instagram" | "KakaoTalk" | "";

function formatPrice(n?: number | null) {
  if (n === null || n === undefined) return "";
  return Math.floor(Number(n)).toLocaleString();
}

/* ----------------- Collapsible section ----------------- */
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
          <Text typography="t5" color={colors.grey800} style={{ marginRight: 8 }}>{title}</Text>
          {completed && <Icon name="icon-check" size={16} color={colors.blue500} />}
        </View>
        <Icon name={open ? "icon-arrow-up-mono" : "icon-arrow-down-mono"} size={24} color={colors.grey400} />
      </TouchableOpacity>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

/* ----------------- Mini product card used in payment details ----------------- */
function MiniProductCard({
                           image,
                           title,
                           originPrice,
                           salePrice,
                           percent,
                           perPersonText,
                         }: {
  image?: string | null;
  title: string;
  originPrice?: number;
  salePrice?: number;
  percent?: number;
  perPersonText?: string;
}) {
  return (
    <View style={miniCardStyles.cardWrap}>
      <View style={miniCardStyles.cardInner}>
        <View style={miniCardStyles.imageCol}>
          <Image
            source={{ uri: image ?? "" }}
            style={miniCardStyles.image}
            resizeMode="cover"
          />
          <Badge
            type={"red"}
            badgeStyle="fill"
            size="tiny"
            style={{
              position: 'absolute',
              left: 6,
              bottom: 8,
              paddingHorizontal: 2,
              paddingVertical: 2,
              zIndex: 2,
            }}
          >
            최저가
          </Badge>
        </View>

        <View style={miniCardStyles.infoCol}>
          <Text typography="t6" fontWeight="medium" color={colors.grey800} numberOfLines={1}>
            {title}
          </Text>

          <View style={miniCardStyles.priceRow}>
            {percent && percent > 0 ? (
              <Text style={miniCardStyles.percentText} typography="t4">{percent}%</Text>
            ) : null}
            <View style={{ flexDirection: 'column' }}>
              {originPrice !== undefined && originPrice > 0 && originPrice > (salePrice ?? 0) ? (
                <Text typography="t7" color={colors.grey300} style={{ textDecorationLine: 'line-through' }}>
                  {formatPrice(originPrice)}원
                </Text>
              ) : null}
              <Text typography="t6" fontWeight="bold" color={colors.grey900} style={{ marginTop: 4 }}>
                {salePrice ? `${formatPrice(salePrice)}원` : "-"}
                {perPersonText ? <Text typography="t7" color={colors.grey500}>{` ${perPersonText}`}</Text> : null}
              </Text>
            </View>
          </View>

          <Text typography="t7" color={colors.grey700} numberOfLines={1} style={{ marginTop: 6 }}>
            {perPersonText ?? ""}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ----------------- Main component ----------------- */

function ProductPay() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const pkgData = params?.pkgData ?? null;

  const { pdt } = useProductStore();
  if (!pdt) return null;

  const thumbnail = pdt?.prod_img_url ?? (pdt?.img_list && pdt.img_list[0]) ?? '';
  const title = pdt?.prod_name || pdt?.name;

  const totalPriceCalc = params?.total ?? (params?.adult && params?.adult_price ? (params.adult * params.adult_price + (params.child ?? 0) * (params.child_price ?? params.adult_price)) : 0);

  // openSections map: independent toggles; booking (1) open by default
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: true });
  const [completedSections, setCompletedSections] = useState<Record<number, boolean>>({});

  // Booker fields
  const [lastNameEng, setLastNameEng] = useState<string>(params?.booker?.lastNameEng ?? "");
  const [firstNameEng, setFirstNameEng] = useState<string>(params?.booker?.firstNameEng ?? "");
  const [nationality, setNationality] = useState<string>(params?.booker?.nationality ?? "대한민국");
  const [phone, setPhone] = useState<string>(params?.booker?.phone ?? "");
  const [email, setEmail] = useState<string>(params?.booker?.email ?? "");

  // Traveler fields (kept)
  const [travelerSameAsBooker, setTravelerSameAsBooker] = useState<boolean>(true);
  const [travelerLastName, setTravelerLastName] = useState<string>("");
  const [travelerFirstName, setTravelerFirstName] = useState<string>("");
  const [travelerGender, setTravelerGender] = useState<"female" | "male" | null>(null);
  const [travelerNationality, setTravelerNationality] = useState<string>("대한민국");
  const [travelerPassport, setTravelerPassport] = useState<string>("");
  const [travelerContactDuring, setTravelerContactDuring] = useState<"none" | "has" | null>("none");

  // Contact
  const contactOptions: ContactMethod[] = ["WhatsApp", "WeChat", "Messenger", "Line", "Instagram", "KakaoTalk"];
  const [contactMethod, setContactMethod] = useState<ContactMethod>("");
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

  useEffect(() => {
    if (travelerSameAsBooker) {
      setTravelerLastName(lastNameEng);
      setTravelerFirstName(firstNameEng);
      setTravelerNationality(nationality);
    }
  }, [travelerSameAsBooker, lastNameEng, firstNameEng, nationality]);

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

        {/* Tour info (use big image + date/time/people lines similar to mock) */}
        <CollapsibleSection
          title="투어 정보"
          open={!!openSections[0]}
          onToggle={() => toggleSection(0)}
          completed={!!completedSections[0]}
        >
          <Text typography="t4" fontWeight="bold" style={{ marginBottom: 12 }}>{title}</Text>
          <Image source={{ uri: thumbnail }} style={styles.tourImage} resizeMode="cover" />
          <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
            <Icon name="icon-calendar" size={20} color={colors.blue500} />
            <Text style={{ marginLeft: 8 }}>{params?.selected_date ?? "-"}</Text>

            <View style={{ width: 24 }} />

            <Icon name="icon-clock" size={20} color={colors.blue500} />
            <Text style={{ marginLeft: 8 }}>{params?.selected_time ?? params?.selected_time_slot ?? "-"}</Text>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
            <Icon name="icon-user" size={20} color={colors.blue500} />
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
            <Text typography="t6" color={colors.grey500}>성(영문) *</Text>
            <TextInput placeholder="예) HONG" value={lastNameEng} onChangeText={setLastNameEng} style={styles.input} />
            <Text typography="t6" color={colors.grey500} style={{ marginTop: 8 }}>이름(영문) *</Text>
            <TextInput placeholder="예) GILDONG" value={firstNameEng} onChangeText={setFirstNameEng} style={styles.input} />
            <Text typography="t6" color={colors.grey500} style={{ marginTop: 8 }}>전화번호 *</Text>
            <TextInput placeholder="예) 01012345678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
            <Text typography="t6" color={colors.grey500} style={{ marginTop: 8 }}>이메일 *</Text>
            <TextInput placeholder="예) email@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" style={styles.input} />
            <View style={{ height: 8 }} />
            <Button type="primary" style="fill" display="block" size="medium" disabled={!bookerCompleted} onPress={() => markCompleteAndNext(1)}>작성 완료</Button>
          </View>
        </CollapsibleSection>

        {/* Traveler */}
        <CollapsibleSection
          title="여행자 정보"
          open={!!openSections[2]}
          onToggle={() => toggleSection(2)}
          completed={!!completedSections[2]}
        >
          <View style={{ marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setTravelerSameAsBooker(!travelerSameAsBooker)} style={{
              borderRadius: 10, borderWidth: 1, borderColor: travelerSameAsBooker ? colors.blue500 : colors.grey300, padding: 12, flexDirection: 'row', alignItems: 'center'
            }}>
              <Text style={{ marginLeft: 8 }}>{travelerSameAsBooker ? '예약자와 여행자가 같아요' : '예약자와 다릅니다'}</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.red400, marginTop: 8 }}>여권 정보와 정확히 일치하도록 입력해 주세요</Text>
          </View>

          <Text typography="t6" color={colors.grey500}>성(영문) *</Text>
          <TextInput placeholder="예) HONG" value={travelerLastName} onChangeText={setTravelerLastName} style={styles.input} />
          <Text typography="t6" color={colors.grey500} style={{ marginTop: 8 }}>이름(영문) *</Text>
          <TextInput placeholder="예) GILDONG" value={travelerFirstName} onChangeText={setTravelerFirstName} style={styles.input} />

          <Text typography="t6" color={colors.grey500} style={{ marginTop: 8 }}>성별 *</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity onPress={() => setTravelerGender('female')} style={[styles.smallOption, travelerGender === 'female' && styles.smallOptionActive]}><Text>여성</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setTravelerGender('male')} style={[styles.smallOption, travelerGender === 'male' && styles.smallOptionActive, { marginLeft: 8 }]}><Text>남성</Text></TouchableOpacity>
          </View>

          <Text typography="t6" color={colors.grey500} style={{ marginTop: 12 }}>국적 *</Text>
          <TouchableOpacity style={styles.select}><Text>{travelerNationality}</Text></TouchableOpacity>

          <Text typography="t6" color={colors.grey500} style={{ marginTop: 12 }}>여권 번호 *</Text>
          <TextInput placeholder="예) M12345678" value={travelerPassport} onChangeText={setTravelerPassport} style={styles.input} />

          <Text typography="t6" color={colors.grey500} style={{ marginTop: 12 }}>여행 중 연락 수단 *</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity onPress={() => setTravelerContactDuring('none')} style={[styles.smallOption, travelerContactDuring === 'none' && styles.smallOptionActive]}><Text>없음</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setTravelerContactDuring('has')} style={[styles.smallOption, travelerContactDuring === 'has' && styles.smallOptionActive, { marginLeft: 8 }]}><Text>있음</Text></TouchableOpacity>
          </View>

          {travelerContactDuring === 'has' && (
            <View style={{ marginTop: 12 }}>
              <Text typography="t6" color={colors.grey500}>연락 수단 이름 *</Text>
              <TouchableOpacity style={styles.select} onPress={() => {}}>
                <Text>{contactMethod || '선택하세요'}</Text>
              </TouchableOpacity>

              {!contactMethod && (
                <View style={{ marginTop: 8, borderRadius: 8, backgroundColor: colors.grey50, padding: 8 }}>
                  {contactOptions.map((m) => (
                    <TouchableOpacity key={m} onPress={() => setContactMethod(m)} style={{ paddingVertical: 10 }}>
                      <Text>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {contactMethod && !contactVerified && (
                <View style={{ marginTop: 12 }}>
                  <Text typography="t6" color={colors.grey500}>아이디</Text>
                  <TextInput placeholder="아이디 입력" value={contactId} onChangeText={setContactId} style={styles.input} />
                  <Text typography="t6" color={colors.grey500} style={{ marginTop: 8 }}>아이디 재확인</Text>
                  <TextInput placeholder="아이디 재확인" value={contactIdConfirm} onChangeText={setContactIdConfirm} style={styles.input} />
                  {contactError ? <Text style={{ color: colors.red400, marginTop: 6 }}>{contactError}</Text> : null}
                  <View style={{ height: 12 }} />
                  <Button type="primary" style="fill" display="block" size="medium" disabled={!contactId || !contactIdConfirm} onPress={verifyContactId}>입력 완료</Button>
                </View>
              )}

              {contactMethod && contactVerified && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ marginBottom: 8 }}>{contactMethod}</Text>
                  <Text style={{ marginBottom: 8 }}>{contactId}</Text>
                  <Button type="primary" style="ghost" display="block" size="small" onPress={resetContact}>수정하기</Button>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 12 }} />
          <Button type="primary" style="fill" display="block" size="medium" disabled={!travelerCompleted} onPress={() => markCompleteAndNext(2)}>작성 완료</Button>
        </CollapsibleSection>

        {/* Pickup */}
        <CollapsibleSection title="픽업 정보" open={!!openSections[3]} onToggle={() => toggleSection(3)} completed={!!completedSections[3]}>
          <Text typography="t6" color={colors.grey500}>픽업 장소 *</Text>
          <TextInput placeholder="영문 장소명과 영문 주소를 입력해 주세요" value={pickupPlace} onChangeText={setPickupPlace} style={styles.input} />
          <Text typography="t6" color={colors.grey500} style={{ marginTop: 12 }}>드랍 장소 *</Text>
          <TextInput placeholder="영문 장소명과 영문 주소를 입력해 주세요" value={dropoffPlace} onChangeText={setDropoffPlace} style={styles.input} />
          <View style={{ height: 12 }} />
          <Button type="primary" style="fill" display="block" size="medium" disabled={!pickupPlace || !dropoffPlace} onPress={() => markCompleteAndNext(3)}>작성 완료</Button>
        </CollapsibleSection>

        {/* Requests */}
        <CollapsibleSection title="요청 사항" open={!!openSections[4]} onToggle={() => toggleSection(4)} completed={!!completedSections[4]}>
          <TextInput placeholder="요청사항을 입력하세요" style={[styles.input, { height: 80 }]} multiline />
          <Button type="primary" style="ghost" display="block" size="medium" onPress={() => markCompleteAndNext(4)}>작성 완료</Button>
        </CollapsibleSection>

        {/* Payment details UI (mini card + breakdown) */}
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
              <Text>상품 금액</Text>
              <Text>{formatPrice(productAmount)}원</Text>
            </View>
            <View style={styles.row}>
              <Text>상품 할인</Text>
              <Text>{formatPrice(productDiscount)}원</Text>
            </View>
          </View>

          <View style={{ marginTop: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.grey100 }}>
            <View style={styles.row}>
              <Text typography="t6" fontWeight="bold" style={{ color: colors.purple500 }}>총 결제 금액</Text>
              <Text typography="t2" fontWeight="bold" style={{ color: colors.purple500 }}>{formatPrice(Math.max(0, productAmount - productDiscount))}원</Text>
            </View>
          </View>
        </CollapsibleSection>

        {/* separator */}
        <View style={{ height: 12, backgroundColor: colors.grey100, marginTop: 8 }} />

        {/* Payment area (standalone) */}
        <View style={[styles.sectionContainer, { paddingHorizontal: 20, paddingVertical: 12 }]}>
          <Text typography="t5" style={{ marginBottom: 12 }}>결제 수단</Text>
          <View style={styles.paymentRow}>
            <TouchableOpacity style={[styles.paymentBtn, selectedPayment === "toss" && styles.paymentBtnActive]} onPress={() => setSelectedPayment("toss")}><Text>tosspay</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.paymentBtn, selectedPayment === "naver" && styles.paymentBtnActive]} onPress={() => setSelectedPayment("naver")}><Text>npay</Text></TouchableOpacity>
          </View>
          <View style={styles.paymentRow}>
            <TouchableOpacity style={[styles.paymentBtn, selectedPayment === "kakao" && styles.paymentBtnActive]} onPress={() => setSelectedPayment("kakao")}><Text>kpay</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.paymentBtn, selectedPayment === "card" && styles.paymentBtnActive]} onPress={() => setSelectedPayment("card")}><Text>신용카드/체크카드</Text></TouchableOpacity>
          </View>

          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity onPress={toggleAgreeAll} style={styles.agreeRow}>
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
        </View>

        <View style={{ height: 120 }} />
        {/* bottom CTA */}
        <View style={styles.bottomBar}>
          <View style={{ flex: 1 }}>
            <Text typography="t6" color={colors.grey500}>총 금액</Text>
            <Text typography="t2" fontWeight="bold">{formatPrice(Math.max(0, productAmount - productDiscount))}원</Text>
          </View>
          <View style={{ width: 180 }}>
            <Button type="primary" style="fill" display="block" size="large" disabled={!paymentCompleted || submitting} onPress={onPay}>
              {submitting ? "결제중..." : `${formatPrice(Math.max(0, productAmount - productDiscount))}원 결제하기`}
            </Button>
          </View>
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}

/* ----------------- Styles ----------------- */

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
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
  smallOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.grey50,
  },
  smallOptionActive: {
    borderWidth: 1,
    borderColor: colors.blue500,
    backgroundColor: colors.blue50,
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

/* ----------------- Mini card styles (based on provided ProductCard) ----------------- */
const miniCardStyles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: 0,
    marginVertical: 6,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  imageCol: {
    position: "relative",
    width: 72,
    height: 72,
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  infoCol: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    paddingVertical: 0,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  percentText: {
    color: colors.red500,
    fontWeight: "bold",
    marginRight: 8,
    alignSelf: "center",
  },
});

export default ProductPay;