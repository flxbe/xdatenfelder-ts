export const MetaData = {
  id: "C60000030",
  version: 2021,
  canonicalUri: "urn:de:fim:codeliste:gesetzlicher-vertreter-bevollmaechtigter",
  canonicalVersionUri:
    "urn:de:fim:codeliste:gesetzlicher-vertreter-bevollmaechtigter_2021-06-18",
  longName: "",
  shortName: "",
};

export type GesetzlicherVertreterBevollmaechtigterValues =
  | "001"
  | "002"
  | "003"
  | "004"
  | "005";

export const GesetzlicherVertreterBevollmaechtigterVariants: Record<
  string,
  string
> = {
  "001": "Nein.",
  "002": "Ja, durch eine gesetzliche Vertretung (natürliche Person).",
  "003": "Ja, durch eine gesetzliche Vertretung (juristische Person).",
  "004": "Ja, durch eine bevollmächtigte Person (natürliche Person).",
  "005": "Ja, durch eine bevollmächtigte Person (juristische Person).",
};
