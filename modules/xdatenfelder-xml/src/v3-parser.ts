import sax from "sax";
import {
  StateParser,
  UnexpectedTagError,
  DuplicateTagError,
  MissingChildNodeError,
  InternalParserError,
  Value,
  State,
  NoOpState,
  CodeNodeState,
  ValueNodeState,
  OptionalValueNodeState,
  expectTag,
  FinishFn,
  Context,
} from "./sax";
import { DataGroup, DataField, Rule, ChildRef } from "./schema-3";

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
  private createdAt: Value<string> = new Value("xdf:erstellungszeitpunkt");

  constructor(parent: State, value: Value<[string, Date]>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:nachrichtID":
        return new ValueNodeState(this, this.messageId);
      case "xdf:erstellungszeitpunkt":
        return new ValueNodeState(this, this.createdAt);
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

class DataGroupState extends State {
  private parent: State;
  private onFinish: FinishFn<DataGroup>;

  private identification: Value<[string, string]> = new Value(
    "xdf:identifikation"
  );
  private name: Value<string> = new Value("xdf:name");
  private description: Value<string | undefined> = new Value(
    "xdf:beschreibung"
  );
  private definition: Value<string | undefined> = new Value("xdf:definition");
  private releaseState: Value<string> = new Value("xdf:freigabestatus");
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
        return new IdentificationState(this, this.identification);
      case "xdf:name":
        return new ValueNodeState(this, this.name);
      case "xdf:beschreibung":
        return new OptionalValueNodeState(this, this.description);
      case "xdf:definition":
        return new OptionalValueNodeState(this, this.definition);
      case "xdf:freigabestatus":
        return new CodeNodeState(this, this.releaseState);
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
      case "xdf:bezug":
      case "xdf:statusGesetztAm":
      case "xdf:statusGesetztDurch":
      case "xdf:versionshinweis":
      case "xdf:veroeffentlichungsdatum":
      case "xdf:letzteAenderung":
      case "xdf:bezeichnungEingabe":
      case "xdf:bezeichnungAusgabe":
      case "xdf:schemaelementart":
      case "xdf:hilfetextEingabe":
      case "xdf:hilfetextAusgabe":
        return new NoOpState(this);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:datenfeldgruppe");

    const [identifier, version] = this.identification.unwrap();
    const name = this.name.unwrap();
    const description = this.description.get();
    const definition = this.definition.get();
    const releaseState = this.releaseState.unwrap();

    const dataGroup = {
      identifier,
      version,
      name,
      description,
      definition,
      releaseState,
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
        return new ValueNodeState(this, this.name);
      case "xdf:beschreibung":
        return new OptionalValueNodeState(this, this.description);
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
        return new ValueNodeState(this, this.identifier);
      case "xdf:version":
        return new ValueNodeState(this, this.version);
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
    this.stateParser = new StateParser(new RootState());
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
