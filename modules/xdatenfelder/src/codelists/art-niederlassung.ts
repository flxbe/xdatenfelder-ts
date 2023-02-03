export const ArtNiederlassungMetaData = {
  id: "C60000035",
  version: "1",
  canonicalUri: "urn:xoev-de:xunternehmen:codeliste:artniederlassung",
  canonicalVersionUri: "urn:xoev-de:xunternehmen:codeliste:artniederlassung_1",
  longName: "Art einer Niederlassung",
  shortName: "artniederlassung",
};

export type ArtNiederlassungValue = "01" | "02" | "03" | "04";

export const ArtNiederlassungVariants: Record<ArtNiederlassungValue, string> = {
  "01": "Hauptniederlassung",
  "02": "Zweigniederlassung",
  "03": "Unselbständige Zweigstelle",
  "04": "Betriebsstätte (unspezifisch)",
};
