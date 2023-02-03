export const MetaData = {
  id: "C60000031",
  version: "1",
  canonicalUri: "urn:de:xauslaender:codelist:azr:artderaugenfarbe",
  canonicalVersionUri: "urn:de:xauslaender:codelist:azr:artderaugenfarbe_1",
  longName: "AugenfarbeArt",
  shortName: "AZR.AugenfarbeArt",
};

export type Value =
  | "01"
  | "03"
  | "06"
  | "16"
  | "19"
  | "20"
  | "21"
  | "22"
  | "35"
  | "98"
  | "99";

export const Variants: Record<Value, string> = {
  "01": "Blau",
  "03": "Blaugrau",
  "06": "Braun",
  "16": "Grau",
  "19": "Graubraun",
  "20": "Graugrün",
  "21": "Grauschwarz",
  "22": "Grün",
  "35": "Schwarz",
  "98": "Sonstige",
  "99": "Unbekannt",
};
