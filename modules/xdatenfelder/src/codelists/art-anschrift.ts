export const MetaData = {
  id: "C60000036",
  version: "1",
  canonicalUri: "urn:xoev-de:xunternehmen:codeliste:artanschrift",
  canonicalVersionUri: "urn:xoev-de:xunternehmen:codeliste:artanschrift_1",
  longName: "Art der Anschrift",
  shortName: "artanschrift",
};

export type Value = "00" | "01" | "02" | "03" | "04" | "05" | "06";

export const Variants: Record<Value, string> = {
  "00": "unbestimmt",
  "01": "Wohnsitzadresse",
  "02": "Adresse des Betriebs / der Betriebsstätte",
  "03": "Adresse der Geschäftsleitung / des Sitzes",
  "04": "Bekanntgabeadresse",
  "05": "Geschäftsanschrift",
  "06": "Bekanntgabeadresse für Gebührenbescheide",
};
