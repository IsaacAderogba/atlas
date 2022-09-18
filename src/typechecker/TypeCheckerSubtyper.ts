import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError, TypeCheckErrors } from "../errors/TypeCheckError";
import { AtlasType, Types } from "../primitives/AtlasType";
import { isIntersectionType } from "../primitives/IntersectionType";
import { isUnionType } from "../primitives/UnionType";
import { SynthesizeContext } from "../utils/Enums";
import { isSubtype } from "./isSubtype";
import type { TypeChecker } from "./TypeChecker";

export class TypeCheckerSubtyper {
  synthesizeContext = SynthesizeContext.None;
  errors: TypeCheckError[] = [];

  constructor(public typechecker: TypeChecker) {}

  synthesize: typeof this.synthesizeUnary & typeof this.synthesizeBinary = (
    ...args: any[]
  ) => {
    switch (args.length) {
      case 2:
        return this.synthesizeUnary(args[0], args[1]);
      case 3:
        return this.synthesizeBinary(args[0], args[1], args[2]);
      default:
        throw new Error("Error");
    }
  };

  synthesizeBinary(
    t1: AtlasType,
    t2: AtlasType,
    fn: (t1: AtlasType, t2: AtlasType) => AtlasType
  ): AtlasType {
    if (isUnionType(t1) || isUnionType(t2)) {
      const t1s = isUnionType(t1) ? t1.types : [t1];
      const t2s = isUnionType(t2) ? t2.types : [t2];
      const ts: AtlasType[] = [];
      for (const t1 of t1s) {
        for (const t2 of t2s) {
          ts.push(this.synthesize(t1, t2, fn));
        }
      }
      return Types.Union.init(ts);
    } else if (isIntersectionType(t1) && isIntersectionType(t2)) {
      const t1s = isIntersectionType(t1) ? t1.types : [t1];
      const t2s = isIntersectionType(t2) ? t2.types : [t2];
      const ts: AtlasType[] = [];
      for (const t1 of t1s) {
        for (const t2 of t2s) {
          ts.push(this.synthesize(t1, t2, fn));
        }
      }
      return Types.Union.init(ts);
    } else {
      return fn(t1, t2);
    }
  }

  synthesizeUnary(t: AtlasType, fn: (t: AtlasType) => AtlasType): AtlasType {
    if (isUnionType(t)) {
      return Types.Union.init(t.types.map(t => this.synthesize(t, fn)));
    } else if (isIntersectionType(t)) {
      return Types.Intersection.init(t.types.map(t => this.synthesize(t, fn)));
    } else {
      return fn(t);
    }
  }

  check(
    source: SourceRangeable,
    actual: AtlasType,
    expected: AtlasType
  ): AtlasType {
    if (isSubtype(actual, expected)) return expected;

    return this.error(
      source,
      TypeCheckErrors.invalidSubtype(expected.toString(), actual.toString())
    );
  }

  error(source: SourceRangeable, message: SourceMessage): AtlasType {
    const error = new TypeCheckError(message, source.sourceRange());
    this.errors.push(error);
    return Types.Any;
  }
}
