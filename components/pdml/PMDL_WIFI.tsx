import React from "react";
import GenericModule from "./GenericModule";

export default function PMDL_WIFI(props: { moduleKey: string; moduleData: any; googleApiKey?: string }) {
  // Render WIFI spec as properties if present
  return <GenericModule {...props} />;
}