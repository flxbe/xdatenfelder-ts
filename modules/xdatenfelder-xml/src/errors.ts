import sax from "sax";

export class ParserError extends Error {
  constructor(message: string, line: number, column: number) {
    super(`${message} (line ${line}, column ${column})`);
    this.name = "ParserError";
  }

  public static fromInternalError(
    error: InternalParserError,
    parser: sax.SAXParser
  ): ParserError {
    // The parser starts counting the lines at 0
    const actualLine = parser.line + 1;

    return new ParserError(error.message, actualLine, parser.column);
  }
}

export class InternalParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InternalParserError";
  }
}

export class UnknownNamespaceError extends InternalParserError {
  constructor(prefix: string, uri: string) {
    super(`Unknown namespace ${prefix}: ${uri}`);
    this.name = "UnknownNamespaceError";
  }
}

export class ValidationError extends InternalParserError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnexpectedTagError extends InternalParserError {
  constructor(tagName: string) {
    super(`Unexpected node <${tagName}>`);
    this.name = "UnexpectedTagError";
  }
}

export class MissingChildNodeError extends InternalParserError {
  constructor(name: string) {
    super(`Missing child node <${name}>`);
    this.name = "MissingChildNodeError";
  }
}

export class MissingContentError extends InternalParserError {
  constructor(parentName: string) {
    super(`Missing content in node <${parentName}>`);
    this.name = "MissingContentError";
  }
}

export class DuplicateTagError extends InternalParserError {
  constructor(tagName: string) {
    super(`Duplicate node <${tagName}>`);
    this.name = "DuplicateTagError";
  }
}
