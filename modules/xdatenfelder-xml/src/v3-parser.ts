import sax from "sax";
import {
  StateParser,
  Value,
  State,
  NoOpState,
  ValueNodeState,
  OptionalValueNodeState,
  CodeNodeState,
  StringNodeState,
  OptionalStringNodeState,
  expectTag,
  FinishFn,
  Context,
} from "./sax";
import {
  UnexpectedTagError,
  DuplicateTagError,
  MissingChildNodeError,
  InternalParserError,
} from "./errors";
import {
  DataGroup,
  DataField,
  Rule,
  ChildRef,
  parseFreigabeStatus,
  parseDate,
  FreigabeStatus,
  SchemaElementArt,
  ElementData,
  parseSchemaElementArt,
} from "./schema-3";

class RootState extends State {
  public value: Value<DataGroupMessage3> = new Value(
    "xdf:xdatenfelder.datenfeldgruppe.0103"
  );

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    expectTag(tag.name, "xdf:xdatenfelder.datenfeldgruppe.0103");

    return new MessageState(this, this.value);
  }

  public onCloseTag(tagName: string): State {
    throw new Error("Should not be called.");
  }
}

class MessageState extends State {
  private parent: State;
  private value: Value<DataGroupMessage3>;

  private header: Value<[string, Date]> = new Value("xdf:header");
  private rootDataGroup: Value<string> = new Value("xdf:datenfeldgruppe");

  constructor(parent: State, value: Value<DataGroupMessage3>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag, context: Context): State {
    switch (tag.name) {
      case "xdf:header":
        return new HeaderState(this, this.header);
      case "xdf:datenfeldgruppe":
        return new DataGroupState(this, (dataGroup) => {
          context.dataGroups[dataGroup.identifier] = dataGroup;
          this.rootDataGroup.set(dataGroup.identifier);
        });
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string, context: Context): State {
    expectTag(tagName, "xdf:xdatenfelder.datenfeldgruppe.0103");

    const [messageId, createdAt] = this.header.unwrap();
    const rootDataGroup = this.rootDataGroup.unwrap();

    this.value.set(
      new DataGroupMessage3(
        messageId,
        createdAt,
        rootDataGroup,
        context.dataGroups,
        context.dataFields,
        context.rules
      )
    );

    return this.parent;
  }
}

class HeaderState extends State {
  private parent: State;
  private value: Value<[string, Date]>;

  private messageId: Value<string> = new Value("xdf:nachrichtID");
  private createdAt: Value<Date> = new Value("xdf:erstellungszeitpunkt");

  constructor(parent: State, value: Value<[string, Date]>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:nachrichtID":
        return new StringNodeState(this, this.messageId);
      case "xdf:erstellungszeitpunkt":
        return new ValueNodeState(this, this.createdAt, parseDate);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:header");

    const messageId = this.messageId.unwrap();
    const createdAt = new Date(this.createdAt.unwrap());

    this.value.set([messageId, createdAt]);

    return this.parent;
  }
}

interface BaseContainer {
  identification: Value<[string, string]>;
  name: Value<string>;
  description: Value<string | undefined>;
  definition: Value<string | undefined>;
  releaseState: Value<FreigabeStatus>;
  stateSetAt: Value<Date | undefined>;
  stateSetBy: Value<string | undefined>;
  validSince: Value<Date | undefined>;
  validUntil: Value<Date | undefined>;
  versionHint: Value<string | undefined>;
  publishedAt: Value<Date | undefined>;
  lastChangedAt: Value<Date>;
}

interface ElementContainer extends BaseContainer {
  inputLabel: Value<string>;
  outputLabel: Value<string | undefined>;
  elementType: Value<SchemaElementArt>;
  inputHelp: Value<string | undefined>;
  outputHelp: Value<string | undefined>;
}

function createElementContainer(): ElementContainer {
  return {
    identification: new Value("xdf:identifikation"),
    name: new Value("xdf:name"),
    description: new Value("xdf:beschreibung"),
    definition: new Value("xdf:definition"),
    releaseState: new Value("xdf:freigabestatus"),
    stateSetAt: new Value("xdf:statusGesetztAm"),
    stateSetBy: new Value("xdf:statusGesetztDurch"),
    validSince: new Value("xdf:gueltigAb"),
    validUntil: new Value("xdf:gueltigBis"),
    versionHint: new Value("xdf:versionshinweis"),
    publishedAt: new Value("xdf:veroeffentlichungsdatum"),
    lastChangedAt: new Value("xdf:letzteAenderung"),
    inputLabel: new Value("xdf:bezeichnungEingabe"),
    outputLabel: new Value("xdf:bezeichnungAusgabe"),
    elementType: new Value("xdf:schemaelementart"),
    inputHelp: new Value("xdf:hilfetextEingabe"),
    outputHelp: new Value("xdf:hilfetextAusgabe"),
  };
}

function parseElementData(container: ElementContainer): ElementData {
  const [identifier, version] = container.identification.unwrap();

  return {
    identifier,
    version,
    name: container.name.unwrap(),
    description: container.description.get(),
    definition: container.definition.get(),
    releaseState: container.releaseState.unwrap(),
    stateSetAt: container.stateSetAt.get(),
    stateSetBy: container.stateSetBy.get(),
    validSince: container.validSince.get(),
    validUntil: container.validUntil.get(),
    versionHint: container.versionHint.get(),
    publishedAt: container.publishedAt.get(),
    lastChangedAt: container.lastChangedAt.unwrap(),
    inputLabel: container.inputLabel.unwrap(),
    outputLabel: container.outputLabel.get(),
    elementType: container.elementType.unwrap(),
    inputHelp: container.inputHelp.get(),
    outputHelp: container.outputHelp.get(),
  };
}

class DataGroupState extends State {
  private parent: State;
  private onFinish: FinishFn<DataGroup>;

  private elementContainer = createElementContainer();
  private ruleRefs: string[] = [];
  private children: ChildRef[] = [];

  constructor(parent: State, onFinish: FinishFn<DataGroup>) {
    super();

    this.parent = parent;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag, context: Context): State {
    switch (tag.name) {
      case "xdf:identifikation":
        return new IdentificationState(
          this,
          this.elementContainer.identification
        );
      case "xdf:name":
        return new StringNodeState(this, this.elementContainer.name);
      case "xdf:beschreibung":
        return new OptionalStringNodeState(
          this,
          this.elementContainer.description
        );
      case "xdf:definition":
        return new OptionalStringNodeState(
          this,
          this.elementContainer.definition
        );
      case "xdf:freigabestatus":
        return new CodeNodeState(
          this,
          this.elementContainer.releaseState,
          parseFreigabeStatus
        );
      case "xdf:regel":
        return new RuleState(this, (rule) => {
          context.rules[rule.identifier] = rule;
          this.ruleRefs.push(rule.identifier);
        });
      case "xdf:struktur":
        return new StructureState(this, (child) => {
          if (child.type === "dataGroup") {
            const { dataGroup } = child;
            context.dataGroups[dataGroup.identifier] = dataGroup;
            this.children.push({
              type: "dataGroup",
              identifier: dataGroup.identifier,
            });
          } else {
            // TODO: Parse datafield
          }
        });
      case "xdf:statusGesetztAm":
        return new OptionalValueNodeState(
          this,
          this.elementContainer.stateSetAt,
          parseDate
        );
      case "xdf:statusGesetztDurch":
        return new OptionalStringNodeState(
          this,
          this.elementContainer.stateSetBy
        );
      case "xdf:bezug":
        return new NoOpState(this);
      case "xdf:versionshinweis":
        return new OptionalStringNodeState(
          this,
          this.elementContainer.versionHint
        );
      case "xdf:veroeffentlichungsdatum":
        return new OptionalValueNodeState(
          this,
          this.elementContainer.publishedAt,
          parseDate
        );

      case "xdf:schemaelementart":
        return new CodeNodeState(
          this,
          this.elementContainer.elementType,
          parseSchemaElementArt
        );
      case "xdf:bezeichnungEingabe":
        return new StringNodeState(this, this.elementContainer.inputLabel);
      case "xdf:bezeichnungAusgabe":
        return new OptionalStringNodeState(
          this,
          this.elementContainer.outputLabel
        );
      case "xdf:hilfetextEingabe":
        return new OptionalStringNodeState(
          this,
          this.elementContainer.inputHelp
        );
      case "xdf:hilfetextAusgabe":
        return new OptionalStringNodeState(
          this,
          this.elementContainer.outputHelp
        );
      case "xdf:letzteAenderung":
        return new ValueNodeState(
          this,
          this.elementContainer.lastChangedAt,
          parseDate
        );
      case "xdf:gueltigAb":
        return new ValueNodeState(
          this,
          this.elementContainer.validSince,
          parseDate
        );
      case "xdf:gueltigBis":
        return new ValueNodeState(
          this,
          this.elementContainer.validUntil,
          parseDate
        );
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:datenfeldgruppe");

    const data = parseElementData(this.elementContainer);

    const dataGroup = {
      ...data,
      rules: this.ruleRefs,
      children: this.children,
    };
    this.onFinish(dataGroup);

    return this.parent;
  }
}

type Child =
  | { type: "dataGroup"; dataGroup: DataGroup }
  | { type: "dataField" };

class StructureState extends State {
  private parent: State;
  private onFinish: FinishFn<Child>;

  private value: Value<Child> = new Value("xdf:enthaelt");

  constructor(parent: State, onFinish: FinishFn<Child>) {
    super();

    this.parent = parent;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag, _context: Context): State {
    switch (tag.name) {
      case "xdf:anzahl":
      case "xdf:bezug":
        return new NoOpState(this);
      case "xdf:enthaelt":
        return new ContainsState(this, this.value);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string, _context: Context): State {
    expectTag(tagName, "xdf:struktur");

    const child = this.value.unwrap();
    this.onFinish(child);

    return this.parent;
  }
}

class ContainsState extends State {
  private parent: State;
  private parentValue: Value<Child>;

  private value?: Child = undefined;

  constructor(parent: State, value: Value<Child>) {
    super();

    this.parent = parent;
    this.parentValue = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag, _context: Context): State {
    if (this.value !== undefined) {
      throw new DuplicateTagError("xdf:datenfeld | xdf:datenfeldgruppe");
    }

    switch (tag.name) {
      case "xdf:datenfeldgruppe":
        return new DataGroupState(this, (dataGroup) => {
          this.value = { type: "dataGroup", dataGroup };
        });
      case "xdf:datenfeld":
        this.value = { type: "dataField" };
        return new NoOpState(this);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }
  public onCloseTag(tagName: string, _context: Context): State {
    expectTag(tagName, "xdf:enthaelt");

    if (this.value === undefined) {
      throw new MissingChildNodeError("xdf:datenfeld | xdf:datenfeldgruppe");
    }

    this.parentValue.set(this.value);

    return this.parent;
  }
}

class RuleState extends State {
  private parent: State;
  private onFinish: FinishFn<Rule>;

  private identification: Value<[string, string]> = new Value(
    "xdf:identifikation"
  );
  private name: Value<string> = new Value("xdf:name");
  private description: Value<string | undefined> = new Value(
    "xdf:beschreibung"
  );

  constructor(parent: State, onFinish: FinishFn<Rule>) {
    super();

    this.parent = parent;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:identifikation":
        return new IdentificationState(this, this.identification);
      case "xdf:name":
        return new StringNodeState(this, this.name);
      case "xdf:beschreibung":
        return new OptionalStringNodeState(this, this.description);
      case "xdf:freitextRegel":
      case "xdf:bezug":
      case "xdf:fachlicherErsteller":
      case "xdf:letzteAenderung":
      case "xdf:typ":
      case "xdf:skript":
        return new NoOpState(this);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:regel");

    const [identifier, version] = this.identification.unwrap();
    const name = this.name.unwrap();
    const description = this.description.get();

    const rule = {
      identifier,
      version,
      name,
      description,
    };

    this.onFinish(rule);

    return this.parent;
  }
}

class IdentificationState extends State {
  private parent: State;
  private value: Value<[string, string]>;

  private identifier: Value<string> = new Value("xdf:id");
  private version: Value<string> = new Value("xdf:version");

  constructor(parent: State, value: Value<[string, string]>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:id":
        return new StringNodeState(this, this.identifier);
      case "xdf:version":
        return new StringNodeState(this, this.version);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:identifikation");

    const identifier = this.identifier.unwrap();
    const version = this.version.unwrap();
    this.value.set([identifier, version]);

    return this.parent;
  }
}

class DataGroupMessageParser {
  private stateParser: StateParser;

  constructor() {
    this.stateParser = new StateParser(
      new RootState(),
      "urn:xoev-de:fim:standard:xdatenfelder_3.0.0"
    );
  }

  public write(data: string) {
    this.stateParser.write(data);
  }

  public finish(): DataGroupMessage3 {
    const state = this.stateParser.finish();

    if (!(state instanceof RootState)) {
      throw new InternalParserError("Unexpected EOF");
    }

    return state.value.unwrap();
  }
}

export class DataGroupMessage3 {
  public id: string;
  public createdAt: Date;

  public rootDataGroup: string;
  public dataGroups: Record<string, DataGroup>;
  public dataFields: Record<string, DataField>;
  public rules: Record<string, Rule>;

  constructor(
    id: string,
    createdAt: Date,
    rootDataGroup: string,
    dataGroups: Record<string, DataGroup>,
    dataFields: Record<string, DataField>,
    rules: Record<string, Rule>
  ) {
    this.id = id;
    this.createdAt = createdAt;
    this.rootDataGroup = rootDataGroup;
    this.dataFields = dataFields;
    this.dataGroups = dataGroups;
    this.rules = rules;
  }

  public static fromString(value: string): DataGroupMessage3 {
    const parser = new DataGroupMessageParser();
    parser.write(value);

    return parser.finish();
  }
}
