import sax from "sax";
import {
  BasicData,
  CodeListReference,
  DataField,
  DataGroup,
  ElementReference,
  InputDescription,
  Schema,
  SchemaData,
  Warning,
  Rule,
  SchemaWarnings,
} from "./schema";

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

// TODO: Include parser context in every callback to include line numbers in errors
abstract class State {
  public onText(text: string): void {
    throw new ParserError(`Got unexpected text block: ${text}`);
  }

  public abstract onOpenTag(tag: sax.QualifiedTag | sax.Tag): State;

  public abstract onCloseTag(tagName: string): State;
}

interface ParseResult {
  schema: Schema;
  warnings: SchemaWarnings;
}

class FinishState extends State {
  public readonly result: ParseResult;

  constructor(result: ParseResult) {
    super();
    this.result = result;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    throw new ParserError("This should not happen");
  }

  public onCloseTag(tagName: string): State {
    throw new ParserError("This should not happen");
  }
}

class RootState extends State {
  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): RootSchemaState {
    expectTag(tag.name, "xdf:xdatenfelder.stammdatenschema.0102");

    return new RootSchemaState();
  }

  public onCloseTag(tagName: string): State {
    throw new ParserError("This should not happen");
  }
}

interface SchemaHeader {
  messageId: string;
  createdAt: Date;
}

interface SchemaContent {
  data: SchemaData;
  dataFields: Record<string, DataField>;
  dataGroups: Record<string, DataGroup>;
  rules: Record<string, Rule>;
  warnings: SchemaWarnings;
}

class RootSchemaState extends State {
  public header?: SchemaHeader = undefined;
  public schemaContent?: SchemaContent = undefined;

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    if (tag.name === "xdf:header") {
      return new SchemaHeaderState(this);
    } else if (tag.name === "xdf:stammdatenschema") {
      return new SchemaState(this);
    } else {
      throw new UnexpectedTagError(
        tag.name,
        "xdf:header | xdf:stammdatenschema"
      );
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:xdatenfelder.stammdatenschema.0102");

    if (this.header === undefined) {
      throw new ParserError("Missing <xdf:header> in schema");
    }

    if (this.schemaContent === undefined) {
      throw new ParserError(`Missing <xdf:stammdatenschema> block`);
    }

    const schema = new Schema(
      this.header.messageId,
      this.header.createdAt,
      this.schemaContent.data,
      this.schemaContent.dataFields,
      this.schemaContent.dataGroups,
      this.schemaContent.rules
    );

    return new FinishState({ schema, warnings: this.schemaContent.warnings });
  }
}

class SchemaHeaderState extends State {
  private parent: RootSchemaState;

  public messageId: Value<string> = new Value("xdf:nachrichtID");
  public createdAt: Value<string> = new Value("xdf:erstellungszeitpunkt");

  constructor(parent: RootSchemaState) {
    super();
    this.parent = parent;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    if (tag.name === "xdf:nachrichtID") {
      return new ValueNodeState(this, this.messageId);
    } else if (tag.name === "xdf:erstellungszeitpunkt") {
      return new ValueNodeState(this, this.createdAt);
    } else {
      throw new UnexpectedTagError(
        tag.name,
        "xdf:nachrichtID | xdf:erstellungszeitpunkt"
      );
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:header");

    if (this.messageId === undefined) {
      throw new MissingChildNodeError("xdf:nachrichtID");
    }

    if (this.createdAt === undefined) {
      throw new MissingChildNodeError("xdf:erstellungszeitpunkt");
    }

    this.parent.header = {
      messageId: this.messageId.unwrap(),
      createdAt: new Date(this.createdAt.unwrap()),
    };

    return this.parent;
  }
}

interface BasicDataHolder {
  identification: Value<[string, string | undefined]>;
  name: Value<string>;
  inputLabel: Value<string | undefined>;
  outputLabel: Value<string | undefined>;
  definition: Value<string | undefined>;
  description: Value<string | undefined>;
  relatedTo: Value<string | undefined>;
  // status
  // validSince
  // validUntil
  creator: Value<string | undefined>;
  versionInfo: Value<string | undefined>;
  // releaseDate
}

function createBasicData(): BasicDataHolder {
  return {
    identification: new Value("xdf:identifikation"),
    name: new Value("xdf:name"),
    inputLabel: new Value("xdf:bezeichnungEingabe"),
    outputLabel: new Value("xdf:bezeichnungAusgabe"),
    definition: new Value("xdf:definition"),
    description: new Value("xdf:beschreibung"),
    relatedTo: new Value("xdf:bezug"),
    creator: new Value("xdf:fachlicherErsteller"),
    versionInfo: new Value("xdf:versionshinweis"),
  };
}

function parseBasicData(holder: BasicDataHolder): BasicData {
  const [identifier, version] = holder.identification.unwrap();
  const name = holder.name.unwrap();
  // HACK: Rules do not have an inputLabel, although this is not standard compliant.
  const inputLabel = holder.inputLabel.get() ?? name;

  // Not beautiful, but works: TypeScript does not understand, that returning holder directly
  // would be valid now.
  return {
    identifier,
    version,
    name,
    inputLabel,
    outputLabel: holder.outputLabel.get(),
    definition: holder.definition.get(),
    description: holder.description.get(),
    relatedTo: holder.relatedTo.get(),
    creator: holder.creator.get(),
    versionInfo: holder.versionInfo.get(),
  };
}

interface ElementDataHolder extends BasicDataHolder {
  // type
  inputHint: Value<string | undefined>;
  outputHint: Value<string | undefined>;
}

function createElementData(): ElementDataHolder {
  const basicData = createBasicData();

  return {
    ...basicData,
    inputHint: new Value("xdf:hilfetextEingabe"),
    outputHint: new Value("xdf:hilfetextAusgabe"),
  };
}

interface Context {
  dataFields: Record<string, DataField>;
  dataGroups: Record<string, DataGroup>;
  rules: Record<string, Rule>;
  warnings: SchemaWarnings;
}

class SchemaState extends State {
  private parent: RootSchemaState;

  private context: Context = {
    dataFields: {},
    dataGroups: {},
    rules: {},
    warnings: {
      schemaWarnings: [],
      dataFieldWarnings: {},
      dataGroupWarnings: {},
      ruleWarnings: {},
    },
  };

  public dataHolder: BasicDataHolder = createBasicData();
  public elements: Array<ElementReference> = [];
  private rules: Array<string> = [];

  constructor(parent: RootSchemaState) {
    super();
    this.parent = parent;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    const newState = handleBasicData(this, tag);
    if (newState !== undefined) {
      return newState;
    }

    switch (tag.name) {
      case "xdf:struktur":
        return new ElementReferenceState(this, this.context);
      case "xdf:regel":
        return new RuleState(this, (rule) => {
          this.context.rules[rule.identifier] = rule;
          this.rules.push(rule.identifier);
        });
      case "xdf:ableitungsmodifikationenStruktur":
      case "xdf:ableitungsmodifikationenRepraesentation":
        return new NoOpState(this);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:stammdatenschema");

    const basicData = parseBasicData(this.dataHolder);

    this.parent.schemaContent = {
      data: {
        ...basicData,
        elements: this.elements,
        rules: this.rules,
      },
      ...this.context,
    };

    return this.parent;
  }
}

class IdentificationState extends State {
  private parent: State;
  private value: Value<[string, string | undefined]>;

  private identifier: Value<string> = new Value("xdf:id");
  private version: Value<string | undefined> = new Value("xdf:version");

  constructor(parent: State, value: Value<[string, string | undefined]>) {
    super();
    this.parent = parent;
    this.value = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:id":
        return new ValueNodeState(this, this.identifier);

      case "xdf:version":
        return new OptionalValueNodeState(this, this.version);

      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:identifikation");

    this.value.set([this.identifier.unwrap(), this.version.get()]);

    return this.parent;
  }
}

class ElementReferenceState extends State {
  private parent: SchemaState | DataGroupState;
  private context: Context;

  public element?:
    | { type: "dataField"; dataField: DataField }
    | { type: "dataGroup"; dataGroup: DataGroup } = undefined;

  constructor(parent: SchemaState | DataGroupState, context: Context) {
    super();

    this.parent = parent;
    this.context = context;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:enthaelt":
        return new ElementState(this, this.context);
      case "xdf:anzahl":
      case "xdf:bezug":
        return new NoOpState(this);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:struktur");

    if (this.element === undefined) {
      throw new MissingChildNodeError("xdf:enthaelt");
    }

    if (this.element.type === "dataField") {
      const identifier = this.element.dataField.identifier;

      this.context.dataFields[identifier] = this.element.dataField;
      this.parent.elements.push({
        type: "dataField",
        identifier,
      });
    } else {
      const identifier = this.element.dataGroup.identifier;

      this.context.dataGroups[identifier] = this.element.dataGroup;
      this.parent.elements.push({
        type: "dataGroup",
        identifier,
      });
    }

    return this.parent;
  }
}

class ElementState extends State {
  private parent: ElementReferenceState;
  private context: Context;

  public element?:
    | { type: "dataField"; dataField: DataField }
    | { type: "dataGroup"; dataGroup: DataGroup } = undefined;

  constructor(parent: ElementReferenceState, context: Context) {
    super();

    this.parent = parent;
    this.context = context;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:datenfeldgruppe":
        return new DataGroupState(this, this.context);
      case "xdf:datenfeld":
        return new DataFieldState(this, this.context);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:enthaelt");

    if (this.element === undefined) {
      throw new MissingChildNodeError("xdf:datenfeldgruppe | xdf:datenfeld");
    }

    this.parent.element = this.element;

    return this.parent;
  }
}

class DataGroupState extends State {
  private parent: ElementState;
  private context: Context;

  public dataHolder: ElementDataHolder = createElementData();
  public elements: Array<ElementReference> = [];
  public rules: Array<string> = [];

  constructor(parent: ElementState, context: Context) {
    super();

    this.parent = parent;
    this.context = context;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    const newState = handleElementData(this, tag);
    if (newState !== undefined) {
      return newState;
    }

    switch (tag.name) {
      case "xdf:struktur": {
        return new ElementReferenceState(this, this.context);
      }
      case "xdf:regel": {
        return new RuleState(this, (rule) => {
          this.context.rules[rule.identifier] = rule;
          this.rules.push(rule.identifier);
        });
      }
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:datenfeldgruppe");

    const basicData = parseBasicData(this.dataHolder);

    this.parent.element = {
      type: "dataGroup",
      dataGroup: {
        ...basicData,
        inputHint: this.dataHolder.inputHint.get(),
        outputHint: this.dataHolder.outputHint.get(),
        elements: this.elements,
        rules: this.rules,
      },
    };

    return this.parent;
  }
}

class DataFieldState extends State {
  private parent: ElementState;
  private context: Context;

  public dataHolder: ElementDataHolder = createElementData();
  private inputType: Value<string> = new Value("xdf:feldart");
  private dataType: Value<string> = new Value("xdf:datentyp");
  private constraints: Value<string | undefined> = new Value(
    "xdf:praezisierung"
  );
  private content: Value<string | undefined> = new Value("xdf:inhalt");
  public codeListReference: Value<CodeListReference | undefined> = new Value(
    "xdf:codelisteReferenz"
  );
  private rules: Array<string> = [];

  constructor(parent: ElementState, context: Context) {
    super();
    this.parent = parent;
    this.context = context;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    const newState = handleElementData(this, tag);

    if (newState !== undefined) {
      return newState;
    } else if (tag.name === "xdf:feldart") {
      return new CodeNodeState(this, "xdf:feldart", (value) =>
        this.inputType.set(value)
      );
    } else if (tag.name === "xdf:datentyp") {
      return new CodeNodeState(this, "xdf:datentyp", (value) =>
        this.dataType.set(value)
      );
    } else if (tag.name === "xdf:praezisierung") {
      return new OptionalValueNodeState(this, this.constraints);
    } else if (tag.name === "xdf:inhalt") {
      return new OptionalValueNodeState(this, this.content);
    } else if (tag.name === "xdf:codelisteReferenz") {
      return new CodeListReferenceState(this, (value) =>
        this.codeListReference.set(value)
      );
    } else if (tag.name === "xdf:regel") {
      return new RuleState(this, (rule) => {
        this.context.rules[rule.identifier] = rule;
        this.rules.push(rule.identifier);
      });
    } else {
      throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:datenfeld");

    const basicData = parseBasicData(this.dataHolder);

    const input = parseInput(
      basicData.identifier,
      this.context,
      this.inputType.unwrap(),
      this.dataType.unwrap(),
      this.constraints.get(),
      this.content.get(),
      this.codeListReference.get()
    );

    this.parent.element = {
      type: "dataField",
      dataField: {
        ...basicData,
        inputHint: this.dataHolder.inputHint.get(),
        outputHint: this.dataHolder.outputHint.get(),
        input,
        rules: this.rules,
      },
    };

    return this.parent;
  }
}

class CodeListReferenceState extends State {
  private parent: DataFieldState;
  private onFinish: FinishFn<CodeListReference>;

  public identifier: Value<string> = new Value("xdf:identifikation");
  public genericodeData: Value<{
    canonicalUri: string;
    canonicalVersionUri: string;
    version: string;
  }> = new Value("xdf:genericodeIdentification");

  constructor(parent: DataFieldState, onFinish: FinishFn<CodeListReference>) {
    super();
    this.parent = parent;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:identifikation":
        return new CodeListIdentificationState(this);
      case "xdf:genericodeIdentification":
        return new GenericodeIdentificationState(this);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:codelisteReferenz");

    const codeListReference = {
      identifier: this.identifier.unwrap(),
      ...this.genericodeData.unwrap(),
    };

    this.onFinish(codeListReference);

    return this.parent;
  }
}

class CodeListIdentificationState extends State {
  private parent: CodeListReferenceState;

  private identifier: Value<string> = new Value("xdf:id");

  constructor(parent: CodeListReferenceState) {
    super();
    this.parent = parent;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    expectTag(tag.name, "xdf:id");

    return new ValueNodeState(this, this.identifier);
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:identifikation");

    if (this.identifier === undefined) {
      throw new MissingChildNodeError("xdf:id");
    }

    this.parent.identifier.set(this.identifier.unwrap());

    return this.parent;
  }
}

class GenericodeIdentificationState extends State {
  private parent: CodeListReferenceState;

  private version: Value<string> = new Value("xdf:version");
  private canonicalUri: Value<string> = new Value(
    "xdf:canonicalIdentification"
  );
  private canonicalVersionUri: Value<string> = new Value(
    "xdf:canonicalVersionUri"
  );

  constructor(parent: CodeListReferenceState) {
    super();
    this.parent = parent;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:canonicalIdentification":
        return new ValueNodeState(this, this.canonicalUri);
      case "xdf:version":
        return new ValueNodeState(this, this.version);
      case "xdf:canonicalVersionUri":
        return new ValueNodeState(this, this.canonicalVersionUri);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:genericodeIdentification");

    this.parent.genericodeData.set({
      version: this.version.unwrap(),
      canonicalUri: this.canonicalUri.unwrap(),
      canonicalVersionUri: this.canonicalVersionUri.unwrap(),
    });

    return this.parent;
  }
}

class RuleState extends State {
  private parent: State;
  public dataHolder: BasicDataHolder = createBasicData();
  private script: Value<string> = new Value("xdf:script");

  private readonly onFinish: (rule: Rule) => void;

  constructor(parent: State, onFinish: (rule: Rule) => void) {
    super();
    this.parent = parent;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    const newState = handleBasicData(this, tag);

    if (newState !== undefined) {
      return newState;
    } else if (tag.name === "xdf:script") {
      return new ValueNodeState(this, this.script);
    } else {
      throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:regel");

    const basicData = parseBasicData(this.dataHolder);

    const rule = {
      ...basicData,
      script: this.script.unwrap(),
    };

    this.onFinish(rule);

    return this.parent;
  }
}

function handleElementData(
  parent: DataGroupState | DataFieldState,
  tag: sax.Tag | sax.QualifiedTag
): State | undefined {
  const newState = handleBasicData(parent, tag);
  if (newState !== undefined) {
    return newState;
  }

  switch (tag.name) {
    case "xdf:hilfetextEingabe":
      return new OptionalValueNodeState(parent, parent.dataHolder.inputHint);
    case "xdf:hilfetextAusgabe":
      return new OptionalValueNodeState(parent, parent.dataHolder.outputHint);
    case "xdf:schemaelementart":
      return new NoOpState(parent);
    default:
      return undefined;
  }
}

function handleBasicData(
  parent: DataGroupState | DataFieldState | SchemaState | RuleState,
  tag: sax.Tag | sax.QualifiedTag
): State | undefined {
  switch (tag.name) {
    case "xdf:identifikation":
      return new IdentificationState(parent, parent.dataHolder.identification);
    case "xdf:name":
      return new ValueNodeState(parent, parent.dataHolder.name);
    case "xdf:bezeichnungEingabe":
      return new OptionalValueNodeState(parent, parent.dataHolder.inputLabel);
    case "xdf:bezeichnungAusgabe":
      return new OptionalValueNodeState(parent, parent.dataHolder.outputLabel);
    case "xdf:beschreibung":
      return new OptionalValueNodeState(parent, parent.dataHolder.description);
    case "xdf:definition":
      return new OptionalValueNodeState(parent, parent.dataHolder.definition);
    case "xdf:bezug":
      return new OptionalValueNodeState(parent, parent.dataHolder.relatedTo);
    case "xdf:fachlicherErsteller":
      return new OptionalValueNodeState(parent, parent.dataHolder.creator);
    case "xdf:versionshinweis":
      return new OptionalValueNodeState(parent, parent.dataHolder.versionInfo);
    case "xdf:status":
    case "xdf:freigabedatum":
    case "xdf:veroeffentlichungsdatum":
      return new NoOpState(parent);
    default:
      return undefined;
  }
}

function parseInput(
  identifier: string,
  context: Context,
  inputType: string,
  dataType: string,
  constraints?: string,
  content?: string,
  codeListReference?: CodeListReference
): InputDescription {
  switch (inputType) {
    case "select": {
      // TODO: assert(dataType === "text"), or log warning
      // TODO: Check for unused input constraints
      if (codeListReference === undefined) {
        throw new MissingChildNodeError("xdf:codelisteReferenz");
      }

      return {
        type: "select",
        content,
        codeListReference,
      };
    }

    case "input": {
      // TODO: Log warning if there are constraints not applicable to the specific
      // data type (e.g. `minValue` for a `bool`).

      switch (dataType) {
        case "text": {
          return {
            type: "text",
            content,
            constraints,
          };
        }

        case "bool": {
          return { type: "bool" };
        }

        case "num_int": {
          return {
            type: "integer",
            content,
            constraints,
          };
        }

        case "date": {
          return { type: "date" };
        }

        case "num": {
          return {
            type: "number",
            content,
            constraints,
          };
        }

        case "num_currency": {
          return {
            type: "currency",
            content,
            constraints,
          };
        }

        case "file": {
          return { type: "file" };
        }

        case "obj": {
          return { type: "object" };
        }

        default: {
          throw new Error(
            `Unknown data type for data field ${identifier}: ${dataType}`
          );
        }
      }
    }

    case "label": {
      // TODO: assert(dataType === "text"), or log warning
      // TODO: Log warning for empty label

      return {
        type: "label",
        content: content || "Leerer Hinweis",
      };
    }

    default: {
      throw new Error(
        `Unknown input type for data field ${identifier}: ${inputType}`
      );
    }
  }
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
  private name: string;
  private onFinish: (value: string) => void;

  private value: Value<string> = new Value("code");

  constructor(parent: State, name: string, onFinish: (value: string) => void) {
    super();

    this.parent = parent;
    this.name = name;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    expectTag(tag.name, "code");

    return new ValueNodeState(this, this.value);
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, this.name);

    this.onFinish(this.value.unwrap());

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
    if (tag.isSelfClosing) {
      return this;
    } else {
      return new NoOpState(this);
    }
  }

  public onCloseTag(tagName: string): State {
    return this.parent;
  }
}

export class FastSchemaParser {
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

  public finish(): ParseResult {
    this.xmlParser.close();

    if (!(this.state instanceof FinishState)) {
      throw new ParserError("Unexpected EOF");
    }

    return this.state.result;
  }

  public static parseString(value: string): ParseResult {
    const parser = new FastSchemaParser();
    parser.write(value);

    return parser.finish();
  }
}
