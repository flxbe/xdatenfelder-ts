import sax from "sax";
import { assert } from "./util";
import { Value, Context } from "./sax";
import {
  DataField,
  DataGroup,
  Rule,
  Schema,
  FreigabeStatus,
  SchemaContainer,
  SchemaElementArt,
  parseDate,
  Table,
  BaseData,
  ChildRef,
  ElementData,
  parseSchemaElementArt,
  Feldart,
  Datentyp,
  parseFeldart,
  parseDatentyp,
} from "./schema";
import {
  ParserError,
  UnexpectedTagError,
  UnknownNamespaceError,
  MissingContentError,
  MissingValueError,
} from "./errors";
import { InternalParserError } from "./errors";

export interface ParseResult {
  messageId: string;
  createdAt: Date;
  schemaContainer: SchemaContainer;
}

interface NoOpState {
  type: "noOp";
  parent: State<unknown>;
}

function createNoOpState(parent: State<unknown>): NoOpState {
  return { type: "noOp", parent };
}

interface ValueNodeState<T> {
  type: "value";
  parent: State<unknown>;
  value: Value<T>;
  parse: (raw: string) => T;
}

function createValueNodeState<T>(
  parent: State<unknown>,
  value: Value<T>,
  parse: (raw: string) => T
): ValueNodeState<T> {
  return {
    type: "value",
    parent,
    value,
    parse,
  };
}

interface OptionalValueNodeState<T> {
  type: "opt_value";
  parent: State<unknown>;
  value: Value<T | undefined>;
  parse: (raw: string) => T;
}

function createOptionalValueNodeState<T>(
  parent: State<unknown>,
  value: Value<T | undefined>,
  parse: (raw: string) => T
): OptionalValueNodeState<T> {
  return {
    type: "opt_value",
    parent,
    value,
    parse,
  };
}

interface CodeNodeState<T> {
  type: "code";
  parent: State<unknown>;
  value: Value<T>;
  parse: (raw: string) => T;
}

function createCodeNodeState<T>(
  parent: State<unknown>,
  value: Value<T>,
  parse: (raw: string) => T
): CodeNodeState<T> {
  return {
    type: "code",
    parent,
    value,
    parse,
  };
}

interface StringNodeState {
  type: "string";
  parent: State<unknown>;
  value: Value<string>;
}

function createStringNodeState(
  parent: State<unknown>,
  value: Value<string>
): StringNodeState {
  return {
    type: "string",
    parent,
    value,
  };
}

interface OptionalStringNodeState {
  type: "opt_string";
  parent: State<unknown>;
  value: Value<string | undefined>;
}

function createOptionalStringNodeState(
  parent: State<unknown>,
  value: Value<string | undefined>
): OptionalStringNodeState {
  return {
    type: "opt_string",
    parent,
    value,
  };
}

interface RootState {
  type: "root";
  value: Value<[string, Date, Schema]>;
}

function createRootState(): RootState {
  return {
    type: "root",
    value: new Value(),
  };
}

interface MessageState {
  type: "message";
  parent: RootState;
  header: Value<[string, Date]>;
  schema: Value<Schema>;
}

function createMessageState(parent: RootState): MessageState {
  return {
    type: "message",
    parent,
    header: new Value(),
    schema: new Value(),
  };
}

interface HeaderState {
  type: "header";
  parent: MessageState;
  messageId: Value<string>;
  createdAt: Value<Date>;
}

function createHeaderState(parent: MessageState): HeaderState {
  return {
    type: "header",
    parent,
    messageId: new Value(),
    createdAt: new Value(),
  };
}

interface SchemaState {
  type: "schema";
  parent: MessageState;
  dataContainer: BaseContainer;
  label: Value<string | undefined>;
  children: ChildRef[];
}

function createSchemaState(parent: MessageState): SchemaState {
  return {
    type: "schema",
    parent,
    dataContainer: createBaseContainer(),
    label: new Value(),
    children: [],
  };
}

interface IdentificationState {
  type: "identification";
  parent: SchemaState | DataGroupState | DataFieldState;
  id: Value<string>;
  version: Value<string>;
}

function createIdentificationState(
  parent: SchemaState | DataGroupState | DataFieldState
): IdentificationState {
  return {
    type: "identification",
    parent,
    id: new Value(),
    version: new Value(),
  };
}

type Element =
  | { type: "dataGroup"; dataGroup: DataGroup }
  | { type: "dataField"; dataField: DataField };

interface StructState {
  type: "struct";
  parent: SchemaState | DataGroupState;
  cardinality: Value<string>;
  element: Value<Element>;
}

function createStructState(parent: SchemaState | DataGroupState): StructState {
  return {
    type: "struct",
    parent,
    cardinality: new Value(),
    element: new Value(),
  };
}

interface ContainsState {
  type: "contains";
  parent: StructState;
}

interface DataGroupState {
  type: "dataGroup";
  parent: ContainsState;
  dataContainer: ElementContainer;
  children: ChildRef[];
}

function createDataGroupState(parent: ContainsState): DataGroupState {
  return {
    type: "dataGroup",
    parent,
    dataContainer: createElementContainer(),
    children: [],
  };
}

interface DataFieldState {
  type: "dataField";
  parent: ContainsState;
  dataContainer: ElementContainer;
  inputType: Value<Feldart>;
  dataType: Value<Datentyp>;
  content: Value<string | undefined>;
}

function createDataFieldState(parent: ContainsState): DataFieldState {
  return {
    type: "dataField",
    parent,
    dataContainer: createElementContainer(),
    inputType: new Value(),
    dataType: new Value(),
    content: new Value(),
  };
}

type State<T> =
  | RootState
  | MessageState
  | HeaderState
  | SchemaState
  | NoOpState
  | OptionalStringNodeState
  | StringNodeState
  | IdentificationState
  | StructState
  | ContainsState
  | DataGroupState
  | DataFieldState
  | ValueNodeState<T>
  | OptionalValueNodeState<T>
  | CodeNodeState<T>;

function handleText(state: State<unknown>, text: string) {
  switch (state.type) {
    case "string":
    case "opt_string":
      state.value.set(text);
      break;

    case "value":
    case "opt_value":
      state.value.set(state.parse(text));
      break;

    case "noOp":
      break;

    default:
      throw new InternalParserError(`Got unexpected text block: ${text}`);
  }
}

function handleOpenTag(
  state: State<unknown>,
  tag: sax.QualifiedTag
): State<unknown> {
  switch (state.type) {
    case "root": {
      switch (tag.name) {
        case "xdf:xdatenfelder.stammdatenschema.0102":
          return createMessageState(state);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "message": {
      switch (tag.name) {
        case "xdf:header":
          return createHeaderState(state);
        case "xdf:stammdatenschema":
          return createSchemaState(state);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "header": {
      switch (tag.name) {
        case "xdf:nachrichtID":
          return createStringNodeState(state, state.messageId);
        case "xdf:erstellungszeitpunkt":
          return createValueNodeState(state, state.createdAt, parseDate);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "schema": {
      switch (tag.name) {
        case "xdf:bezeichnungEingabe":
          return createOptionalStringNodeState(state, state.label);
        case "xdf:struktur":
          return createStructState(state);
        case "xdf:ableitungsmodifikationenStruktur":
        case "xdf:ableitungsmodifikationenRepraesentation":
          return createNoOpState(state);
        default:
          return handleBaseData(state, tag);
      }
    }

    case "struct": {
      switch (tag.name) {
        case "xdf:anzahl":
          return createStringNodeState(state, state.cardinality);
        case "xdf:bezug":
          return createNoOpState(state);
        case "xdf:enthaelt":
          return { type: "contains", parent: state };
        default:
          throw new UnexpectedTagError();
      }
    }

    case "contains": {
      switch (tag.name) {
        case "xdf:datenfeld":
          return createDataFieldState(state);
        case "xdf:datenfeldgruppe":
          return createDataGroupState(state);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "dataGroup": {
      switch (tag.name) {
        case "xdf:struktur":
          return createStructState(state);
        default:
          return handleElementData(state, tag);
      }
    }

    case "dataField": {
      switch (tag.name) {
        case "xdf:feldart":
          return createCodeNodeState(state, state.inputType, parseFeldart);
        case "xdf:datentyp":
          return createCodeNodeState(state, state.dataType, parseDatentyp);
        case "xdf:inhalt":
          return createOptionalStringNodeState(state, state.content);
        case "xdf:praezisierung":
          return createNoOpState(state);
        default:
          return handleElementData(state, tag);
      }
    }

    case "identification": {
      switch (tag.name) {
        case "xdf:id":
          return createStringNodeState(state, state.id);
        case "xdf:version":
          return createStringNodeState(state, state.version);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "code": {
      switch (tag.name) {
        case "code":
          return createValueNodeState(state, state.value, state.parse);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "string":
      throw new UnexpectedTagError();

    case "noOp":
      return createNoOpState(state);

    default:
      throw new Error(`Unknown state: ${state.type}`);
  }
}

function handleCloseTag(
  state: State<unknown>,
  context: Context
): State<unknown> {
  switch (state.type) {
    case "root":
      throw new UnexpectedTagError();

    case "message": {
      const [messageId, createdAt] = state.header.expect("Missing <header>");
      const schema = state.schema.expect("Missing <stammdatenschema>");

      state.parent.value.set([messageId, createdAt, schema]);
      return state.parent;
    }

    case "header": {
      const messageId = state.messageId.expect("Missing <nachrichtID>");
      const createdAt = state.createdAt.expect(
        "Missing <erstellungszeitpunkt>"
      );

      state.parent.header.set([messageId, createdAt]);
      return state.parent;
    }

    case "schema": {
      const baseData = parseBaseData(state.dataContainer);
      const label = state.label.get() ?? baseData.name;

      state.parent.schema.set({
        ...baseData,
        label,
        rules: [],
        children: state.children,
      });
      return state.parent;
    }

    case "struct": {
      const cardinality = state.cardinality.expect("Missing <anzahl>");
      const element = state.element.expect("Missing <enthaelt>");

      if (element.type === "dataGroup") {
        state.parent.children.push({
          type: "dataGroup",
          identifier: element.dataGroup.identifier,
          cardinality,
          normReferences: [],
        });
      } else {
        state.parent.children.push({
          type: "dataField",
          identifier: element.dataField.identifier,
          cardinality,
          normReferences: [],
        });
      }

      return state.parent;
    }

    case "contains": {
      if (!state.parent.element.isFilled()) {
        throw new MissingValueError("Missing <datenfeld> or <datenfeldgruppe>");
      }

      return state.parent;
    }

    case "dataGroup": {
      const elementData = parseElementData(state.dataContainer);

      const dataGroup: DataGroup = {
        ...elementData,
        rules: [],
        children: state.children,
      };

      context.dataGroups.insert(dataGroup);
      state.parent.parent.element.set({ type: "dataGroup", dataGroup });

      return state.parent;
    }

    case "dataField": {
      const elementData = parseElementData(state.dataContainer);

      const dataField: DataField = {
        ...elementData,
        inputType: state.inputType.expect("Missing <feldart>"),
        dataType: "text",
        rules: [],
        constraints: {},
        fillType: "keine",
        mediaTypes: [],
        values: [],
      };

      context.dataFields.insert(dataField);
      state.parent.parent.element.set({ type: "dataField", dataField });

      return state.parent;
    }

    case "identification": {
      const id = state.id.expect("Missing <id>");
      const version = state.version.expect("Missing <version>");

      state.parent.dataContainer.identification.set([id, version]);
      return state.parent;
    }

    case "string": {
      if (!state.value.isFilled()) {
        throw new MissingContentError();
      }
      return state.parent;
    }

    case "value": {
      if (!state.value.isFilled()) {
        throw new MissingContentError();
      }
      return state.parent;
    }

    case "code": {
      if (!state.value.isFilled()) {
        throw new MissingValueError("Missing <code>");
      }
      return state.parent;
    }

    case "noOp":
    case "opt_string":
    case "opt_value":
      return state.parent;

    default:
      throw new Error("Unknown state");
  }
}

export class SchemaConverter {
  private xmlParser: sax.SAXParser;
  private state: State<unknown> = createRootState();
  private context: Context = {
    dataGroups: Table.DataGroupTable(),
    dataFields: Table.DataFieldTable(),
    rules: Table.RuleTable(),
  };

  constructor() {
    this.xmlParser = sax.parser(true, {
      trim: true,
      xmlns: true,
    });

    this.xmlParser.onerror = (error) => {
      throw error;
    };

    this.xmlParser.ontext = (text) => {
      handleText(this.state, text);
    };

    this.xmlParser.onopennamespace = (ns) => {
      if (ns.prefix === "xdf") {
        if (ns.uri !== "urn:xoev-de:fim:standard:xdatenfelder_2") {
          throw new UnknownNamespaceError(ns.prefix, ns.uri);
        }
      }
    };

    this.xmlParser.onopentag = (tag) => {
      assert("ns" in tag);
      this.state = handleOpenTag(this.state, tag);
    };

    this.xmlParser.onclosetag = () => {
      this.state = handleCloseTag(this.state, this.context);
    };
  }

  public write(data: string) {
    try {
      this.xmlParser.write(data);
    } catch (error: unknown) {
      if (error instanceof InternalParserError) {
        throw ParserError.fromInternalError(error, this.xmlParser);
      } else {
        throw error;
      }
    }
  }

  public finish(): ParseResult {
    this.xmlParser.close();

    if (this.state.type !== "root") {
      throw new InternalParserError("Unexpected EOF");
    }

    const [messageId, createdAt, schema] = this.state.value.expect(
      "Missing <urn:xoev-de:fim:standard:xdatenfelder_2>"
    );

    const container: SchemaContainer = {
      schema,
      ...this.context,
    };

    return {
      messageId,
      createdAt,
      schemaContainer: container,
    };
  }
}

interface BaseContainer {
  identification: Value<[string, string]>;
  name: Value<string>;
  description: Value<string | undefined>;
  definition: Value<string | undefined>;
  versionHint: Value<string | undefined>;
  stateSetAt: Value<Date | undefined>;
  stateSetBy: Value<string | undefined>;
  releasedAt: Value<Date | undefined>;
}

function createBaseContainer(): BaseContainer {
  return {
    identification: new Value(),
    name: new Value(),
    description: new Value(),
    definition: new Value(),
    versionHint: new Value(),
    stateSetAt: new Value(),
    stateSetBy: new Value(),
    releasedAt: new Value(),
  };
}

function parseBaseData(container: BaseContainer): BaseData {
  const [id, version] = container.identification.expect(
    "Missing <identifikation>"
  );
  const identifier = `${id}:${version}`;

  return {
    identifier,
    id,
    version,
    name: container.name.expect("Missing <name>"),
    description: container.description.get(),
    definition: container.definition.get(),
    releaseState: FreigabeStatus.Inaktiv,
    stateSetAt: container.stateSetAt.get(),
    stateSetBy: container.stateSetBy.get(),
    validSince: undefined,
    validUntil: undefined,
    versionHint: container.versionHint.get(),
    publishedAt: container.releasedAt.get(),
    lastChangedAt: new Date(0),
    normReferences: [],
    keywords: [],
    relations: [],
  };
}

function handleBaseData(
  state: SchemaState | DataGroupState | DataFieldState,
  tag: sax.QualifiedTag
): State<unknown> {
  switch (tag.name) {
    case "xdf:identifikation":
      return createIdentificationState(state);
    case "xdf:name":
      return createStringNodeState(state, state.dataContainer.name);
    case "xdf:beschreibung":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.description
      );
    case "xdf:definition":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.definition
      );
    case "xdf:versionshinweis":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.versionHint
      );
    case "xdf:freigabedatum":
      return createOptionalValueNodeState(
        state,
        state.dataContainer.stateSetAt,
        parseDate
      );
    case "xdf:fachlicherErsteller":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.stateSetBy
      );
    case "xdf:veroeffentlichungsdatum":
      return createOptionalValueNodeState(
        state,
        state.dataContainer.releasedAt,
        parseDate
      );
    case "xdf:bezug":
    case "xdf:status":
      return createNoOpState(state);
    default:
      throw new UnexpectedTagError();
  }
}

interface ElementContainer extends BaseContainer {
  inputLabel: Value<string | undefined>;
  outputLabel: Value<string | undefined>;
  inputHelp: Value<string | undefined>;
  outputHelp: Value<string | undefined>;
  elementType: Value<SchemaElementArt>;
}

function createElementContainer(): ElementContainer {
  return {
    ...createBaseContainer(),
    inputLabel: new Value(),
    outputLabel: new Value(),
    inputHelp: new Value(),
    outputHelp: new Value(),
    elementType: new Value(),
  };
}

function parseElementData(container: ElementContainer): ElementData {
  const baseData = parseBaseData(container);

  return {
    ...baseData,
    inputLabel: container.inputLabel.get() ?? baseData.name,
    outputLabel: container.outputLabel.get(),
    inputHelp: container.inputHelp.get(),
    outputHelp: container.outputHelp.get(),
    elementType: container.elementType.expect("Missing <schemaelementart>"),
  };
}

function handleElementData(
  state: DataGroupState | DataFieldState,
  tag: sax.QualifiedTag
): State<unknown> {
  switch (tag.name) {
    case "xdf:bezeichnungEingabe":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.inputLabel
      );
    case "xdf:bezeichnungAusgabe":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.outputLabel
      );
    case "xdf:hilfetextEingabe":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.inputHelp
      );
    case "xdf:hilfetextAusgabe":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.outputHelp
      );
    case "xdf:schemaelementart":
      return createCodeNodeState(
        state,
        state.dataContainer.elementType,
        parseSchemaElementArt
      );
    default:
      return handleBaseData(state, tag);
  }
}
