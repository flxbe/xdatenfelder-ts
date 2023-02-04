import { XmlData } from "./xml";
import { assert } from "./util";

export class CodeListItem {
  public code: string;
  public label: string;

  constructor(code: string, label: string) {
    this.code = code;
    this.label = label;
  }
}

export class CodeList {
  public identifier: string;

  public shortName: string;
  public longName: string;
  public version: string;
  public canonicalUri: string;
  public canonicalVersionUri: string;

  public items: Array<CodeListItem>;

  constructor(
    identifier: string,
    shortName: string,
    longName: string,
    version: string,
    canonicalUri: string,
    canonicalVersionUri: string,
    items: Array<CodeListItem>
  ) {
    this.identifier = identifier;

    this.shortName = shortName;
    this.longName = longName;
    this.version = version;
    this.canonicalUri = canonicalUri;
    this.canonicalVersionUri = canonicalVersionUri;

    this.items = items;
  }

  public static fromString(stringData: string, identifier: string): CodeList {
    const data = XmlData.fromString(stringData);

    const codeList = data.getChild("CodeList");
    const identification = codeList.getChild("Identification");
    const shortName = identification.getString("ShortName");
    const longName = identification.getString("LongName");
    const version = identification.getString("Version");
    const canonicalUri = identification.getString("CanonicalUri");
    const canonicalVersionUri = identification.getString("CanonicalVersionUri");

    const items = codeList
      .getChild("SimpleCodeList")
      .getArray("Row")
      .asXmlData()
      .map((row) => {
        const values = row.getArray("Value").asXmlData();
        assert(values.length >= 2);

        const [codeData, labelData, ..._] = values;
        assert(codeData !== undefined);
        assert(labelData !== undefined);

        const code = codeData.getString("SimpleValue");
        const label = labelData.getString("SimpleValue");

        return new CodeListItem(code, label);
      });

    return new CodeList(
      identifier,
      shortName,
      longName,
      version,
      canonicalUri,
      canonicalVersionUri,
      items
    );
  }
}
