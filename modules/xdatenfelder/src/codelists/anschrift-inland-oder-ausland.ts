export const MetaData = {
  id: "C60000006",
  version: "2021-06-18",
  canonicalUri: "urn:de:fim:codeliste:anschrift-inland-oder-ausland",
  canonicalVersionUri:
    "urn:de:fim:codeliste:anschrift-inland-oder-ausland_2021-06-18",
  longName: "",
  shortName: "Anschrift Inland oder Ausland",
};

export type Value = "001" | "002";

export const Variants: Record<Value, string> = {
  "001": "in Deutschland",
  "002": "außerhalb von Deutschland",
};
