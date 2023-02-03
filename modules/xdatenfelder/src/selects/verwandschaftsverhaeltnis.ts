import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  Value,
  Variants,
  MetaData,
} from "../codelists/verwandtschaftsverhaeltnis";

export class Verwandschaftsverhaeltnis extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000276",
    version: "1.1",
    name: "Verwandtschaftsverhältnis",
    bezeichnungEingabe: "Verwandtschaftsverhältnis",
    bezeichnungAusgabe: "Verwandtschaftsverhältnis",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Verwandtschaftsverhältnis",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, Verwandschaftsverhaeltnis.Variants);
  }

  public static fromString(value: string): Verwandschaftsverhaeltnis {
    if (Verwandschaftsverhaeltnis.isValid(value)) {
      return new Verwandschaftsverhaeltnis(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in Verwandschaftsverhaeltnis.Variants;
  }
}
