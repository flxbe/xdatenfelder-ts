export const klassifikationKommunikationMetaData = {
  id: "C60000037",
  version: "1",
  canonicalUri:
    "urn:xoev-de:xunternehmen:codeliste:klassifikationkommunikation",
  canonicalVersionUri:
    "urn:xoev-de:xunternehmen:codeliste:klassifikationkommunikation_1",
  longName: "Klassifikation Kommunikation",
  shortName: "klassifikationkommunikation",
};

export type klassifikationKommunikationValue = "01" | "02" | "03";

export const klassifikationKommunikationVariants: Record<
  klassifikationKommunikationValue,
  string
> = {
  "01": "allgemein",
  "02": "privat",
  "03": "geschäftlich",
};
