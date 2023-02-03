export const MetaData = {
  id: "C60000014",
  version: 2010,
  canonicalUri:
    "urn:de:bund:destatis:bevoelkerungsstatistik:schluessel:bundesland",
  canonicalVersionUri:
    "urn:de:bund:destatis:bevoelkerungsstatistik:schluessel:bundesland_2010-04-01",
  longName:
    "Die deutschen Bundesländer nach dem Gemeindeverzeichnis des Statistischen Bundesamtes",
  shortName: "Bundesland",
};

export type BundeslandValues =
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16";

export const BundeslandVariants: Record<string, string> = {
  "01": "Schleswig-Holstein",
  "02": "Hamburg",
  "03": "Niedersachsen",
  "04": "Bremen",
  "05": "Nordrhein-Westfalen",
  "06": "Hessen",
  "07": "Rheinland-Pfalz",
  "08": "Baden-Württemberg",
  "09": "Bayern",
  "10": "Saarland",
  "11": "Berlin",
  "12": "Brandenburg",
  "13": "Mecklenburg-Vorpommern",
  "14": "Sachsen",
  "15": "Sachsen-Anhalt",
  "16": "Thüringen",
};
