import { XMLParser } from "fast-xml-parser";

class XmlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XmlError";
  }
}

export class XmlArray {
  private data: Array<any>;

  constructor(data: Array<any>) {
    this.data = data;
  }

  public asXmlData(): Array<XmlData> {
    return this.data.map((item) => {
      if (item === undefined) {
        throw new XmlError(`Child with key ${item} does not exist`);
      } else if (typeof item !== "object") {
        throw new XmlError(`Type of is ${typeof item}, not "object"`);
      }

      return new XmlData(item);
    });
  }

  public print(): void {
    console.log(this.data);
  }
}

export class XmlData {
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  public static fromString(data: string): XmlData {
    const parser = new XMLParser({
      ignoreAttributes: false,
      numberParseOptions: {
        leadingZeros: false,
        hex: false,
        skipLike: /^.*$/,
      },
    });

    const xmlData = parser.parse(data);

    return new XmlData(xmlData);
  }

  public hasKey(key: string): boolean {
    return key in this.data;
  }

  public getChild(key: string): XmlData {
    const child = this.data[key];

    if (child === undefined) {
      throw new XmlError(`Cannot find expected element ${key}`);
    } else if (typeof child !== "object") {
      throw new XmlError(
        `Type of child '${key}' is ${typeof child}, not "object"`
      );
    }

    return new XmlData(child);
  }

  public getString(key: string): string {
    const child = this.data[key];

    if (typeof child === "string" && child !== "") {
      return child;
    } else {
      throw `Value of ${key} must be a non-empty string`;
    }
  }

  public getOptionalString(key: string): string | undefined {
    const child = this.data[key];

    if (child === undefined || child === "") {
      return undefined;
    } else if (typeof child === "string") {
      return child;
    } else {
      throw new XmlError(
        `Type of ${key} is ${typeof child}, expected optional string`
      );
    }
  }

  public getOptionalInt(key: string): number | undefined {
    const child = this.data[key];

    if (child === undefined) {
      return undefined;
    } else {
      return parseInt(child);
    }
  }

  public getDate(key: string): Date {
    const data = this.getString(key);

    return new Date(data);
  }

  public getArray(key: string): XmlArray {
    const child = this.data[key];

    if (child === undefined) {
      return new XmlArray([]);
    } else if (typeof child !== "object") {
      throw new XmlError(`Item ${key} is not an array, got: ${child}`);
    } else if (!Array.isArray(child)) {
      // If an array has only length one, the parser interprets it as an object. So manually create the array.
      return new XmlArray([child]);
    } else {
      return new XmlArray(child);
    }
  }

  public print(): void {
    console.log(this.data);
  }
}
