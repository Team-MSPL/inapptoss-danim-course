export type RawBookingField = any;

export type FieldSpec = {
  id: string;
  label?: string;
  type: "text" | "date" | "time" | "select" | "bool" | "int" | "textarea" | "unknown";
  required: boolean;
  groups: string[]; // use array, e.g. ["cus_01","contact","send"]
  is_perParticipant?: boolean;
  is_lead_used?: boolean;
  ref_source?: string | null;
  options?: Array<{ value: string | number; label: string }>;
  raw?: any;
  meta?: { traffic_type?: string; traffic_key?: string } | null;
};

export function normalizeBookingField(raw: RawBookingField): FieldSpec[] {
  const specs: FieldSpec[] = [];
  if (!raw) return specs;

  // guide_lang top-level
  if (raw.guide_lang) {
    const g = raw.guide_lang;
    const options = Array.isArray(g.list_option)
      ? g.list_option.map((o: any) => ({ value: o.code ?? o.id ?? o, label: o.name ?? String(o) }))
      : [];
    specs.push({
      id: "guide_lang",
      label: "guide_lang",
      type: "select",
      required: String(g.is_require).toLowerCase() === "true",
      groups: ["general"],
      is_perParticipant: false,
      is_lead_used: false,
      ref_source: g.ref_source ?? null,
      options,
      raw: g,
      meta: null,
    });
  }

  // custom.*
  if (raw.custom && typeof raw.custom === "object") {
    for (const [key, cfg] of Object.entries<any>(raw.custom)) {
      const typeRaw: string = (cfg.type ?? "").toString().toLowerCase();
      let type: FieldSpec["type"] = "unknown";
      if (typeRaw.includes("string")) type = "text";
      else if (typeRaw.includes("date")) type = "date";
      else if (typeRaw.includes("time")) type = "time";
      else if (typeRaw.includes("list") || typeRaw.includes("list_option")) type = "select";
      else if (typeRaw === "bool") type = "bool";
      else if (typeRaw === "int" || typeRaw === "integer") type = "int";
      else if (typeRaw.includes("textarea")) type = "textarea";

      const options =
        Array.isArray(cfg.list_option) && cfg.list_option.length
          ? cfg.list_option.map((o: any) => {
            const value = o.code ?? o.id ?? o.app_type ?? o.unit_code ?? o;
            const label = o.name ?? o.app_name ?? (o.hour ? `${o.hour}:${o.min ?? "00"}` : String(value));
            return { value, label };
          })
          : undefined;

      const groups: string[] = Array.isArray(cfg.use) ? cfg.use.slice() : [];

      specs.push({
        id: key,
        label: key.replace(/_/g, " "),
        type,
        required: String(cfg.is_require ?? cfg.is_require === true).toLowerCase() === "true" || cfg.is_require === true,
        groups: groups.length ? groups : ["other"],
        is_perParticipant: String(cfg.is_perParticipant).toLowerCase() === "true",
        is_lead_used: String(cfg.is_lead_used).toLowerCase() === "true",
        ref_source: cfg.ref_source ?? null,
        options,
        raw: cfg,
        meta: null,
      });
    }
  }

  // traffics array
  if (Array.isArray(raw.traffics)) {
    raw.traffics.forEach((trafficObj: any) => {
      let tvalue = null;
      if (trafficObj.traffic_type && trafficObj.traffic_type.traffic_type_value) {
        tvalue = trafficObj.traffic_type.traffic_type_value;
      } else if (trafficObj.traffic_type && typeof trafficObj.traffic_type === "string") {
        tvalue = trafficObj.traffic_type;
      }
      for (const [k, cfg] of Object.entries<any>(trafficObj)) {
        if (k === "traffic_type") continue;
        const typeRaw = (cfg.type ?? "").toString().toLowerCase();
        let type: FieldSpec["type"] = "unknown";
        if (typeRaw.includes("string")) type = "text";
        else if (typeRaw.includes("date")) type = "date";
        else if (typeRaw.includes("time")) type = "time";
        else if (typeRaw.includes("list") || typeRaw.includes("list_option")) type = "select";
        else if (typeRaw === "bool") type = "bool";
        else if (typeRaw === "int") type = "int";

        const options =
          Array.isArray(cfg.list_option) && cfg.list_option.length
            ? cfg.list_option.map((o: any) => ({ value: o.id ?? o.code ?? o, label: o.name ?? String(o) }))
            : undefined;

        specs.push({
          id: `traffic__${tvalue}__${k}`,
          label: `${tvalue} - ${k}`,
          type,
          required: String(cfg.is_require).toLowerCase() === "true",
          groups: [`traffic:${tvalue}`],
          is_perParticipant: false,
          is_lead_used: false,
          ref_source: cfg.ref_source ?? null,
          options,
          raw: cfg,
          meta: { traffic_type: tvalue, traffic_key: k },
        });
      }
    });
  }

  // mobile_device
  if (raw.mobile_device && typeof raw.mobile_device === "object") {
    for (const [key, cfg] of Object.entries<any>(raw.mobile_device)) {
      const typeRaw = (cfg.type ?? "").toString().toLowerCase();
      const type: FieldSpec["type"] = typeRaw.includes("date") ? "date" : typeRaw.includes("string") ? "text" : "unknown";
      specs.push({
        id: `mobile__${key}`,
        label: `mobile ${key}`,
        type,
        required: String(cfg.is_require).toLowerCase() === "true",
        groups: ["mobile_device"],
        is_perParticipant: false,
        is_lead_used: false,
        ref_source: null,
        options: undefined,
        raw: cfg,
        meta: null,
      });
    }
  }

  return specs;
}