import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { FieldSpec } from "../utils/bookingFieldParser";

type Values = Record<string, any>;

export function BookingDynamicForm({
                                     specs,
                                     participantCount = 1,
                                     onChange,
                                     onValidate,
                                   }: {
  specs: FieldSpec[];                // normalizeBookingField 결과
  participantCount?: number;         // 인원수(예: pax)
  onChange?: (values: Values) => void;
  onValidate?: (values: Values) => { ok: boolean; errors?: string[] };
}) {
  // 내부 값 구조:
  // - participant fields: use 'cus_01' or 'cus_02' 등 되도록 group+index 기반으로 저장
  // - contact/send/other: flat object
  const [values, setValues] = useState<Values>({});

  // 그룹별로 specs 묶기
  const grouped = useMemo(() => {
    const map: Record<string, FieldSpec[]> = {};
    specs.forEach(s => {
      // spec.groups 배열에 여러 그룹이 있을 수 있음 -> 각각 추가
      (s.groups || ["other"]).forEach(g => {
        if (!map[g]) map[g] = [];
        map[g].push(s);
      });
    });
    return map;
  }, [specs]);

  function setValue(path: string, v: any) {
    setValues(prev => {
      const next = { ...prev, [path]: v };
      onChange?.(next);
      return next;
    });
  }

  function renderInput(spec: FieldSpec, pathKey: string) {
    const val = values[pathKey] ?? "";
    if (spec.type === "select") {
      // simple picker: show current and render option buttons
      return (
        <View key={pathKey}>
          <TouchableOpacity style={styles.selectBox} onPress={() => { /* could open modal */ }}>
            <Text>{val ? String(val) : (spec.options?.[0]?.label ?? "선택")}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
            {(spec.options || []).map(o => (
              <TouchableOpacity key={String(o.value)} style={[styles.option, val === o.value && styles.optionActive]} onPress={() => setValue(pathKey, o.value)}>
                <Text style={val === o.value ? { color: "#fff" } : undefined}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (spec.type === "date") {
      return (
        <TextInput
          key={pathKey}
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={val}
          onChangeText={(t) => setValue(pathKey, t)}
        />
      );
    }

    if (spec.type === "time") {
      return (
        <TextInput key={pathKey} style={styles.input} placeholder="HH:MM" value={val} onChangeText={(t) => setValue(pathKey, t)} />
      );
    }

    if (spec.type === "bool") {
      return (
        <TouchableOpacity key={pathKey} style={styles.checkbox} onPress={() => setValue(pathKey, !val)}>
          <Text>{val ? "Yes" : "No"}</Text>
        </TouchableOpacity>
      );
    }

    // default: text / int / textarea
    return (
      <TextInput
        key={pathKey}
        style={styles.input}
        placeholder={spec.label}
        value={String(val)}
        onChangeText={(t) => setValue(pathKey, t)}
      />
    );
  }

  // simple validation using required flags
  function validate(): { ok: boolean; errors?: string[] } {
    const errs: string[] = [];
    specs.forEach(s => {
      if (!s.required) return;
      // for perParticipant fields, validate each participant entry
      if (s.is_perParticipant && (s.groups || []).some(g => g.startsWith("cus_"))) {
        const groupTargets = s.groups.filter(g => g.startsWith("cus_"));
        groupTargets.forEach(g => {
          for (let i = 0; i < participantCount; i++) {
            const key = `${g}__${i}__${s.id}`;
            const v = values[key];
            if (v === undefined || v === null || String(v).trim() === "") {
              errs.push(`[${g} #${i + 1}] ${s.label ?? s.id}은(는) 필수입니다.`);
            }
          }
        });
      } else {
        // non-perParticipant: validate at least once for each group it belongs to (contact/send/other)
        s.groups.forEach(g => {
          const key = `${g}__${s.id}`;
          const v = values[key];
          if (v === undefined || v === null || String(v).trim() === "") {
            errs.push(`[${g}] ${s.label ?? s.id}은(는) 필수입니다.`);
          }
        });
      }
    });
    if (onValidate) return onValidate(values);
    return { ok: errs.length === 0, errors: errs };
  }

  // rendering per-group
  return (
    <ScrollView style={{ maxHeight: 600 }}>
      {Object.entries(grouped).map(([group, fields]) => (
        <View key={group} style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "700", marginBottom: 6 }}>{group}</Text>

          {/* participant groups (cus_01/cus_02 등) 반복 렌더링 */}
          {group.startsWith("cus_") ? (
            Array.from({ length: participantCount }).map((_, idx) => (
              <View key={`${group}#${idx}`} style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "#eee", marginBottom: 8 }}>
                <Text style={{ fontWeight: "600", marginBottom: 8 }}>{group} #{idx + 1}</Text>
                {fields.map(f => (
                  <View key={`${group}__${idx}__${f.id}`} style={{ marginBottom: 8 }}>
                    <Text style={{ marginBottom: 4 }}>{f.label}{f.required ? " *" : ""}</Text>
                    {renderInput(f, `${group}__${idx}__${f.id}`)}
                  </View>
                ))}
              </View>
            ))
          ) : (
            // non-participant group: single set
            <View style={{ padding: 8 }}>
              {fields.map(f => (
                <View key={`${group}__${f.id}`} style={{ marginBottom: 8 }}>
                  <Text style={{ marginBottom: 4 }}>{f.label}{f.required ? " *" : ""}</Text>
                  {renderInput(f, `${group}__${f.id}`)}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity
        style={styles.validateBtn}
        onPress={() => {
          const r = validate();
          if (!r.ok) {
            alert(`검증 실패:\n${(r.errors || []).join("\n")}`);
          } else {
            alert("검증 통과");
          }
        }}
      >
        <Text style={{ color: "#fff" }}>입력 검증</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#FFF",
  },
  selectBox: {
    height: 44,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 10,
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#EEE",
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  optionActive: {
    backgroundColor: "#2b7cff",
  },
  checkbox: {
    height: 36,
    width: 80,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  validateBtn: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
});