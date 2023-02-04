import { open } from "node:fs/promises";

export const CODE_LIST_IDENTIFIER_TO_LABEL: Record<string, string> = {
  C60000001: "Familienstand",
  C60000006: "AnschriftInlandOderAusland",
  C60000008: "Identifikationsdokumente",
  C60000009: "Verwandtschaftsverhaeltnis",
  C60000010: "GesetzlicherVertreter",
  C60000014: "Bundesland",
  C60000018: "Geschlecht",
  C60000019: "Staatsangehoerigkeit",
  C60000020: "Staat",
  C60000023: "ArtGesellschafterPersonengesellschaft",
  C60000025: "RechtsformGaengig",
  C60000027: "Registergerichte",
  C60000028: "IndustrieUndHandelskammer",
  C60000029: "Handwerkskammer",
  C60000030: "GesetzlicherVertreterBevollmaechtigter",
  C60000031: "Augenfarbe",
  C60000035: "ArtNiederlassung",
  C60000036: "ArtAnschrift",
  C60000037: "klassifikationKommunikation",
  C60000038: "ArtEintragung",
  C60000040: "ArtGesetzlicherVertreter",
  C60000042: "Rechtsform",
};

export const DATA_FIELD_IDENTIFIER_TO_LABEL: Record<string, string> = {
  F60000235: "Geburtsland",
  F60000236: "Staatsangehoerigkeit",
  F60000237: "HerausgebenderStaat",
  F60000238: "ArtIdentitaetsdokumentInternational",
  F60000261: "Staat",
  F60000263: "AnschriftInlandOderAusland",
  F60000376: "ArtAnschrift",
  F60000332: "Geschlecht",
  F60000275: "Familienstand",
  F60000276: "Verwandschaftsverhaeltnis",
  F60000281: "Augenfarbe",
  F60000286: "SterbeortStaat",
  F60000375: "ArtGesetzlicherVertreter",
  F60000378: "KommunikationKlassifikation",
  F60000352: "VertretungGesetzlicherVertreterOrderBevollmaechtigter",
  F60000339: "Rechtsform",
  F60000347: "ArtEintragung",
  F60000325: "Registergericht",
  F60000374: "Stiftungsverzeichnis",
  F60000342: "ArtGesellschafter",
  F60000346: "RechtsformReduziert",
  F60000363: "ArtBetriebsstaette",
  F60000348: "IndustrieUndHandelskammer",
  F60000349: "Handwerkskammer",
  F60000318: "GesetzlicherVertreter",
};

export function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\W/g, (m) => (/[À-ž]/.test(m) ? m : "-"))
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export async function readFile(filepath: string): Promise<string> {
  const file = await open(filepath, "r");

  try {
    return await file.readFile("utf-8");
  } finally {
    file.close();
  }
}
