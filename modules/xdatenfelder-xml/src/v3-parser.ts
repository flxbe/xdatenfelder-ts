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
  ValidationError,
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
  Datentyp,
  parseSchemaElementArt,
  RegelTyp,
  RelationType,
  parseRegelTyp,
  NormReference,
  Keyword,
  NS_XD3,
  Relation,
  parseRelationType,
  Feldart,
  parseFeldart,
  parseDatentyp,
  Vorbefuellung,
  parseVorbefuellung,
  Constraints,
} from "./schema-3";
import { assert } from "./util";

class RootState extends State {
  public value: Value<DataGroupMessage3> = new Value(
    "xdf:xdatenfelder.datenfeldgruppe.0103"
  );

  public onOpenTag(tag: sax.QualifiedTag): State {
    expectTag(tag.name, "xdf:xdatenfelder.datenfeldgruppe.0103");

    return new MessageState(this, this.value);
  }

  public onCloseTag(): State {
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

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:header":
        return new HeaderState(this, this.header);
      case "xdf:datenfeldgruppe":
        return new DataGroupState(this, (dataGroup) => {
          this.rootDataGroup.set(dataGroup.identifier);
        });
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(context: Context): State {
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

  public onOpenTag(tag: sax.QualifiedTag): State {
    switch (tag.name) {
      case "xdf:nachrichtID":
        return new StringNodeState(this, this.messageId);
      case "xdf:erstellungszeitpunkt":
        return new ValueNodeState(this, this.createdAt, parseDate);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(_context: Context): State {
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
  normReferences: NormReference[];
  keywords: Keyword[];
  relations: Relation[];
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
    normReferences: [],
    keywords: [],
    relations: [],
    inputLabel: new Value("xdf:bezeichnungEingabe"),
    outputLabel: new Value("xdf:bezeichnungAusgabe"),
    elementType: new Value("xdf:schemaelementart"),
    inputHelp: new Value("xdf:hilfetextEingabe"),
    outputHelp: new Value("xdf:hilfetextAusgabe"),
  };
}

function parseElementData(container: ElementContainer): ElementData {
  const [id, version] = container.identification.unwrap();
  const identifier = `${id}:${version}`;

  return {
    identifier,
    id,
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
    normReferences: container.normReferences,
    keywords: container.keywords,
    relations: container.relations,
    inputLabel: container.inputLabel.unwrap(),
    outputLabel: container.outputLabel.get(),
    elementType: container.elementType.unwrap(),
    inputHelp: container.inputHelp.get(),
    outputHelp: container.outputHelp.get(),
  };
}

function handleElementState(
  state: State,
  container: ElementContainer,
  tag: sax.QualifiedTag
): State | undefined {
  switch (tag.name) {
    case "xdf:identifikation":
      return new IdentificationState(state, container.identification);
    case "xdf:name":
      return new StringNodeState(state, container.name);
    case "xdf:beschreibung":
      return new OptionalStringNodeState(state, container.description);
    case "xdf:definition":
      return new OptionalStringNodeState(state, container.definition);
    case "xdf:freigabestatus":
      return new CodeNodeState(
        state,
        container.releaseState,
        parseFreigabeStatus
      );
    case "xdf:statusGesetztAm":
      return new OptionalValueNodeState(state, container.stateSetAt, parseDate);
    case "xdf:statusGesetztDurch":
      return new OptionalStringNodeState(state, container.stateSetBy);
    case "xdf:bezug":
      return new NormReferenceState(state, tag, (ref) =>
        container.normReferences.push(ref)
      );
    case "xdf:versionshinweis":
      return new OptionalStringNodeState(state, container.versionHint);
    case "xdf:veroeffentlichungsdatum":
      return new OptionalValueNodeState(
        state,
        container.publishedAt,
        parseDate
      );
    case "xdf:schemaelementart":
      return new CodeNodeState(
        state,
        container.elementType,
        parseSchemaElementArt
      );
    case "xdf:bezeichnungEingabe":
      return new StringNodeState(state, container.inputLabel);
    case "xdf:bezeichnungAusgabe":
      return new OptionalStringNodeState(state, container.outputLabel);
    case "xdf:hilfetextEingabe":
      return new OptionalStringNodeState(state, container.inputHelp);
    case "xdf:hilfetextAusgabe":
      return new OptionalStringNodeState(state, container.outputHelp);
    case "xdf:letzteAenderung":
      return new ValueNodeState(state, container.lastChangedAt, parseDate);
    case "xdf:gueltigAb":
      return new ValueNodeState(state, container.validSince, parseDate);
    case "xdf:gueltigBis":
      return new ValueNodeState(state, container.validUntil, parseDate);
    case "xdf:stichwort":
      return new KeywordState(state, tag, (keyword) =>
        container.keywords.push(keyword)
      );
    case "xdf:relation":
      return new RelationState(state, (relation) =>
        container.relations.push(relation)
      );
    default:
      return undefined;
  }
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

  public onOpenTag(tag: sax.QualifiedTag): State {
    const newState = handleElementState(this, this.elementContainer, tag);
    if (newState) {
      return newState;
    }

    switch (tag.name) {
      case "xdf:regel":
        return new RuleState(this, (rule) => {
          this.ruleRefs.push(rule.identifier);
        });
      case "xdf:struktur":
        return new StructureState(this, (child) => {
          if (child.type === "dataGroup") {
            const { dataGroup } = child;
            this.children.push({
              type: "dataGroup",
              identifier: dataGroup.identifier,
              cardinality: child.cardinality,
              normReferences: child.normReferences,
            });
          } else {
            const { dataField } = child;
            this.children.push({
              type: "dataField",
              identifier: dataField.identifier,
              cardinality: child.cardinality,
              normReferences: child.normReferences,
            });
          }
        });
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(context: Context): State {
    const data = parseElementData(this.elementContainer);

    const dataGroup = {
      ...data,
      rules: this.ruleRefs,
      children: this.children,
    };

    context.dataGroups[dataGroup.identifier] = dataGroup;
    this.onFinish(dataGroup);

    return this.parent;
  }
}

class DataFieldState extends State {
  private parent: State;
  private onFinish: FinishFn<DataField>;

  private elementContainer = createElementContainer();
  private inputType: Value<Feldart> = new Value("xdf:feldart");
  private dataType: Value<Datentyp> = new Value("xdf:datentyp");
  private fillType: Value<Vorbefuellung> = new Value("xdf:vorbefuellung");
  private constraints: Value<Constraints> = new Value("xdf:praezisierung");
  private content: Value<string | undefined> = new Value("xdf:inhalt");
  private codeKey: Value<string | undefined> = new Value("xdf:codeKey");
  private nameKey: Value<string | undefined> = new Value("xdf:nameKey");
  private helpKey: Value<string | undefined> = new Value("xdf:helpKey");
  private maxSize: Value<number | undefined> = new Value("xdf:maxSize");
  private mediaTypes: string[] = [];
  private rules: string[] = [];

  constructor(parent: State, onFinish: FinishFn<DataField>) {
    super();

    this.parent = parent;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    const newState = handleElementState(this, this.elementContainer, tag);
    if (newState) {
      return newState;
    }

    switch (tag.name) {
      case "xdf:feldart":
        return new CodeNodeState(this, this.inputType, parseFeldart);
      case "xdf:datentyp":
        return new CodeNodeState(this, this.dataType, parseDatentyp);
      case "xdf:regel":
        return new RuleState(this, (rule) => this.rules.push(rule.identifier));
      case "xdf:vorbefuellung":
        return new CodeNodeState(this, this.fillType, parseVorbefuellung);
      case "xdf:praezisierung":
        return new ConstraintsState(this, this.constraints, tag);
      case "xdf:codeKey":
        return new OptionalStringNodeState(this, this.codeKey);
      case "xdf:nameKey":
        return new OptionalStringNodeState(this, this.nameKey);
      case "xdf:helpKey":
        return new OptionalStringNodeState(this, this.helpKey);
      case "xdf:inhalt":
        return new OptionalStringNodeState(this, this.content);
      case "xdf:werte":
      case "xdf:codelisteReferenz":
        return new NoOpState(this);
      case "xdf:maxSize":
        return new OptionalValueNodeState(this, this.maxSize, parseInt);
      case "xdf:mediaType":
        return new MediaTypeState(this, (mediaType) =>
          this.mediaTypes.push(mediaType)
        );
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(context: Context): State {
    const data = parseElementData(this.elementContainer);

    const dataField = {
      ...data,
      inputType: this.inputType.unwrap(),
      dataType: this.dataType.unwrap(),
      fillType: this.fillType.unwrap(),
      constraints: this.constraints.get() ?? {},
      content: this.content.get(),
      codeKey: this.codeKey.get(),
      nameKey: this.nameKey.get(),
      helpKey: this.helpKey.get(),
      maxSize: this.maxSize.get(),
      mediaTypes: this.mediaTypes,
      rules: this.rules,
    };

    context.dataFields[dataField.identifier] = dataField;
    this.onFinish(dataField);

    return this.parent;
  }
}

class MediaTypeState extends State {
  private parent: State;
  private onFinish: FinishFn<string>;

  private value?: string = undefined;

  constructor(parent: State, onFinish: FinishFn<string>) {
    super();

    this.parent = parent;
    this.onFinish = onFinish;
  }

  public onText(text: string): void {
    this.value = text;
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    throw new UnexpectedTagError(tag.name);
  }

  public onCloseTag(_context: Context): State {
    if (this.value) {
      this.onFinish(this.value);
    }

    return this.parent;
  }
}

class ConstraintsState extends State {
  private parent: State;
  private value: Value<Constraints>;

  private constraints: Constraints = {};

  constructor(parent: State, value: Value<Constraints>, tag: sax.QualifiedTag) {
    super();

    this.parent = parent;
    this.value = value;

    const minLength = getAttribute(tag, "minLength");
    if (minLength !== undefined) {
      this.constraints.minLength = parseInt(minLength);
    }

    const maxLength = getAttribute(tag, "maxLength");
    if (maxLength !== undefined) {
      this.constraints.maxLength = parseInt(maxLength);
    }

    this.constraints.minValue = getAttribute(tag, "minValue");
    this.constraints.maxValue = getAttribute(tag, "maxValue");
    this.constraints.pattern = getAttribute(tag, "pattern");
  }

  public onText(text: string): void {
    this.constraints.value = text;
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    throw new UnexpectedTagError(tag.name);
  }

  public onCloseTag(_context: Context): State {
    this.value.set(this.constraints);

    return this.parent;
  }
}

type Child =
  | {
      type: "dataGroup";
      dataGroup: DataGroup;
      cardinality: string;
      normReferences: NormReference[];
    }
  | {
      type: "dataField";
      dataField: DataField;
      cardinality: string;
      normReferences: NormReference[];
    };

class StructureState extends State {
  private parent: State;
  private onFinish: FinishFn<Child>;

  private element: Value<Element> = new Value("xdf:enthaelt");
  private normReferences: NormReference[] = [];
  private cardinality: Value<string> = new Value("xdf:anzahl");

  constructor(parent: State, onFinish: FinishFn<Child>) {
    super();

    this.parent = parent;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    switch (tag.name) {
      case "xdf:bezug":
        return new NormReferenceState(this, tag, (ref) =>
          this.normReferences.push(ref)
        );
      case "xdf:anzahl":
        return new StringNodeState(this, this.cardinality);
      case "xdf:enthaelt":
        return new ContainsState(this, this.element);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(_context: Context): State {
    const element = this.element.unwrap();
    const child = {
      ...element,
      cardinality: this.cardinality.unwrap(),
      normReferences: this.normReferences,
    };

    this.onFinish(child);

    return this.parent;
  }
}

type Element =
  | { type: "dataGroup"; dataGroup: DataGroup }
  | { type: "dataField"; dataField: DataField };

class ContainsState extends State {
  private parent: State;
  private parentValue: Value<Element>;

  private value?: Element = undefined;

  constructor(parent: State, value: Value<Element>) {
    super();

    this.parent = parent;
    this.parentValue = value;
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    if (this.value !== undefined) {
      throw new DuplicateTagError("xdf:datenfeld | xdf:datenfeldgruppe");
    }

    switch (tag.name) {
      case "xdf:datenfeldgruppe":
        return new DataGroupState(this, (dataGroup) => {
          this.value = { type: "dataGroup", dataGroup };
        });
      case "xdf:datenfeld":
        return new DataFieldState(this, (dataField) => {
          this.value = { type: "dataField", dataField };
        });
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }
  public onCloseTag(_context: Context): State {
    if (this.value === undefined) {
      throw new MissingChildNodeError("xdf:datenfeld | xdf:datenfeldgruppe");
    }

    this.parentValue.set(this.value);

    return this.parent;
  }
}

class RelationState extends State {
  private parent: State;
  private onFinish: FinishFn<Relation>;

  private type: Value<RelationType> = new Value("xdf:praedikat");
  private identification: Value<[string, string]> = new Value("xdf:objekt");

  constructor(parent: State, onFinish: FinishFn<Relation>) {
    super();

    this.parent = parent;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    switch (tag.name) {
      case "xdf:praedikat":
        return new CodeNodeState(this, this.type, parseRelationType);
      case "xdf:objekt":
        return new IdentificationState(this, this.identification);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(_context: Context): State {
    const type = this.type.unwrap();
    const [id, version] = this.identification.unwrap();
    const identifier = `${id}:${version}`;

    this.onFinish({ type, identifier });

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
  private freeFormDefinition: Value<string | undefined> = new Value(
    "xdf:freitextRegel"
  );
  private creator: Value<string | undefined> = new Value(
    "xdf:fachlicherErsteller"
  );
  private lastChangedAt: Value<Date> = new Value("xdf:letzteAenderung");
  private type: Value<RegelTyp> = new Value("xdf:typ");
  private script: Value<string | undefined> = new Value("xdf:skript");
  private normReferences: NormReference[] = [];
  private keywords: Keyword[] = [];

  constructor(parent: State, onFinish: FinishFn<Rule>) {
    super();

    this.parent = parent;
    this.onFinish = onFinish;
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    switch (tag.name) {
      case "xdf:identifikation":
        return new IdentificationState(this, this.identification);
      case "xdf:name":
        return new StringNodeState(this, this.name);
      case "xdf:beschreibung":
        return new OptionalStringNodeState(this, this.description);
      case "xdf:freitextRegel":
        return new OptionalStringNodeState(this, this.freeFormDefinition);
      case "xdf:fachlicherErsteller":
        return new OptionalStringNodeState(this, this.creator);
      case "xdf:letzteAenderung":
        return new ValueNodeState(this, this.lastChangedAt, parseDate);
      case "xdf:typ":
        return new CodeNodeState(this, this.type, parseRegelTyp);
      case "xdf:skript":
        return new OptionalStringNodeState(this, this.script);
      case "xdf:bezug":
        return new NormReferenceState(this, tag, (ref) =>
          this.normReferences.push(ref)
        );
      case "xdf:stichwort":
        return new KeywordState(this, tag, (keyword) =>
          this.keywords.push(keyword)
        );

      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(context: Context): State {
    const [id, version] = this.identification.unwrap();
    const identifier = `${id}:${version}`;

    const rule = {
      identifier,
      id,
      version,
      name: this.name.unwrap(),
      description: this.description.get(),
      freeFormDefinition: this.freeFormDefinition.get(),
      creator: this.creator.get(),
      lastChangedAt: this.lastChangedAt.unwrap(),
      type: this.type.unwrap(),
      script: this.script.get(),
      normReferences: this.normReferences,
      keywords: this.keywords,
    };

    context.rules[identifier] = rule;
    this.onFinish(rule);

    return this.parent;
  }
}

class KeywordState extends State {
  private parent: State;
  private uri: string | undefined;
  private onFinish: FinishFn<Keyword>;
  private value: Value<string | undefined> = new Value("xdf:stichwort");

  constructor(
    parent: State,
    tag: sax.QualifiedTag,
    onFinish: FinishFn<NormReference>
  ) {
    super();

    this.parent = parent;
    this.onFinish = onFinish;

    this.uri = getAttribute(tag, "uri");
  }

  public onText(text: string): void {
    this.value.set(text);
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    throw new UnexpectedTagError(tag.name);
  }

  public onCloseTag(_context: Context): State {
    const value = this.value.get();
    if (value !== undefined) {
      this.onFinish({ value, uri: this.uri });
    } else {
      if (this.uri !== undefined) {
        throw new ValidationError(
          "<xdf:stichwort> with an uri attribute needs a non-empty content"
        );
      }
    }

    return this.parent;
  }
}

class NormReferenceState extends State {
  private parent: State;
  private link: string | undefined;
  private onFinish: FinishFn<NormReference>;
  private value: Value<string | undefined> = new Value("xdf:bezug");

  constructor(
    parent: State,
    tag: sax.QualifiedTag,
    onFinish: FinishFn<NormReference>
  ) {
    super();

    this.parent = parent;
    this.onFinish = onFinish;

    this.link = getAttribute(tag, "link");
  }

  public onText(text: string): void {
    this.value.set(text);
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    throw new UnexpectedTagError(tag.name);
  }

  public onCloseTag(_context: Context): State {
    const value = this.value.get();
    if (value !== undefined) {
      this.onFinish({ value, link: this.link });
    } else {
      if (this.link !== undefined) {
        throw new ValidationError(
          "<xdf:bezug> with a link attribute needs a non-empty content"
        );
      }
    }

    return this.parent;
  }
}

function getAttribute(tag: sax.QualifiedTag, key: string): string | undefined {
  const attribute = tag.attributes[key];
  if (attribute === undefined) {
    return undefined;
  } else {
    assert(typeof attribute === "object");
    return attribute.value;
  }
}

class IdentificationState extends State {
  private parent: State;
  private value: Value<[string, string]>;

  private id: Value<string> = new Value("xdf:id");
  private version: Value<string> = new Value("xdf:version");

  constructor(parent: State, value: Value<[string, string]>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag): State {
    switch (tag.name) {
      case "xdf:id":
        return new StringNodeState(this, this.id);
      case "xdf:version":
        return new StringNodeState(this, this.version);
      default:
        throw new UnexpectedTagError(tag.name);
    }
  }

  public onCloseTag(): State {
    const id = this.id.unwrap();
    const version = this.version.unwrap();
    this.value.set([id, version]);

    return this.parent;
  }
}

class DataGroupMessageParser {
  private stateParser: StateParser;

  constructor() {
    this.stateParser = new StateParser(new RootState(), NS_XD3);
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
