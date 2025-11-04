import React from "react";
import GenericModule from "./GenericModule";

export default function PMDL_EXTRA_FEE(props: { moduleKey: string; moduleData: any; googleApiKey?: string }) {
  return <GenericModule {...props} />;
}