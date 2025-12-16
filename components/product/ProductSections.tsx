import React from "react";
import { View, TextInput } from "react-native";
import CollapsibleSection from "./collapsibleSection";
import BuyerInfoSection from "../product/sections/BuyerInfoSection";
import { Text, Button, colors } from "@toss-design-system/react-native";
import { Image } from "@granite-js/react-native";

export default function ProductSections(props: any) {
  const {
    openSections,
    toggleSection,
    completedSections,
    onCompletePress,
    rawFields,
    thumbnail,
    title,
    engLastUse,
    engFirstUse,
    engLastSpec,
    engFirstSpec,
    genderUse,
    genderSpec,
    nationalityUse,
    nationalityOptions,
    nationalitySpec,
    hasCus01,
    hasCus02,
    hasContact,
    hasSend,
    hasFlight,
    hasPsgQty,
    hasVoucher,
    hasRentcar01,
    hasRentcar02,
    hasRentcar03,
    hasPickup03,
    hasPickup04,
    PayField,
    Traffic,
    styles,
    MiniProductCard,
    formatPrice,
    productAmount,
    originalPerPerson,
    salePerPerson,
    orderNote,
    setOrderNote,
  } = props;

  return (
    <>
      <CollapsibleSection title="투어 정보" open={!!openSections[0]} onToggle={() => toggleSection(0)} completed={!!completedSections[0]}>
        <Text typography="t4" fontWeight="bold" style={{ marginBottom: 12 }}>{title}</Text>
        <Image source={{ uri: thumbnail }} style={styles.tourImage} resizeMode="cover" />
      </CollapsibleSection>

      <CollapsibleSection title="구매자 정보" open={!!openSections[1]} onToggle={() => toggleSection(1)} completed={!!completedSections[1]}>
        <BuyerInfoSection onComplete={() => onCompletePress(1)} />
      </CollapsibleSection>

      {rawFields?.guide_lang && (
        <CollapsibleSection title="가이드 언어" open={!!openSections[2]} onToggle={() => toggleSection(2)} completed={!!completedSections[2]}>
          <PayField.GuideLangSelector rawFields={rawFields} onSelect={(code: any) => {/* parent handles setGuideLangCode */}} />
          <Button type="primary" style="fill" display="block" size="large" containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }} onPress={() => onCompletePress(2)}>
            작성 완료
          </Button>
        </CollapsibleSection>
      )}

      {hasCus01 && (
        <CollapsibleSection title="예약자 정보" open={!!openSections[3]} onToggle={() => toggleSection(3)} completed={!!completedSections[3]}>
          <View>
            {engLastUse.includes("cus_01") && <PayField.EngLastNameInput cusType="cus_01" required={String(engLastSpec?.is_require ?? "").toLowerCase() === "true"} />}
            {engFirstUse.includes("cus_01") && <PayField.EngFirstNameInput cusType="cus_01" required={String(engFirstSpec?.is_require ?? "").toLowerCase() === "true"} />}
            {genderUse.includes("cus_01") && <PayField.GenderSelector cusType="cus_01" required={String(genderSpec?.is_require ?? "").toLowerCase() === "true"} />}
            {nationalityUse.includes("cus_01") && <PayField.NationalitySelector cusType="cus_01" options={nationalityOptions} required={String(nationalitySpec?.is_require ?? "").toLowerCase() === "true"} />}

            {rawFields?.custom?.mtp_no && Array.isArray(rawFields.custom.mtp_no.use) && rawFields.custom.mtp_no.use.includes("cus_01") && (
              <PayField.MtpNoInput cusType="cus_01" required={String(rawFields.custom.mtp_no.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.id_no && Array.isArray(rawFields.custom.id_no.use) && rawFields.custom.id_no.use.includes("cus_01") && (
              <PayField.IdNoInput cusType="cus_01" required={String(rawFields.custom.id_no.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.passport_no && Array.isArray(rawFields.custom.passport_no.use) && rawFields.custom.passport_no.use.includes("cus_01") && (
              <PayField.PassportNoInput cusType="cus_01" required={String(rawFields.custom.passport_no.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.passport_expdate && Array.isArray(rawFields.custom.passport_expdate.use) && rawFields.custom.passport_expdate.use.includes("cus_01") && (
              <PayField.PassportExpDateInput cusType="cus_01" required={String(rawFields.custom.passport_expdate.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.birth && Array.isArray(rawFields.custom.birth.use) && rawFields.custom.birth.use.includes("cus_01") && (
              <PayField.BirthDateInput cusType="cus_01" required={String(rawFields.custom.birth.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.height && Array.isArray(rawFields.custom.height.use) && rawFields.custom.height.use.includes("cus_01") && (
              <PayField.HeightInput cusType="cus_01" required={String(rawFields.custom.height.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.height_unit && Array.isArray(rawFields.custom.height_unit.use) && rawFields.custom.height_unit.use.includes("cus_01") && (
              <PayField.HeightUnitSelector cusType="cus_01" options={rawFields.custom.height_unit.list_option} required={String(rawFields.custom.height_unit.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.weight && Array.isArray(rawFields.custom.weight.use) && rawFields.custom.weight.use.includes("cus_01") && (
              <PayField.WeightInput cusType="cus_01" required={String(rawFields.custom.weight.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.weight_unit && Array.isArray(rawFields.custom.weight_unit.use) && rawFields.custom.weight_unit.use.includes("cus_01") && (
              <PayField.WeightUnitSelector cusType="cus_01" options={rawFields.custom.weight_unit.list_option} required={String(rawFields.custom.weight_unit.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.shoe && Array.isArray(rawFields.custom.shoe.use) && rawFields.custom.shoe.use.includes("cus_01") && (
              <PayField.ShoeInput cusType="cus_01" required={String(rawFields.custom.shoe.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.shoe_unit && Array.isArray(rawFields.custom.shoe_unit.use) && rawFields.custom.shoe_unit.use.includes("cus_01") && (
              <PayField.ShoeUnitSelector cusType="cus_01" options={rawFields.custom.shoe_unit.list_option} required={String(rawFields.custom.shoe_unit.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.shoe_type && Array.isArray(rawFields.custom.shoe_type.use) && rawFields.custom.shoe_type.use.includes("cus_01") && (
              <PayField.ShoeTypeSelector cusType="cus_01" options={rawFields.custom.shoe_type.list_option} required={String(rawFields.custom.shoe_type.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.glass_degree && Array.isArray(rawFields.custom.glass_degree.use) && rawFields.custom.glass_degree.use.includes("cus_01") && (
              <PayField.GlassDegreeSelector cusType="cus_01" options={rawFields.custom.glass_degree.list_option} required={String(rawFields.custom.glass_degree.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.meal && Array.isArray(rawFields.custom.meal.use) && rawFields.custom.meal.use.includes("cus_01") && (
              <PayField.MealSelector cusType="cus_01" options={rawFields.custom.meal.list_option} required={String(rawFields.custom.meal.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.allergy_food && Array.isArray(rawFields.custom.allergy_food.use) && rawFields.custom.allergy_food.use.includes("cus_01") && (
              <PayField.AllergyFoodSelector cusType="cus_01" options={rawFields.custom.allergy_food.list_option} required={String(rawFields.custom.allergy_food.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.native_last_name && Array.isArray(rawFields.custom.native_last_name.use) && rawFields.custom.native_last_name.use.includes("cus_01") && (
              <PayField.NativeLastNameInput cusType="cus_01" required={String(rawFields.custom.native_last_name.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.native_first_name && Array.isArray(rawFields.custom.native_first_name.use) && rawFields.custom.native_first_name.use.includes("cus_01") && (
              <PayField.NativeFirstNameInput cusType="cus_01" required={String(rawFields.custom.native_first_name.is_require ?? "").toLowerCase() === "true"} />
            )}

            <Button type="primary" style="fill" display="block" size="large"
                    containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                    onPress={() => onCompletePress(3)}>작성 완료</Button>
          </View>
        </CollapsibleSection>
      )}

      {hasCus02 && (
        <CollapsibleSection title="여행자 정보" open={!!openSections[4]} onToggle={() => toggleSection(4)} completed={!!completedSections[4]}>
          <View>
            {engLastUse.includes("cus_02") && <PayField.EngLastNameInput cusType="cus_02" required={String(engLastSpec?.is_require ?? "").toLowerCase() === "true"} />}
            {engFirstUse.includes("cus_02") && <PayField.EngFirstNameInput cusType="cus_02" required={String(engFirstSpec?.is_require ?? "").toLowerCase() === "true"} />}
            {genderUse.includes("cus_02") && <PayField.GenderSelector cusType="cus_02" required={String(genderSpec?.is_require ?? "").toLowerCase() === "true"} />}
            {nationalityUse.includes("cus_02") && <PayField.NationalitySelector cusType="cus_02" options={nationalityOptions} required={String(nationalitySpec?.is_require ?? "").toLowerCase() === "true"} />}

            {rawFields?.custom?.mtp_no && Array.isArray(rawFields.custom.mtp_no.use) && rawFields.custom.mtp_no.use.includes("cus_02") && (
              <PayField.MtpNoInput cusType="cus_02" required={String(rawFields.custom.mtp_no.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.id_no && Array.isArray(rawFields.custom.id_no.use) && rawFields.custom.id_no.use.includes("cus_02") && (
              <PayField.IdNoInput cusType="cus_02" required={String(rawFields.custom.id_no.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.passport_no && Array.isArray(rawFields.custom.passport_no.use) && rawFields.custom.passport_no.use.includes("cus_02") && (
              <PayField.PassportNoInput cusType="cus_02" required={String(rawFields.custom.passport_no.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.passport_expdate && Array.isArray(rawFields.custom.passport_expdate.use) && rawFields.custom.passport_expdate.use.includes("cus_02") && (
              <PayField.PassportExpDateInput cusType="cus_02" required={String(rawFields.custom.passport_expdate.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.birth && Array.isArray(rawFields.custom.birth.use) && rawFields.custom.birth.use.includes("cus_02") && (
              <PayField.BirthDateInput cusType="cus_02" required={String(rawFields.custom.birth.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.height && Array.isArray(rawFields.custom.height.use) && rawFields.custom.height.use.includes("cus_02") && (
              <PayField.HeightInput cusType="cus_02" required={String(rawFields.custom.height.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.height_unit && Array.isArray(rawFields.custom.height_unit.use) && rawFields.custom.height_unit.use.includes("cus_02") && (
              <PayField.HeightUnitSelector cusType="cus_02" options={rawFields.custom.height_unit.list_option} required={String(rawFields.custom.height_unit.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.weight && Array.isArray(rawFields.custom.weight.use) && rawFields.custom.weight.use.includes("cus_02") && (
              <PayField.WeightInput cusType="cus_02" required={String(rawFields.custom.weight.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.weight_unit && Array.isArray(rawFields.custom.weight_unit.use) && rawFields.custom.weight_unit.use.includes("cus_02") && (
              <PayField.WeightUnitSelector cusType="cus_02" options={rawFields.custom.weight_unit.list_option} required={String(rawFields.custom.weight_unit.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.shoe && Array.isArray(rawFields.custom.shoe.use) && rawFields.custom.shoe.use.includes("cus_02") && (
              <PayField.ShoeInput cusType="cus_02" required={String(rawFields.custom.shoe.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.shoe_unit && Array.isArray(rawFields.custom.shoe_unit.use) && rawFields.custom.shoe_unit.use.includes("cus_02") && (
              <PayField.ShoeUnitSelector cusType="cus_02" options={rawFields.custom.shoe_unit.list_option} required={String(rawFields.custom.shoe_unit.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.shoe_type && Array.isArray(rawFields.custom.shoe_type.use) && rawFields.custom.shoe_type.use.includes("cus_02") && (
              <PayField.ShoeTypeSelector cusType="cus_02" options={rawFields.custom.shoe_type.list_option} required={String(rawFields.custom.shoe_type.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.glass_degree && Array.isArray(rawFields.custom.glass_degree.use) && rawFields.custom.glass_degree.use.includes("cus_02") && (
              <PayField.GlassDegreeSelector cusType="cus_02" options={rawFields.custom.glass_degree.list_option} required={String(rawFields.custom.glass_degree.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.meal && Array.isArray(rawFields.custom.meal.use) && rawFields.custom.meal.use.includes("cus_02") && (
              <PayField.MealSelector cusType="cus_02" options={rawFields.custom.meal.list_option} required={String(rawFields.custom.meal.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.allergy_food && Array.isArray(rawFields.custom.allergy_food.use) && rawFields.custom.allergy_food.use.includes("cus_02") && (
              <PayField.AllergyFoodSelector cusType="cus_02" options={rawFields.custom.allergy_food.list_option} required={String(rawFields.custom.allergy_food.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.native_last_name && Array.isArray(rawFields.custom.native_last_name.use) && rawFields.custom.native_last_name.use.includes("cus_02") && (
              <PayField.NativeLastNameInput cusType="cus_02" required={String(rawFields.custom.native_last_name.is_require ?? "").toLowerCase() === "true"} />
            )}
            {rawFields?.custom?.native_first_name && Array.isArray(rawFields.custom.native_first_name.use) && rawFields.custom.native_first_name.use.includes("cus_02") && (
              <PayField.NativeFirstNameInput cusType="cus_02" required={String(rawFields.custom.native_first_name.is_require ?? "").toLowerCase() === "true"} />
            )}

            <Button type="primary" style="fill" display="block" size="large"
                    containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                    onPress={() => onCompletePress(4)}>작성 완료</Button>
          </View>
        </CollapsibleSection>
      )}

      {hasContact && (
        <CollapsibleSection title="연락 수단" open={!!openSections[5]} onToggle={() => toggleSection(5)} completed={!!completedSections[5]}>
          <View>
            {rawFields?.custom?.native_last_name && Array.isArray(rawFields.custom.native_last_name.use) && rawFields.custom.native_last_name.use.includes("contact") && (<PayField.NativeLastNameInput cusType="contact" required={String(rawFields.custom.native_last_name.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.native_first_name && Array.isArray(rawFields.custom.native_first_name.use) && rawFields.custom.native_first_name.use.includes("contact") && (<PayField.NativeFirstNameInput cusType="contact" required={String(rawFields.custom.native_first_name.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.tel_country_code && Array.isArray(rawFields.custom.tel_country_code.use) && rawFields.custom.tel_country_code.use.includes("contact") && (<PayField.TelCountryCodeSelector cusType="contact" options={rawFields.custom.tel_country_code.list_option} required={String(rawFields.custom.tel_country_code.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.tel_number && Array.isArray(rawFields.custom.tel_number.use) && rawFields.custom.tel_number.use.includes("contact") && (<PayField.TelNumberInput cusType="contact" required={String(rawFields.custom.tel_number.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.contact_app && Array.isArray(rawFields.custom.contact_app.list_option) && rawFields.custom.contact_app.use?.includes("contact") && (<PayField.ContactAppSelector cusType="contact" options={rawFields.custom.contact_app.list_option} required={String(rawFields.custom.contact_app.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.contact_app_account && Array.isArray(rawFields.custom.contact_app_account.use) && rawFields.custom.contact_app_account.use.includes("contact") && (<PayField.ContactAppAccountInput cusType="contact" required={String(rawFields.custom.contact_app_account.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.have_app && Array.isArray(rawFields.custom.have_app.use) && rawFields.custom.have_app.use.includes("contact") && (<PayField.HaveAppToggle cusType="contact" label="연락 앱 설치 여부" />)}
            <Button type="primary" style="fill" display="block" size="large" containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }} onPress={() => onCompletePress(5)}>작성 완료</Button>
          </View>
        </CollapsibleSection>
      )}

      {hasSend && (
        <CollapsibleSection title="투숙 정보" open={!!openSections[6]} onToggle={() => toggleSection(6)} completed={!!completedSections[6]}>
          <View>
            {rawFields?.custom?.native_last_name && Array.isArray(rawFields.custom.native_last_name.use) && rawFields.custom.native_last_name.use.includes("send") && (<PayField.NativeLastNameInput cusType="send" required={String(rawFields.custom.native_last_name.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.native_first_name && Array.isArray(rawFields.custom.native_first_name.use) && rawFields.custom.native_first_name.use.includes("send") && (<PayField.NativeFirstNameInput cusType="send" required={String(rawFields.custom.native_first_name.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.tel_country_code && Array.isArray(rawFields.custom.tel_country_code.use) && rawFields.custom.tel_country_code.use.includes("send") && (<PayField.TelCountryCodeSelector cusType="send" options={rawFields.custom.tel_country_code.list_option} required={String(rawFields.custom.tel_country_code.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.tel_number && Array.isArray(rawFields.custom.tel_number.use) && rawFields.custom.tel_number.use.includes("send") && (<PayField.TelNumberInput cusType="send" required={String(rawFields.custom.tel_number.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.country_cities && Array.isArray(rawFields.custom.country_cities.list_option) && rawFields.custom.country_cities.use?.includes("send") && (<PayField.CountryCitiesSelector cusType="send" options={rawFields.custom.country_cities.list_option} required={String(rawFields.custom.country_cities.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.zipcode && Array.isArray(rawFields.custom.zipcode.use) && rawFields.custom.zipcode.use.includes("send") && (<PayField.ZipcodeInput cusType="send" required={String(rawFields.custom.zipcode.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.address && Array.isArray(rawFields.custom.address.use) && rawFields.custom.address.use.includes("send") && (<PayField.AddressInput cusType="send" required={String(rawFields.custom.address.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.hotel_name && Array.isArray(rawFields.custom.hotel_name.use) && rawFields.custom.hotel_name.use.includes("send") && (<PayField.HotelNameInput cusType="send" required={String(rawFields.custom.hotel_name.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.hotel_tel_number && Array.isArray(rawFields.custom.hotel_tel_number.use) && rawFields.custom.hotel_tel_number.use.includes("send") && (<PayField.HotelTelNumberInput cusType="send" required={String(rawFields.custom.hotel_tel_number.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.booking_order_no && Array.isArray(rawFields.custom.booking_order_no.use) && rawFields.custom.booking_order_no.use.includes("send") && (<PayField.BookingOrderNoInput cusType="send" required={String(rawFields.custom.booking_order_no.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.check_in_date && Array.isArray(rawFields.custom.check_in_date.use) && rawFields.custom.check_in_date.use.includes("send") && (<PayField.CheckInDateInput cusType="send" required={String(rawFields.custom.check_in_date.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields?.custom?.check_out_date && Array.isArray(rawFields.custom.check_out_date.use) && rawFields.custom.check_out_date.use.includes("send") && (<PayField.CheckOutDateInput cusType="send" required={String(rawFields.custom.check_out_date.is_require ?? "").toLowerCase() === "true"} />)}
            <Button type="primary" style="fill" display="block" size="large" containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }} onPress={() => onCompletePress(6)}>작성 완료</Button>
          </View>
        </CollapsibleSection>
      )}

      {hasFlight && (
        <CollapsibleSection title="항공편 정보" open={!!openSections[7]} onToggle={() => toggleSection(7)} completed={!!completedSections[7]}>
          <View>
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_flightType && (<Traffic.ArrivalFlightTypeSelector trafficType="flight" rawFields={rawFields} required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_flightType?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_airport && (<Traffic.ArrivalAirportSelector trafficType="flight" rawFields={rawFields} required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_airport?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_airlineName && (<Traffic.ArrivalAirlineInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_airlineName?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_flightNo && (<Traffic.ArrivalFlightNoInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_flightNo?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_terminalNo && (<Traffic.ArrivalTerminalInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_terminalNo?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_visa && (<Traffic.ArrivalVisaToggle trafficType="flight" />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_date && (<Traffic.ArrivalDateInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_date?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.arrival_time && (<Traffic.ArrivalTimeInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.arrival_time?.is_require ?? "").toLowerCase() === "true"} />)}

            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_flightType && (<Traffic.DepartureFlightTypeSelector trafficType="flight" rawFields={rawFields} required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_flightType?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_airport && (<Traffic.DepartureAirportSelector trafficType="flight" rawFields={rawFields} required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_airport?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_airlineName && (<Traffic.DepartureAirlineInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_airlineName?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_flightNo && (<Traffic.DepartureFlightNoInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_flightNo?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_terminalNo && (<Traffic.DepartureTerminalInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_terminalNo?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_haveBeenInCountry && (<Traffic.DepartureHaveBeenInCountryInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_haveBeenInCountry?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_date && (<Traffic.DepartureDateInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_date?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "flight")?.departure_time && (<Traffic.DepartureTimeInput trafficType="flight" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="flight")?.departure_time?.is_require ?? "").toLowerCase() === "true"} />)}

            <Button type="primary" style="fill" display="block" size="large"
                    containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                    onPress={() => onCompletePress(7)}>작성 완료</Button>
          </View>
        </CollapsibleSection>
      )}

      {hasPsgQty && (
        <CollapsibleSection title="탑승자 수" open={!!openSections[8]} onToggle={() => toggleSection(8)} completed={!!completedSections[8]}>
          <View>
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.carpsg_adult && (<Traffic.CarPsgAdultInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.carpsg_adult?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.carpsg_child && (<Traffic.CarPsgChildInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.carpsg_child?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.carpsg_infant && (<Traffic.CarPsgInfantInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.carpsg_infant?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.safetyseat_sup_child && (<Traffic.SafetyseatSupChildInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.safetyseat_sup_child?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.safetyseat_self_child && (<Traffic.SafetyseatSelfChildInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.safetyseat_self_child?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.safetyseat_sup_infant && (<Traffic.SafetyseatSupInfantInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.safetyseat_sup_infant?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.safetyseat_self_infant && (<Traffic.SafetyseatSelfInfantInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.safetyseat_self_infant?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.luggage_carry && (<Traffic.LuggageCarryInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.luggage_carry?.is_require ?? "").toLowerCase() === "true"} />)}
            {rawFields.traffics.find((t:any) => t?.traffic_type?.traffic_type_value === "psg_qty")?.luggage_check && (<Traffic.LuggageCheckInput trafficType="psg_qty" required={String(rawFields.traffics.find((t:any)=>t?.traffic_type?.traffic_type_value==="psg_qty")?.luggage_check?.is_require ?? "").toLowerCase() === "true"} />)}

            <Button type="primary" style="fill" display="block" size="large"
                    containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                    onPress={() => onCompletePress(8)}>작성 완료</Button>
          </View>
        </CollapsibleSection>
      )}

      {(hasRentcar01 || hasRentcar02 || hasRentcar03) && (
        <CollapsibleSection title="렌터카 정보" open={!!openSections[9]} onToggle={() => toggleSection(9)} completed={!!completedSections[9]}>
          <View>
            {Array.isArray(rawFields?.traffics) && rawFields.traffics.map((spec: any, specIndex: number) => {
              const t = spec?.traffic_type?.traffic_type_value;
              if (!t || !["rentcar_01","rentcar_02","rentcar_03"].includes(t)) return null;
              const requiredLabel = `렌터카 정보 ${specIndex + 1}`;
              return (
                <View key={`rentcar_${specIndex}`} style={{ marginBottom: 12 }}>
                  <Text typography="t5" color={colors.grey800} style={{ marginBottom: 8 }}>{requiredLabel}</Text>
                  {spec?.s_location && (<Traffic.RentcarLocationSelector trafficType={t} field="s_location" rawFields={rawFields} specIndex={specIndex} required={String(spec.s_location?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.e_location && (<Traffic.RentcarLocationSelector trafficType={t} field="e_location" rawFields={rawFields} specIndex={specIndex} required={String(spec.e_location?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.s_date && (<Traffic.RentcarDateInput trafficType={t} field="s_date" rawFields={rawFields} specIndex={specIndex} required={String(spec.s_date?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.s_time && (<Traffic.RentcarTimeInput trafficType={t} field="s_time" rawFields={rawFields} specIndex={specIndex} required={String(spec.s_time?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.e_date && (<Traffic.RentcarDateInput trafficType={t} field="e_date" rawFields={rawFields} specIndex={specIndex} required={String(spec.e_date?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.e_time && (<Traffic.RentcarTimeInput trafficType={t} field="e_time" rawFields={rawFields} specIndex={specIndex} required={String(spec.e_time?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.is_rent_customize && (<Traffic.RentcarCustomizeToggle trafficType={t} spec={spec} specIndex={specIndex} label={spec.is_rent_customize?.label ?? "직접 주소 입력"} onValueChange={(v: any) => console.log("rent customize", v)} />)}
                </View>
              );
            })}
            <Button type="primary" style="fill" display="block" size="large"
                    containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                    onPress={() => onCompletePress(9)}>작성 완료</Button>
          </View>
        </CollapsibleSection>
      )}

      {(hasPickup03 || hasPickup04) && (
        <CollapsibleSection title="픽업 정보" open={!!openSections[10]} onToggle={() => toggleSection(10)} completed={!!completedSections[10]}>
          <View>
            {Array.isArray(rawFields?.traffics) && rawFields.traffics.map((spec: any, specIndex: number) => {
              const t = spec?.traffic_type?.traffic_type_value;
              if (!t || !["pickup_03","pickup_04"].includes(t)) return null;
              const label = `픽업 정보 ${specIndex + 1}`;
              return (
                <View key={`pickup_${specIndex}`} style={{ marginBottom: 12 }}>
                  <Text typography="t5" color={colors.grey800} style={{ marginBottom: 8 }}>{label}</Text>
                  {spec?.s_location && (<Traffic.PickupLocationInput trafficType={t} field="s_location" rawFields={rawFields} specIndex={specIndex} required={String(spec.s_location?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.s_date && (<Traffic.PickupDateInput trafficType={t} field="s_date" rawFields={rawFields} specIndex={specIndex} required={String(spec.s_date?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.s_time && (<Traffic.PickupTimeInput trafficType={t} field="s_time" rawFields={rawFields} specIndex={specIndex} required={String(spec.s_time?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.e_location && (<Traffic.PickupLocationInput trafficType={t} field="e_location" rawFields={rawFields} specIndex={specIndex} required={String(spec.e_location?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.e_date && (<Traffic.PickupDateInput trafficType={t} field="e_date" rawFields={rawFields} specIndex={specIndex} required={String(spec.e_date?.is_require ?? "").toLowerCase() === "true"} />)}
                  {spec?.e_time && (<Traffic.PickupTimeInput trafficType={t} field="e_time" rawFields={rawFields} specIndex={specIndex} required={String(spec.e_time?.is_require ?? "").toLowerCase() === "true"} />)}
                </View>
              );
            })}
            <Button type="primary" style="fill" display="block" size="large"
                    containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                    onPress={() => onCompletePress(10)}>작성 완료</Button>
          </View>
        </CollapsibleSection>
      )}

      {hasVoucher && (
        <CollapsibleSection title="바우처/픽업 위치" open={!!openSections[11]} onToggle={() => toggleSection(11)} completed={!!completedSections[11]}>
          <View>
            {Array.isArray(rawFields?.traffics) && rawFields.traffics.map((spec: any, specIndex: number) => {
              const t = spec?.traffic_type?.traffic_type_value;
              if (!t || t !== "voucher") return null;
              return (
                <View key={`voucher_${specIndex}`} style={{ marginBottom: 12 }}>
                  {spec?.s_location && (<Traffic.VoucherLocationInput trafficType={t} field="s_location" rawFields={rawFields} specIndex={specIndex} required={String(spec.s_location?.is_require ?? "").toLowerCase() === "true"} />)}
                </View>
              );
            })}
            <Button type="primary" style="fill" display="block" size="large"
                    containerStyle={{ alignSelf: 'center', width: 130, height: 50, marginTop: 12 }}
                    onPress={() => onCompletePress(11)}>작성 완료</Button>
          </View>
        </CollapsibleSection>
      )}

      <CollapsibleSection title="요청 사항" open={!!openSections[12]} onToggle={() => toggleSection(12)} completed={!!completedSections[12]}>
        <View style={{ paddingHorizontal: 20 }}>
          <TextInput
            placeholder="요청사항을 입력하세요"
            placeholderTextColor={colors.grey400}
            value={orderNote}
            onChangeText={setOrderNote}
            style={[styles.input]}
            multiline
          />
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="결제 세부 내역" open={!!openSections[13]} onToggle={() => toggleSection(13)} completed={!!completedSections[13]}>
        <MiniProductCard image={thumbnail} title={title} originPrice={originalPerPerson} salePrice={salePerPerson} perPersonText={`${formatPrice(productAmount)}원`} />
        <View style={{ marginTop: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.grey100 }}>
          <View style={styles.row}>
            <Text typography='t5'>상품 금액</Text>
            <Text typography='t5'>{formatPrice(productAmount)}원</Text>
          </View>
        </View>
      </CollapsibleSection>

      <View style={{ height: 12, backgroundColor: colors.grey100, marginTop: 8 }} />
    </>
  );
}