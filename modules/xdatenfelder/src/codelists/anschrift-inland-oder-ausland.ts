export const AnschriftInlandOderAuslandMetaData = {
  id: "C60000006",
  version: "2021-06-18",
  canonicalUri: "urn:de:fim:codeliste:anschrift-inland-oder-ausland",
  canonicalVersionUri:
    "urn:de:fim:codeliste:anschrift-inland-oder-ausland_2021-06-18",
  longName: "",
  shortName: "Anschrift Inland oder Ausland",
};

export type AnschriftInlandOderAuslandValue = "001" | "002";

export const AnschriftInlandOderAuslandVariants: Record<
  AnschriftInlandOderAuslandValue,
  string
> = {
  "001": "in Deutschland",
  "002": "außerhalb von Deutschland",
};
