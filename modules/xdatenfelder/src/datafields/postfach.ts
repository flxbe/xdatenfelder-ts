import { DataFieldMetaData } from "../base";

export class Postfach {
  public static Meta: DataFieldMetaData = {
    id: "F60000249",
    version: "1.1",
    name: "Postfach",
    bezeichnungEingabe: "Postfach",
    bezeichnungAusgabe: "Postfach",
    hilfetextEingabe:
      "Geben Sie die Nummer oder Zeichenkette des Postfachs an. Das wird manchmal Postfachnummer genannt.",
    hilfetextAusgabe: "Identifikation des Postfachs",
  };

  private _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  public static fromString(value: string): Postfach {
    if (Postfach.isValid(value)) {
      return new Postfach(value);
    } else {
      throw "Wrong";
    }
  }

  public static isValid(value: string): boolean {
    if (value.length < 1) {
      return false;
    } else if (value.length > 21) {
      return false;
    } else {
      return true;
    }
  }
}
