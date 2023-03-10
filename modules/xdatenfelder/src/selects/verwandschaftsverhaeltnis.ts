import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  VerwandtschaftsverhaeltnisValue,
  VerwandtschaftsverhaeltnisVariants,
  VerwandtschaftsverhaeltnisMetaData,
} from "../codelists/verwandtschaftsverhaeltnis";

export class Verwandschaftsverhaeltnis extends SelectDataField<VerwandtschaftsverhaeltnisValue> {
  public static Variants = VerwandtschaftsverhaeltnisVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000276",
    version: "1.1",
    name: "Verwandtschaftsverhältnis",
    bezeichnungEingabe: "Verwandtschaftsverhältnis",
    bezeichnungAusgabe: "Verwandtschaftsverhältnis",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Verwandtschaftsverhältnis",
  };

  public static CodeListMeta: CodeListMetaData =
    VerwandtschaftsverhaeltnisMetaData;

  constructor(value: VerwandtschaftsverhaeltnisValue) {
    super(value, Verwandschaftsverhaeltnis.Variants);
  }

  public static fromString(value: string): Verwandschaftsverhaeltnis {
    if (Verwandschaftsverhaeltnis.isValid(value)) {
      return new Verwandschaftsverhaeltnis(value);
    }

    throw "Wrong value";
  }

  public static isValid(
    value: string
  ): value is VerwandtschaftsverhaeltnisValue {
    return value in Verwandschaftsverhaeltnis.Variants;
  }
}
