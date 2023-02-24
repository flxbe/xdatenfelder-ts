import sax from "sax";

class ParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParserError";
  }
}

class UnexpectedTagError extends ParserError {
  constructor(got: string, expected: string | undefined = undefined) {
    if (expected === undefined) {
      super(`Unexpected Tag: ${got}`);
    } else {
      super(`Expected "${expected}", got: ${got}`);
    }

    this.name = "UnexpectedTagError";
  }
}

class MissingChildNodeError extends ParserError {
  constructor(name: string) {
    super(`Missing child node: ${name}`);
    this.name = "MissingChildNodeError";
  }
}

class MissingContentError extends ParserError {
  constructor(parentName: string) {
    super(`Missing content in node ${parentName}`);
    this.name = "MissingContentError";
  }
}

class DuplicateTagError extends ParserError {
  constructor(tagName: string) {
    super(`Duplicate <${tagName}>`);
    this.name = "DuplicateTagError";
  }
}

class Value<T> {
  private content:
    | { filled: false; value: undefined }
    | { filled: true; value: T };

  public readonly tagName: string;

  constructor(tagName: string) {
    this.tagName = tagName;
    this.content = { filled: false, value: undefined };
  }

  public set(value: T) {
    if (this.content.filled) {
      throw new DuplicateTagError(this.tagName);
    }

    this.content = { filled: true, value };
  }

  public get(): T | undefined {
    return this.content.value;
  }

  public unwrap(): T {
    if (!this.content.filled) {
      throw new MissingChildNodeError(this.tagName);
    }

    return this.content.value;
  }
}

type FinishFn<T> = (value: T) => void;

function expectTag(got: string, expected: string) {
  if (got !== expected) {
    throw new ParserError(`Expect "${expected}", got: ${got}`);
  }
}

abstract class State {
  public onText(text: string): void {
    throw new ParserError(`Got unexpected text block: ${text}`);
  }

  public abstract onOpenTag(tag: sax.QualifiedTag | sax.Tag): State;

  public abstract onCloseTag(tagName: string): State;
}

class ValueNodeState extends State {
  private parent: State;
  private value: Value<string>;

  constructor(parent: State, value: Value<string>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onText(text: string) {
    this.value.set(text);
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    throw new UnexpectedTagError(tag.name, "<None>");
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, this.value.tagName);

    return this.parent;
  }
}

class OptionalValueNodeState extends State {
  private parent: State;
  private value: Value<string | undefined>;

  constructor(parent: State, value: Value<string | undefined>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onText(text: string) {
    this.value.set(text);
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    throw new UnexpectedTagError(tag.name, "<None>");
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, this.value.tagName);

    return this.parent;
  }
}

class CodeNodeState extends State {
  private parent: State;

  private value: Value<string>;
  private childValue: Value<string> = new Value("code");

  constructor(parent: State, value: Value<string>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    expectTag(tag.name, "code");

    return new ValueNodeState(this, this.childValue);
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, this.value.tagName);

    const value = this.childValue.unwrap();
    this.value.set(value);

    return this.parent;
  }
}

class NoOpState extends State {
  private parent: State;

  constructor(parent: State) {
    super();
    this.parent = parent;
  }

  public onText(text: string) {}

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): NoOpState {
    return new NoOpState(this);
  }

  public onCloseTag(tagName: string): State {
    return this.parent;
  }
}

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
  private dataGroups: Record<string, DataGroup> = {};
  private dataFields: Record<string, DataField> = {};
  private rules: Record<string, Rule> = {};

  constructor(parent: State, value: Value<DataGroupMessage3>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:header":
        return new HeaderState(this, this.header);
      case "xdf:datenfeldgruppe":
        return new DataGroupState(
          this,
          this.dataGroups,
          this.dataFields,
          this.rules,
          (dataGroup) => {
            this.dataGroups[dataGroup.identifier] = dataGroup;
            this.rootDataGroup.set(dataGroup.identifier);
          }
        );
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:xdatenfelder.datenfeldgruppe.0103");

    const [messageId, createdAt] = this.header.unwrap();
    const rootDataGroup = this.rootDataGroup.unwrap();

    // todo: actually create the message
    this.value.set(
      new DataGroupMessage3(
        messageId,
        createdAt,
        rootDataGroup,
        this.dataGroups,
        this.dataFields,
        this.rules
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

interface ChildRef {
  type: "dataGroup" | "dataField";
  identifier: string;
}

class DataGroupState extends State {
  private parent: State;
  private dataGroups: Record<string, DataGroup>;
  private dataFields: Record<string, DataField>;
  private rules: Record<string, Rule>;
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

  constructor(
    parent: State,
    dataGroups: Record<string, DataGroup>,
    dataFields: Record<string, DataField>,
    rules: Record<string, Rule>,
    onFinish: FinishFn<DataGroup>
  ) {
    super();

    this.parent = parent;

    this.dataGroups = dataGroups;
    this.dataFields = dataFields;
    this.rules = rules;
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
      case "xdf:definition":
        return new OptionalValueNodeState(this, this.definition);
      case "xdf:freigabestatus":
        return new CodeNodeState(this, this.releaseState);
      case "xdf:regel":
        return new RuleState(this, (rule) => {
          this.ruleRefs.push(rule.identifier);
          this.rules[rule.identifier] = rule;
        });
      case "xdf:struktur":
        return new StructureState(
          this,
          this.dataGroups,
          this.dataFields,
          this.rules,
          (child) => {
            if (child.type === "dataGroup") {
              const { dataGroup } = child;
              this.dataGroups[dataGroup.identifier] = dataGroup;
              this.children.push({
                type: "dataGroup",
                identifier: dataGroup.identifier,
              });
            } else {
              console.log("datafield");
            }
          }
        );
      default:
        return new NoOpState(this);
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
  private dataGroups: Record<string, DataGroup>;
  private dataFields: Record<string, DataField>;
  private rules: Record<string, Rule>;
  private onFinish: FinishFn<Child>;

  private value: Value<Child> = new Value("xdf:enthaelt");

  constructor(
    parent: State,
    dataGroups: Record<string, DataGroup>,
    dataFields: Record<string, DataField>,
    rules: Record<string, Rule>,
    onFinish: FinishFn<Child>
  ) {
    super();

    this.parent = parent;
    this.dataGroups = dataGroups;
    this.dataFields = dataFields;
    this.rules = rules;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:anzahl":
      case "xdf:bezug":
        return new NoOpState(this);
      case "xdf:enthaelt":
        return new ContainsState(
          this,
          this.dataGroups,
          this.dataFields,
          this.rules,
          this.value
        );
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:struktur");

    const child = this.value.unwrap();
    this.onFinish(child);

    return this.parent;
  }
}

class ContainsState extends State {
  private parent: State;
  private dataGroups: Record<string, DataGroup>;
  private dataFields: Record<string, DataField>;
  private rules: Record<string, Rule>;
  private parentValue: Value<Child>;

  private value?: Child = undefined;

  constructor(
    parent: State,
    dataGroups: Record<string, DataGroup>,
    dataFields: Record<string, DataField>,
    rules: Record<string, Rule>,
    value: Value<Child>
  ) {
    super();

    this.parent = parent;
    this.dataGroups = dataGroups;
    this.dataFields = dataFields;
    this.rules = rules;
    this.parentValue = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    if (this.value !== undefined) {
      throw new DuplicateTagError("xdf:datenfeld | xdf:datenfeldgruppe");
    }

    switch (tag.name) {
      case "xdf:datenfeldgruppe":
        return new DataGroupState(
          this,
          this.dataGroups,
          this.dataFields,
          this.rules,
          (dataGroup) => {
            this.value = { type: "dataGroup", dataGroup };
          }
        );
      case "xdf:datenfeld":
        this.value = { type: "dataField" };
        return new NoOpState(this);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }
  public onCloseTag(tagName: string): State {
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
      default:
        return new NoOpState(this);
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
    }
    return new NoOpState(this);
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
  private state: State;
  private xmlParser: sax.SAXParser;

  constructor() {
    this.state = new RootState();
    this.xmlParser = sax.parser(true, { trim: true });

    this.xmlParser.onerror = (error) => {
      throw error;
    };

    this.xmlParser.ontext = (text) => {
      this.state.onText(text);
    };
    this.xmlParser.onopentag = (tag) => {
      this.state = this.state.onOpenTag(tag);
    };
    this.xmlParser.onclosetag = (tagName) => {
      this.state = this.state.onCloseTag(tagName);
    };
  }

  public write(data: string) {
    this.xmlParser.write(data);
  }

  public finish(): DataGroupMessage3 {
    this.xmlParser.close();

    if (!(this.state instanceof RootState)) {
      throw new ParserError("Unexpected EOF");
    }

    return this.state.value.unwrap();
  }
}

interface BaseData {
  identifier: string;
  version: string;
  name: string;
  description?: string;
  definition?: string;
  releaseState: string;
}

interface DataGroup extends BaseData {
  rules: string[];
  children: ChildRef[];
}

interface DataField extends BaseData {}

interface Rule {
  identifier: string;
  version: string;
  name: string;
  description?: string;
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
    this.dataGroups = dataGroups;
    this.dataFields = dataFields;
    this.rules = rules;
  }

  public static fromString(value: string): DataGroupMessage3 {
    const parser = new DataGroupMessageParser();
    parser.write(value);

    return parser.finish();
  }
}
