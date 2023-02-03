export const GeschlechtMetaData = {
  id: "C60000018",
  version: "3",
  canonicalUri: "urn:xpersonenstand:schluesseltabelle:geschlecht",
  canonicalVersionUri: "urn:xpersonenstand:schluesseltabelle:geschlecht_3",
  longName: "Geschlecht",
  shortName: "geschlecht",
};

export type GeschlechtValue = "d" | "m" | "w" | "x";

export const GeschlechtVariants: Record<GeschlechtValue, string> = {
  d: "divers",
  m: "männlich",
  w: "weiblich",
  x: "keine Angabe",
};
