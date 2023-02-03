export const MetaData = {
  id: "C60000018",
  version: "3",
  canonicalUri: "urn:xpersonenstand:schluesseltabelle:geschlecht",
  canonicalVersionUri: "urn:xpersonenstand:schluesseltabelle:geschlecht_3",
  longName: "Geschlecht",
  shortName: "geschlecht",
};

export type Value = "d" | "m" | "w" | "x";

export const Variants: Record<Value, string> = {
  d: "divers",
  m: "männlich",
  w: "weiblich",
  x: "keine Angabe",
};
