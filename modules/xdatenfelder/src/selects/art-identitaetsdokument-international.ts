import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  IdentifikationsdokumenteValue,
  IdentifikationsdokumenteVariants,
  IdentifikationsdokumenteMetaData,
} from "../codelists/identifikationsdokumente";

export class ArtIdentitaetsdokumentInternational extends SelectDataField<IdentifikationsdokumenteValue> {
  public static Variants = IdentifikationsdokumenteVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000238",
    version: "1.2",
    name: "Art ldentitätsdokument (international)",
    bezeichnungEingabe: "Identitätsdokument",
    bezeichnungAusgabe: "Identitätsdokument",
    hilfetextEingabe:
      "Wählen Sie aus, um welchen Typ von Identitätsdokument es sich handelt. Beachten Sie, dass die Bezeichnung je nach herausgebendem Staat variieren kann (englischsprachige Bezeichnungen sind Personalausweis = identity card, Reisepass = passport, Aufenthaltstitel = residence permit).",
    hilfetextAusgabe: "Identitätsdokument",
  };

  public static CodeListMeta: CodeListMetaData =
    IdentifikationsdokumenteMetaData;

  constructor(value: IdentifikationsdokumenteValue) {
    super(value, ArtIdentitaetsdokumentInternational.Variants);
  }

  public static fromString(value: string): ArtIdentitaetsdokumentInternational {
    if (ArtIdentitaetsdokumentInternational.isValid(value)) {
      return new ArtIdentitaetsdokumentInternational(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is IdentifikationsdokumenteValue {
    return value in ArtIdentitaetsdokumentInternational.Variants;
  }
}
