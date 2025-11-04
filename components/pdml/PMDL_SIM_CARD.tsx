import React from "react";
import GenericModule from "./GenericModule";

export default function PMDL_SIM_CARD(props: { moduleKey: string; moduleData: any; googleApiKey?: string }) {
  return <GenericModule {...props} />;
}