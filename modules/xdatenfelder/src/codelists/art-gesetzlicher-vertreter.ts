export const MetaData = {
  id: "C60000040",
  version: "1",
  canonicalUri: "urn:xoev-de:xunternehmen:codeliste:artgesetzlichervertreter",
  canonicalVersionUri:
    "urn:xoev-de:xunternehmen:codeliste:artgesetzlichervertreter_1",
  longName: "Art des gesetzlichen Vertreters",
  shortName: "artgesetzlichervertreter",
};

export type Value =
  | "1"
  | "101"
  | "102"
  | "103"
  | "104"
  | "105"
  | "106"
  | "107"
  | "108"
  | "109"
  | "110"
  | "2"
  | "3"
  | "4";

export const Variants: Record<Value, string> = {
  "1": "Sonstiger oder nicht näher spezifizierter gesetzlicher Vertreter",
  "101": "Liquidator",
  "102": "Insolvenzverwalter / Konkursverwalter",
  "103": "Treuhänder nach § 313 InsO",
  "104": "Zwangsverwalter",
  "105": "Gesamtrechtsnachfolger",
  "106": "Rechtsnachfolger",
  "107": "Testamentsvollstrecker",
  "108": "Vermögensverwalter",
  "109": "Nachlassverwalter",
  "110": "Nachlasspfleger",
  "2": "Geschäftsführer § 35 GmbHG",
  "3": "Vorstand",
  "4": "Gesetzlicher Vertreter trotz Volljährigkeit",
};
