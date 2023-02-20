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

interface InputConstraints {
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

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

  public messageId?: string = undefined;
  public createdAt?: Date = undefined;

  constructor(parent: RootSchemaState) {
    super();
    this.parent = parent;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    if (tag.name === "xdf:nachrichtID") {
      return new ValueNodeState(
        this,
        "xdf:nachrichtID",
        (value) => (this.messageId = value)
      );
    } else if (tag.name === "xdf:erstellungszeitpunkt") {
      return new ValueNodeState(this, "xdf:erstellungszeitpunkt", (value) => {
        this.createdAt = new Date(value);
      });
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
      messageId: this.messageId,
      createdAt: this.createdAt,
    };

    return this.parent;
  }
}

interface BasicDataHolder {
  identifier?: string;
  version?: string;
  name?: string;
  inputLabel?: string;
  outputLabel?: string;
  definition?: string;
  description?: string;
  relatedTo?: string;
  // status
  // validSince
  // validUntil
  creator?: string;
  versionInfo?: string;
  // releaseDate
}

function parseBasicData(holder: BasicDataHolder): BasicData {
  if (holder.identifier === undefined || holder.version === undefined) {
    throw new MissingChildNodeError("xdf:identifikation");
  }

  if (holder.name === undefined) {
    throw new MissingChildNodeError("xdf:name");
  }

  if (holder.inputLabel === undefined) {
    throw new MissingChildNodeError("xdf:bezeichnungEingabe");
  }

  // Not beautiful, but works: TypeScript does not understand, that returning holder directly
  // would be valid now.
  return {
    ...holder,
    identifier: holder.identifier,
    version: holder.version,
    name: holder.name,
    inputLabel: holder.inputLabel,
  };
}

interface ElementDataHolder extends BasicDataHolder {
  // type
  inputHint?: string;
  outputHint?: string;
}

interface Context {
  dataFields: Record<string, DataField>;
  dataGroups: Record<string, DataGroup>;
  warnings: SchemaWarnings;
}

class SchemaState extends State {
  private parent: RootSchemaState;

  private context: Context = {
    dataFields: {},
    dataGroups: {},
    warnings: {
      schemaWarnings: [],
      dataFieldWarnings: {},
      dataGroupWarnings: {},
      ruleWarnings: {},
    },
  };

  public dataHolder: BasicDataHolder = {};
  public elements: Array<ElementReference> = [];

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
        rules: [],
      },
      dataFields: this.context.dataFields,
      dataGroups: this.context.dataGroups,
      rules: {},
      warnings: this.context.warnings,
    };

    return this.parent;
  }
}

class IdentificationState extends State {
  private parent: SchemaState | DataGroupState | DataFieldState;

  private identifier?: string = undefined;
  private version?: string = undefined;

  constructor(parent: SchemaState | DataGroupState | DataFieldState) {
    super();
    this.parent = parent;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:id":
        return new ValueNodeState(
          this,
          "xdf:id",
          (value) => (this.identifier = value)
        );

      case "xdf:version":
        return new ValueNodeState(
          this,
          "xdf:version",
          (value) => (this.version = value)
        );

      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:identifikation");

    if (this.identifier === undefined) {
      throw new MissingChildNodeError("xdf:id");
    }

    if (this.version === undefined) {
      throw new MissingChildNodeError("xdf:version");
    }

    this.parent.dataHolder.identifier = this.identifier;
    this.parent.dataHolder.version = this.version;

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

  public dataHolder: ElementDataHolder = {};
  public elements: Array<ElementReference> = [];
  public rules: Array<Rule> = [];

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
        return new NoOpState(this);
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
        inputHint: this.dataHolder.inputHint,
        outputHint: this.dataHolder.outputHint,
        elements: this.elements,
        rules: [],
      },
    };

    return this.parent;
  }
}

class DataFieldState extends State {
  private parent: ElementState;
  private context: Context;

  public dataHolder: ElementDataHolder = {};
  private inputType?: string = undefined;
  private dataType?: string = undefined;
  private constraints?: string = undefined;
  private content?: string = undefined;
  public codeListReference?: CodeListReference = undefined;

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
      return new CodeNodeState(
        this,
        "xdf:feldart",
        (value) => (this.inputType = value)
      );
    } else if (tag.name === "xdf:datentyp") {
      return new CodeNodeState(
        this,
        "xdf:datentyp",
        (value) => (this.dataType = value)
      );
    } else if (tag.name === "xdf:praezisierung") {
      return new OptionalValueNodeState(
        this,
        "xdf:praezisierung",
        (value) => (this.constraints = value)
      );
    } else if (tag.name === "xdf:inhalt") {
      return new OptionalValueNodeState(
        this,
        "xdf:inhalt",
        (value) => (this.content = value)
      );
    } else if (tag.name === "xdf:codelisteReferenz") {
      return new CodeListReferenceState(this);
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
      this.inputType,
      this.dataType,
      this.constraints,
      this.content,
      this.codeListReference
    );

    this.parent.element = {
      type: "dataField",
      dataField: {
        ...basicData,
        inputHint: this.dataHolder.inputHint,
        outputHint: this.dataHolder.outputHint,
        input,
        rules: [],
      },
    };

    return this.parent;
  }
}

class CodeListReferenceState extends State {
  private parent: DataFieldState;

  public identifier?: string = undefined;
  public genericodeData?: {
    canonicalUri: string;
    canonicalVersionUri: string;
    version: string;
  } = undefined;

  constructor(parent: DataFieldState) {
    super();
    this.parent = parent;
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

    if (this.identifier === undefined) {
      throw new MissingChildNodeError("xdf:identifikation");
    }
    if (this.genericodeData === undefined) {
      throw new MissingChildNodeError("xdf:genericodeIdentification");
    }

    this.parent.codeListReference = {
      identifier: this.identifier,
      canonicalUri: this.genericodeData.canonicalUri,
      canonicalVersionUri: this.genericodeData.canonicalVersionUri,
      version: this.genericodeData.version,
    };

    return this.parent;
  }
}

class CodeListIdentificationState extends State {
  private parent: CodeListReferenceState;

  private identifier?: string = undefined;

  constructor(parent: CodeListReferenceState) {
    super();
    this.parent = parent;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    expectTag(tag.name, "xdf:id");

    return new ValueNodeState(
      this,
      "xdf:id",
      (value) => (this.identifier = value)
    );
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:identifikation");

    if (this.identifier === undefined) {
      throw new MissingChildNodeError("xdf:id");
    }

    this.parent.identifier = this.identifier;

    return this.parent;
  }
}

class GenericodeIdentificationState extends State {
  private parent: CodeListReferenceState;

  private version?: string = undefined;
  private canonicalUri?: string = undefined;
  private canonicalVersionUri?: string = undefined;

  constructor(parent: CodeListReferenceState) {
    super();
    this.parent = parent;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:canonicalIdentification":
        return new ValueNodeState(
          this,
          "xdf:canonicalIdentification",
          (value) => (this.canonicalUri = value)
        );
      case "xdf:version":
        return new ValueNodeState(
          this,
          "xdf:version",
          (value) => (this.version = value)
        );
      case "xdf:canonicalVersionUri":
        return new ValueNodeState(
          this,
          "xdf:canonicalVersionUri",
          (value) => (this.canonicalVersionUri = value)
        );
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, "xdf:genericodeIdentification");

    if (this.version === undefined) {
      throw new MissingChildNodeError("xdf:version");
    }
    if (this.canonicalUri === undefined) {
      throw new MissingChildNodeError("xdf:canonicalIdentification");
    }
    if (this.canonicalVersionUri === undefined) {
      throw new MissingChildNodeError("xdf:canonicalVersionUri");
    }

    this.parent.genericodeData = {
      version: this.version,
      canonicalUri: this.canonicalUri,
      canonicalVersionUri: this.canonicalVersionUri,
    };

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
      return new OptionalValueNodeState(
        parent,
        "xdf:hilfetextEingabe",
        (value) => (parent.dataHolder.inputHint = value)
      );
    case "xdf:hilfetextAusgabe":
      return new OptionalValueNodeState(
        parent,
        "xdf:hilfetextAusgabe",
        (value) => (parent.dataHolder.outputHint = value)
      );
    case "xdf:schemaelementart":
      return new NoOpState(parent);
    default:
      return undefined;
  }
}

function handleBasicData(
  parent: DataGroupState | DataFieldState | SchemaState,
  tag: sax.Tag | sax.QualifiedTag
): State | undefined {
  switch (tag.name) {
    case "xdf:identifikation":
      return new IdentificationState(parent);
    case "xdf:name":
      return new ValueNodeState(
        parent,
        "xdf:name",
        (value) => (parent.dataHolder.name = value)
      );
    case "xdf:bezeichnungEingabe":
      return new ValueNodeState(
        parent,
        "xdf:bezeichnungEingabe",
        (value) => (parent.dataHolder.inputLabel = value)
      );
    case "xdf:bezeichnungAusgabe":
      return new ValueNodeState(
        parent,
        "xdf:bezeichnungAusgabe",
        (value) => (parent.dataHolder.outputLabel = value)
      );
    case "xdf:beschreibung":
      return new OptionalValueNodeState(
        parent,
        "xdf:beschreibung",
        (value) => (parent.dataHolder.description = value)
      );
    case "xdf:definition":
      return new OptionalValueNodeState(
        parent,
        "xdf:definition",
        (value) => (parent.dataHolder.definition = value)
      );
    case "xdf:bezug":
      return new OptionalValueNodeState(
        parent,
        "xdf:bezug",
        (value) => (parent.dataHolder.relatedTo = value)
      );
    case "xdf:fachlicherErsteller":
      return new ValueNodeState(
        parent,
        "xdf:fachlicherErsteller",
        (value) => (parent.dataHolder.creator = value)
      );
    case "xdf:versionshinweis":
      return new OptionalValueNodeState(
        parent,
        "xdf:versionshinweis",
        (value) => (parent.dataHolder.versionInfo = value)
      );
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
  inputType?: string,
  dataType?: string,
  constraints?: string,
  content?: string,
  codeListReference?: CodeListReference
): InputDescription {
  const inputConstraints = parseInputConstraints(
    identifier,
    context,
    constraints
  );

  switch (inputType) {
    case "select": {
      // TODO: assert(dataType === "text"), or log warning
      // TODO: Check for unused input constraints, like content or praezisierung.
      if (codeListReference === undefined) {
        throw new MissingChildNodeError("xdf:codelisteReferenz");
      }

      return {
        type: "select",
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
            constraints: {
              minLength: inputConstraints?.minLength,
              maxLength: inputConstraints?.maxLength,
              pattern: inputConstraints?.pattern,
            },
          };
        }

        case "bool": {
          return { type: "bool" };
        }

        case "num_int": {
          return {
            type: "integer",
            constraints: {
              minValue: inputConstraints?.minLength,
              maxValue: inputConstraints?.maxValue,
            },
          };
        }

        case "date": {
          return { type: "date" };
        }

        case "num": {
          return {
            type: "number",
            constraints: {
              minValue: inputConstraints?.minLength,
              maxValue: inputConstraints?.maxValue,
            },
          };
        }

        case "num_currency": {
          return {
            type: "currency",
            constraints: {
              minValue: inputConstraints?.minLength,
              maxValue: inputConstraints?.maxValue,
            },
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

function parseInputConstraints(
  identifier: string,
  context: Context,
  value?: string
): InputConstraints | undefined {
  if (value === undefined) {
    return undefined;
  }

  let data;
  try {
    data = JSON.parse(value);
  } catch (error) {
    return undefined;
  }

  const minLengthStr = data["minLength"];
  const maxLengthStr = data["maxLength"];
  const minValueStr = data["minValue"];
  const maxValueStr = data["maxValue"];
  const pattern = data["pattern"];
  if (pattern !== undefined && typeof pattern !== "string") {
    return undefined;
  }

  return {
    minLength: minLengthStr ? parseInt(minLengthStr) : undefined,
    maxLength: maxLengthStr ? parseInt(maxLengthStr) : undefined,
    minValue: minValueStr ? parseInt(minValueStr) : undefined,
    maxValue: maxValueStr ? parseInt(maxValueStr) : undefined,
    pattern,
  };
}

class ValueNodeState extends State {
  private parent: State;
  private name: string;
  private onFinish: (value: string) => void;

  private value?: string = undefined;

  constructor(parent: State, name: string, onFinish: (value: string) => void) {
    super();

    this.parent = parent;
    this.name = name;
    this.onFinish = onFinish;
  }

  public onText(text: string) {
    this.value = text;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    throw new UnexpectedTagError(tag.name, "<None>");
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, this.name);

    if (this.value === undefined) {
      throw new MissingContentError(this.name);
    }

    this.onFinish(this.value);

    return this.parent;
  }
}

class OptionalValueNodeState extends State {
  private parent: State;
  private name: string;
  private onFinish: (value?: string) => void;

  private value?: string = undefined;

  constructor(parent: State, name: string, onFinish: (value?: string) => void) {
    super();

    this.parent = parent;
    this.name = name;
    this.onFinish = onFinish;
  }

  public onText(text: string) {
    this.value = text;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    throw new UnexpectedTagError(tag.name, "<None>");
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, this.name);

    this.onFinish(this.value);

    return this.parent;
  }
}

class CodeNodeState extends State {
  private parent: State;
  private name: string;
  private onFinish: (value: string) => void;

  private value?: string = undefined;

  constructor(parent: State, name: string, onFinish: (value: string) => void) {
    super();

    this.parent = parent;
    this.name = name;
    this.onFinish = onFinish;
  }

  public onText(text: string) {
    this.value = text;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    expectTag(tag.name, "code");

    return new ValueNodeState(this, "code", (value) => (this.value = value));
  }

  public onCloseTag(tagName: string): State {
    expectTag(tagName, this.name);

    if (this.value === undefined) {
      throw new MissingContentError(this.name);
    }

    this.onFinish(this.value);

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
