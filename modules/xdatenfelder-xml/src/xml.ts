import { XMLParser } from "fast-xml-parser";

export class XmlArray {
  private data: Array<any>;

  constructor(data: Array<any>) {
    this.data = data;
  }

  public asXmlData(): Array<XmlData> {
    return this.data.map((item) => {
      if (item === undefined) {
        throw `Child with key ${item} does not exist`;
      } else if (typeof item !== "object") {
        throw `Type of child is ${typeof item}, not "object"`;
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
      numberParseOptions: {
        leadingZeros: false,
        hex: false,
        skipLike: /^.*$/,
      },
    });

    const xmlData = parser.parse(data);

    return new XmlData(xmlData);
  }

  public hasChild(key: string): boolean {
    return key in this.data;
  }

  public getChild(key: string): XmlData {
    const child = this.data[key];

    if (child === undefined) {
      throw `Child with key ${key} does not exist`;
    } else if (typeof child !== "object") {
      throw `Type of child is ${typeof child}, not "object"`;
    }

    return new XmlData(child);
  }

  public getString(key: string): string {
    const child = this.data[key];

    if (typeof child === "string") {
      return child;
    } else {
      throw `Type of ${key} is ${typeof child}, expected string`;
    }
  }

  public getArray(key: string): XmlArray {
    const child = this.data[key];

    if (!Array.isArray(child)) {
      throw `Item ${key} is not an array, got: ${child}`;
    } else {
      return new XmlArray(child);
    }
  }

  public print(): void {
    console.log(this.data);
  }
}
