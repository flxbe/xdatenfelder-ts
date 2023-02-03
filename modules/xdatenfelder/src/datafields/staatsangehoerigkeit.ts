import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "./base";
import { Value, Variants, MetaData } from "../codelists/staatsangehoerigkeit";

export class Staatsangehoerigkeit extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000236",
    version: "1.3",
    name: "Staatsangehörigkeit",
    definition:
      "Die Staatsangehörigkeit beschreibt den/die Staat(en), dem/denen ein Bürger juristisch zugehörig ist (Wahlrecht etc.).",
    bezeichnungEingabe: "Staatsangehörigkeit",
    bezeichnungAusgabe: "Staatsangehörigkeit",
    hilfetextEingabe:
      'Wählen Sie aus, welcher Nationalität bzw. welchen Nationalitäten die Person angehört. Es ist auch die Auswahl "ohne Angabe" möglich, falls die Person keiner Nationalität angehört.',
    hilfetextAusgabe: "Dieses Feld enthält eine Nationalität der Person.",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, Staatsangehoerigkeit.Variants);
  }

  public static fromString(value: string): Staatsangehoerigkeit {
    if (Staatsangehoerigkeit.isValid(value)) {
      return new Staatsangehoerigkeit(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in Staatsangehoerigkeit.Variants;
  }
}
