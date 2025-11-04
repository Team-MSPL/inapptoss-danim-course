import React from "react";
import GenericModule from "./GenericModule";

export default function PMDL_PACKAGE_DESC(props: { moduleKey: string; moduleData: any; googleApiKey?: string }) {
  return <GenericModule {...props} />;
}