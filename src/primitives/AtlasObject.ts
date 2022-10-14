import { RuntimeError } from "../errors/RuntimeError";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError } from "../errors/TypeCheckError";
import { AtlasType } from "./AtlasType";
import { AtlasValue } from "./AtlasValue";
import { GenericTypeMap, GenericVisitedMap } from "../typechecker/GenericUtils";
import { maybeBindCallable } from "./AtlasCallable";

export type AtlasObjectProps = { [key: string]: AtlasValue };

export abstract class AtlasObject {
  abstract type: string;
  abstract toString(): string;
  fields = new Map<string, AtlasValue>();

  constructor(properties: AtlasObjectProps = {}) {
    this.fields = new Map(Object.entries(properties));
  }

  get(name: string): AtlasValue | undefined {
    return maybeBindCallable(this, this.fields.get(name));
  }

  set(name: string, value: AtlasValue): void {
    this.fields.set(name, value);
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
  abstract bindGenerics(
    genericTypeMap: GenericTypeMap,
    visitedSet: GenericVisitedMap
  ): AtlasType;

  internalFields = new Map<string, AtlasType>();
  generics: AtlasType[];

  constructor(properties: ObjectTypeProps = {}, generics: AtlasType[] = []) {
    this.generics = generics;
    this.internalFields = new Map(Object.entries(properties));
  }

  get fields(): ObjectType["internalFields"] {
    return this.internalFields;
  }

  get(name: string): AtlasType | undefined {
    const value = this.internalFields.get(name);
    if (value) return value;

    return undefined;
  }

  set(name: string, value: AtlasType): void {
    this.internalFields.set(name, value);
  }

  protected error(
    source: SourceRangeable,
    message: SourceMessage
  ): TypeCheckError {
    return new TypeCheckError(message, source.sourceRange());
  }
}
