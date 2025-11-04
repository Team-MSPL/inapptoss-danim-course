import React from "react";
import GenericModule from "./GenericModule";

export default function PMDL_USE_VALID(props: { moduleKey: string; moduleData: any; googleApiKey?: string }) {
  return <GenericModule {...props} />;
}