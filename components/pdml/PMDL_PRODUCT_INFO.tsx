// optional: if you have PMDL_PRODUCT_INFO in some payloads
import React from "react";
import GenericModule from "./GenericModule";

export default function PMDL_PRODUCT_INFO(props: { moduleKey: string; moduleData: any }) {
  return <GenericModule {...props} />;
}