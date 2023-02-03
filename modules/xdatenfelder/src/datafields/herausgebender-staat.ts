import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "./base";
import { Value, Variants, MetaData } from "../codelists/staat";

export class HerausgebenderStaat extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000237",
    version: "1.2",
    name: "Herausgebender Staat",
    definition:
      "Beschreibt das Geschlecht einer Person. Folgende Angaben sind möglich: divers, männlich, weiblich, keine Angabe",
    bezeichnungEingabe: "Staat",
    bezeichnungAusgabe: "Staat",
    hilfetextEingabe:
      "Geben Sie den Namen des Staates bzw. des Landes an, welches das Dokument oder die Urkunde herausgegeben hat.",
    hilfetextAusgabe:
      "Dieses Feld enthält den Namen des Staates bzw. des Landes, welches das Dokument oder die Urkunde herausgegeben hat.",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, HerausgebenderStaat.Variants);
  }

  public static fromString(value: string): HerausgebenderStaat {
    if (HerausgebenderStaat.isValid(value)) {
      return new HerausgebenderStaat(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in HerausgebenderStaat.Variants;
  }
}
