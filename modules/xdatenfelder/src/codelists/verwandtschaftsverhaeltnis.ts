export const VerwandtschaftsverhaeltnisMetaData = {
  id: "C60000009",
  version: "2020-08-17",
  canonicalUri: "urn:de:fim:codeliste:verwandtschaftsverhältnis",
  canonicalVersionUri:
    "urn:de:fim:codeliste:verwandtschaftsverhältnis_2020-08-17",
  longName: "",
  shortName: "Verwandtschaftsverhältnis",
};

export type VerwandtschaftsverhaeltnisValue =
  | "001"
  | "002"
  | "003"
  | "004"
  | "005"
  | "006"
  | "007"
  | "008"
  | "009"
  | "010"
  | "011"
  | "012"
  | "013"
  | "014"
  | "015"
  | "016"
  | "017"
  | "018"
  | "019"
  | "020"
  | "999";

export const VerwandtschaftsverhaeltnisVariants: Record<
  VerwandtschaftsverhaeltnisValue,
  string
> = {
  "001": "Ehegatte / Ehegattin",
  "002": "Lebenspartner / Lebenspartnerin",
  "003":
    "andere Person, die mit der wohngeldberechtigten Person in einer Verantwortungs- und Einstehensgemeinschaft lebt",
  "004": "Großvater / Großmutter",
  "005": "Vater / Mutter",
  "006": "Kind",
  "007": "Enkelkind",
  "008": "Bruder / Schwester",
  "009": "Onkel / Tante",
  "010": "Neffe / Nichte",
  "011": "Schwiegervater / Schwiegermutter",
  "012": "Schwiegersohn / Schwiegertochter",
  "013": "Stiefvater / Stiefmutter",
  "014": "Stiefkind",
  "015": "Schwager / Schwägerin",
  "016": "Neffe oder Nichte des Ehegatten / der Ehegattin",
  "017": "Neffe oder Nichte des Lebenspartners / der Lebenspartnerin",
  "018": "Pflegekind (ohne Rücksicht auf das Alter)",
  "019": "Pflegevater / Pflegemutter",
  "020": "Kein Verwandtschaftsverhältnis",
  "999": "Sonstiges",
};
