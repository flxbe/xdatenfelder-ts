import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  BundeslandValue,
  BundeslandVariants,
  BundeslandMetaData,
} from "../codelists/bundesland";

export class Stiftungsverzeichnis extends SelectDataField<BundeslandValue> {
  public static Variants = BundeslandVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000374",
    version: "1.0",
    name: "Stiftungsverzeichnis",
    bezeichnungEingabe: "Bundesland des Stiftungsregistereintrags",
    bezeichnungAusgabe: "Bundesland des Stiftungsregistereintrags",
    hilfetextEingabe:
      "Bei Einträgen im Stiftungsverzeichnis: Angabe des Bundeslandes bzw. der Behörde, indessen oder deren Stiftungsverzeichnis der Eintrag geführt wird.",
    hilfetextAusgabe: "Bundesland des Stiftungsregistereintrags",
  };

  public static CodeListMeta: CodeListMetaData = BundeslandMetaData;

  constructor(value: BundeslandValue) {
    super(value, Stiftungsverzeichnis.Variants);
  }

  public static fromString(value: string): Stiftungsverzeichnis {
    if (Stiftungsverzeichnis.isValid(value)) {
      return new Stiftungsverzeichnis(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is BundeslandValue {
    return value in Stiftungsverzeichnis.Variants;
  }
}
