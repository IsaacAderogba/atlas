import { Token } from "../ast/Token";
import { RuntimeError, RuntimeErrors } from "../errors/RuntimeError";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError } from "../errors/TypeCheckError";
import {
  AtlasCallable,
  CallableType,
  isCallable,
  isCallableType,
} from "./AtlasCallable";
import { AtlasType } from "./AtlasType";
import { AtlasValue } from "./AtlasValue";

export type AtlasObjectProps = { [key: string]: AtlasValue };

export abstract class AtlasObject {
  abstract type: string;
  abstract toString(): string;
  methods = new Map<string, AtlasCallable & AtlasValue>();
  fields = new Map<string, AtlasValue>();

  constructor(properties: AtlasObjectProps = {}) {
    for (const [name, value] of Object.entries(properties)) {
      if (isCallable(value)) {
        this.methods.set(name, value);
      } else {
        this.fields.set(name, value);
      }
    }
  }

  get(name: Token): AtlasValue {
    const value = this.fields.get(name.lexeme);
    if (value) return value;

    const method = this.methods.get(name.lexeme);
    if (method) return method.bind(this);

    throw this.error(name, RuntimeErrors.undefinedProperty(name.lexeme));
  }

  set(name: Token, value: AtlasValue): void {
    this.fields.set(name.lexeme, value);
  }

  protected error(
    source: SourceRangeable,
    message: SourceMessage
  ): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}

export type ObjectTypeProps = { [key: string]: AtlasType };

export abstract class ObjectType {
  abstract type: string;
  abstract toString(): string;
  abstract isSubtype(candidate: ObjectType): boolean;

  fields = new Map<string, AtlasType>();
  methods = new Map<string, CallableType & AtlasType>();

  constructor(properties: ObjectTypeProps = {}) {
    for (const [name, value] of Object.entries(properties)) {
      this.setProp(name, value);
    }
  }

  setProp(name: string, value: AtlasType): void {
    if (isCallableType(value)) {
      this.methods.set(name, value);
    } else {
      this.fields.set(name, value);
    }
  }

  get(name: Token): AtlasType | undefined {
    const value = this.fields.get(name.lexeme);
    if (value) return value;

    const method = this.methods.get(name.lexeme);
    if (method) return method;

    return undefined;
  }

  set(name: Token, value: AtlasType): void {
    this.fields.set(name.lexeme, value);
  }

  protected error(
    source: SourceRangeable,
    message: SourceMessage
  ): TypeCheckError {
    return new TypeCheckError(message, source.sourceRange());
  }
}
