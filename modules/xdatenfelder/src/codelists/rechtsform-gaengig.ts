export const MetaData = {
  id: "C60000025",
  version: "2021-06-18",
  canonicalUri: "urn:de:fim:codeliste:rechtsformen-gaengig",
  canonicalVersionUri: "urn:de:fim:codeliste:rechtsformen-gaengig_2021-06-18",
  longName: "",
  shortName: "",
};

export type Value =
  | "170"
  | "180"
  | "210"
  | "220"
  | "230"
  | "270"
  | "293"
  | "310"
  | "350"
  | "351"
  | "360"
  | "400"
  | "590"
  | "611";

export const Variants: Record<Value, string> = {
  "170": "eingetragenes Einzelunternehmen (e.K.; e.Kfm.; e.Kfr.)",
  "180": "nicht eingetragenes Einzelunternehmen",
  "210": "Offene Handelsgesellschaft (OHG)",
  "220": "Kommanditgesellschaft (KG)",
  "230": "GmbH & Co. KG",
  "270": "Gesellschaft des bürgerlichen Rechts (GbR; BGB-Gesellschaft)",
  "293": "Partnerschaftsgesellschaft",
  "310": "Aktiengesellschaften (AG)",
  "350": "Gesellschaft mit beschränkter Haftung (GmbH)",
  "351": "Unternehmergesellschaft (haftungsbeschränkt)",
  "360": "Europäische Aktiengesellschaft (SE)",
  "400": "eingetragene Genossenschaft (eG)",
  "590": "eingetragener Verein",
  "611": "rechtsfähige Stiftung",
};
