export const MetaData = {
  id: "C60000018",
  version: 3,
  canonicalUri: "urn:xpersonenstand:schluesseltabelle:geschlecht",
  canonicalVersionUri: "urn:xpersonenstand:schluesseltabelle:geschlecht_3",
  longName: "Geschlecht",
  shortName: "geschlecht",
};

export type GeschlechtValues = "d" | "m" | "w" | "x";

export const GeschlechtVariants: Record<string, string> = {
  d: "divers",
  m: "männlich",
  w: "weiblich",
  x: "keine Angabe",
};
