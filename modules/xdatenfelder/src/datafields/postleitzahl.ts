import { DataFieldMetaData } from "./base";

export class Postleitzahl {
  public static Meta: DataFieldMetaData = {
    id: "F60000246",
    version: "1.1",
    name: "Postleitzahl",
    definition:
      "Es ist die Postleitzahl anzugeben. Der Typ dieses Elements ist eine Einschränkung des Basistyps String.Latin.",
    bezeichnungEingabe: "Postleitzahl",
    bezeichnungAusgabe: "Postleitzahl",
    hilfetextEingabe:
      "Geben Sie die Postleitzahl des Ortes an, Beispiel 10115.",
    hilfetextAusgabe: "Dieses Feld enthält die Postleitzahl des Ortes.",
  };

  private static Pattern = /([0]{1}[1-9]{1}|[1-9]{1}[0-9]{1})[0-9]{3}/;

  private _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  public static fromString(value: string): Postleitzahl {
    if (Postleitzahl.isValid(value)) {
      return new Postleitzahl(value);
    } else {
      throw "Wrong";
    }
  }

  public static isValid(value: string): boolean {
    return Postleitzahl.Pattern.test(value);
  }
}
