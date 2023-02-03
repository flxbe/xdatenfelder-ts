export const FamilienstandMetaData = {
  id: "C60000001",
  version: "2",
  canonicalUri: "urn:de:dsmeld:schluesseltabelle:familienstand",
  canonicalVersionUri: "urn:de:dsmeld:schluesseltabelle:familienstand_2",
  longName: "Familienstand",
  shortName: "DSMeld_Familienstand_(DSMeld-Blatt_1401)",
};

export type FamilienstandValue =
  | "EA"
  | "GS"
  | "LA"
  | "LD"
  | "LE"
  | "LP"
  | "LV"
  | "NB"
  | "VH"
  | "VW";

export const FamilienstandVariants: Record<FamilienstandValue, string> = {
  EA: "Ehe aufgehoben",
  GS: "geschieden",
  LA: "aufgehobene Lebenspartnerschaft",
  LD: "ledig",
  LE: "durch Todeserklärung aufgelöste Lebenspartnerschaft",
  LP: "in eingetragener Lebenspartnerschaft",
  LV: "durch Tod aufgelöste Lebenspartnerschaft",
  NB: "nicht bekannt",
  VH: "verheiratet",
  VW: "verwitwet",
};
