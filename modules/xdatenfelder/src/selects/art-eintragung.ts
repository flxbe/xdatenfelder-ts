import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  ArtEintragungValue,
  ArtEintragungVariants,
  ArtEintragungMetaData,
} from "../codelists/art-eintragung";

export class ArtEintragung extends SelectDataField<ArtEintragungValue> {
  public static Variants = ArtEintragungVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000347",
    version: "2.1",
    name: "Eintragung Art / Register Art (XUnternehmen)",
    bezeichnungEingabe: "Art der Eintragung oder des Registers",
    bezeichnungAusgabe: "Art der Eintragung oder des Registers",
    hilfetextEingabe:
      "Geben Sie an, um welche Art von Eintrag es sich handelt.",
    hilfetextAusgabe: "Art der Eintragung oder des Registers",
  };

  public static CodeListMeta: CodeListMetaData = ArtEintragungMetaData;

  constructor(value: ArtEintragungValue) {
    super(value, ArtEintragung.Variants);
  }

  public static fromString(value: string): ArtEintragung {
    if (ArtEintragung.isValid(value)) {
      return new ArtEintragung(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is ArtEintragungValue {
    return value in ArtEintragung.Variants;
  }
}
