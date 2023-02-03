export const MetaData = {
  id: "C60000038",
  version: "2",
  canonicalUri: "urn:xoev-de:xunternehmen:codeliste:artdereintragung",
  canonicalVersionUri: "urn:xoev-de:xunternehmen:codeliste:artdereintragung_2",
  longName: "Art der Eintragung",
  shortName: "artdereintragung",
};

export type Value = "A" | "B" | "G" | "GesR" | "K" | "P" | "S" | "V" | "X";

export const Variants: Record<Value, string> = {
  A: "Eintragung im Handelsregister A",
  B: "Eintragung im Handelsregister B",
  G: "Eintragung im Genossenschaftsregister",
  GesR: "Gesellschaftsregister",
  K: "kraft Gesetz",
  P: "Eintragung im Partnerschaftsregister",
  S: "Eintragung im Stiftungsverzeichnis",
  V: "Eintragung im Vereinsregister",
  X: "Eintragung im Ausland",
};
