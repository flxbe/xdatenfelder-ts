export const GesetzlicherVertreterMetaData = {
  id: "C60000010",
  version: "2021-03-19",
  canonicalUri: "urn:de:fim:codeliste:gesetzlichervertreter",
  canonicalVersionUri: "urn:de:fim:codeliste:gesetzlichervertreter_2021-03-19",
  longName: "",
  shortName: "Gesetzlicher Vertreter",
};

export type GesetzlicherVertreterValue = "001" | "002" | "003";

export const GesetzlicherVertreterVariants: Record<
  GesetzlicherVertreterValue,
  string
> = {
  "001": "Nein.",
  "002": "Ja, durch eine gesetzliche Vertretung (natürliche Person).",
  "003": "Ja, durch eine gesetzliche Vertretung (juristische Person).",
};
