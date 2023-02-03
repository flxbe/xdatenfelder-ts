export const MetaData = {
  id: "C60000008",
  version: "2020",
  canonicalUri: "urn:de:fim:codeliste:identifikationsdokumenteinternational",
  canonicalVersionUri:
    "urn:de:fim:codeliste:identifikationsdokumenteinternational_2020-08-19",
  longName: "",
  shortName: "Identifikationsdokumente (international)",
};

export type Value = "01" | "02" | "03";

export const Variants: Record<Value, string> = {
  "01": "Nationaler Personalausweis",
  "02": "Nationaler Reisepass",
  "03": "Nationaler Aufenthaltstitel",
};
