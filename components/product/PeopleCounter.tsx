import {TouchableOpacity, View} from "react-native";
import {colors, Text} from "@toss-design-system/react-native";
import React from "react";

export function formatPrice(n?: number | null) {
  if (n === null || n === undefined) return '';
  return Math.floor(Number(n)).toLocaleString();
}

export function toNumber(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/* ---- Helpers (SKU/calendar price extraction) ---- */

export function safeNum(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = Number(v.replace(/,/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function lowestPriceFromEntry(entry: any) {
  if (!entry) return undefined;
  const candidates: number[] = [];
  // prefer b2b prices when available
  const keys = ['b2b_price', 'b2c_price', 'price', 'sale_price', 'original_price'];
  keys.forEach(k => {
    const val = entry?.[k];
    if (val == null) return;
    if (typeof val === 'number' || typeof val === 'string') {
      const n = safeNum(val);
      if (n !== undefined) candidates.push(n);
    } else if (typeof val === 'object') {
      Object.values(val).forEach((vv: any) => {
        const n = safeNum(vv);
        if (n !== undefined) candidates.push(n);
      });
    }
  });
  if (candidates.length === 0) return undefined;
  return Math.min(...candidates);
}

export default function Counter({ label, ageLabel, subLabel, price, value, setValue, min = 0, max = 10, disabled = false }: any) {
  const onMinus = () => {
    if (disabled) return;
    setValue(Math.max(min, value - 1));
  };
  const onPlus = () => {
    if (disabled) return;
    setValue(Math.min(max, value + 1));
  };

  // normalize subLabel to array of lines
  const subLines: string[] = Array.isArray(subLabel)
    ? (subLabel as string[]).filter(Boolean)
    : (subLabel ? String(subLabel).split('\n').map(s => s.trim()).filter(Boolean) : []);

  return (
    <View style={{
      backgroundColor: colors.grey50,
      borderRadius: 16,
      padding: 20,
      marginBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      opacity: disabled ? 0.6 : 1,
    }}>
      {/* Left: flexible content */}
      <View style={{ flex: 1, paddingRight: 12 }}>
        <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text typography="t4" fontWeight="bold" numberOfLines={2} style={{ lineHeight: 24, flexShrink: 1 }}>
              {label}
            </Text>
            {ageLabel ? (
              <Text style={{ marginLeft: 8, color: colors.grey400, fontSize: 13 }}>
                {ageLabel}
              </Text>
            ) : null}
          </View>

          {subLines.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              {subLines.map((line, idx) => (
                <Text key={idx} style={{ color: colors.grey400, fontSize: 13, marginTop: idx === 0 ? 0 : 4 }}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>
          {price ? `${formatPrice(price)}원` : '-'}
        </Text>
      </View>

      {/* Right: fixed controls */}
      <View style={{
        width: 120,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.grey100,
          borderRadius: 10,
          paddingHorizontal: 10,
          height: 46,
        }}>
          <TouchableOpacity onPress={onMinus} disabled={value <= min || disabled}>
            <Text style={{
              fontSize: 28,
              color: value <= min || disabled ? colors.grey300 : colors.grey700,
              width: 32,
              textAlign: 'center',
              lineHeight: 36
            }}>-</Text>
          </TouchableOpacity>

          <View style={{
            minWidth: 36, marginHorizontal: 8, backgroundColor: "#fff",
            borderRadius: 8, alignItems: 'center', justifyContent: 'center'
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', lineHeight: 36 }}>{value}</Text>
          </View>

          <TouchableOpacity onPress={onPlus} disabled={value >= max || disabled}>
            <Text style={{
              fontSize: 28,
              color: value >= max || disabled ? colors.grey300 : colors.grey700,
              width: 32,
              textAlign: 'center',
              lineHeight: 36
            }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}