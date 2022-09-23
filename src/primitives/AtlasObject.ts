import { Token } from "../ast/Token";
import { RuntimeError } from "../errors/RuntimeError";
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
import { GenericTypeMap } from "../typechecker/GenericUtils";

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

  get(name: string): AtlasValue | undefined {
    const value = this.fields.get(name);
    if (value) return value;

    const method = this.methods.get(name);
    if (method) return method.bind(this);

    return undefined
  }

  set(name: string, value: AtlasValue): void {
    if (isCallable(value)) {
      this.methods.set(name, value);
    } else {
      this.fields.set(name, value);
    }
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
  abstract bindGenerics(genericTypeMap: GenericTypeMap): AtlasType;

  internalFields = new Map<string, AtlasType>();
  internalMethods = new Map<string, CallableType & AtlasType>();
  generics: AtlasType[];

  constructor(
    properties: ObjectTypeProps = {},
    generics: AtlasType[] = []
  ) {
    this.generics = generics;
    for (const [name, value] of Object.entries(properties)) {
      this.setProp(name, value);
    }
  }

  get fields(): ObjectType["internalFields"] {
    return this.internalFields;
  }

  get methods(): ObjectType["internalMethods"] {
    return this.internalMethods;
  }

  setProp(name: string, value: AtlasType): void {
    if (isCallableType(value)) {
      this.internalMethods.set(name, value);
    } else {
      this.internalFields.set(name, value);
    }
  }

  get(name: string): AtlasType | undefined {
    const value = this.internalFields.get(name);
    if (value) return value;

    const method = this.internalMethods.get(name);
    if (method) return method;

    return undefined;
  }

  set(name: string, value: AtlasType): void {
    if (isCallableType(value)) {
      this.internalMethods.set(name, value);
    } else {
      this.internalFields.set(name, value);
    }
  }

  protected error(
    source: SourceRangeable,
    message: SourceMessage
  ): TypeCheckError {
    return new TypeCheckError(message, source.sourceRange());
  }
}
