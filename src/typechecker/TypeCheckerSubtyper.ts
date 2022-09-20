import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError, TypeCheckErrors } from "../errors/TypeCheckError";
import { AtlasType, Types } from "../primitives/AtlasType";
import { isIntersectionType } from "../primitives/IntersectionType";
import { isUnionType } from "../primitives/UnionType";
import { SynthesizeContext } from "../utils/Enums";
import { createSubtyper } from "./isSubtype";
import type { TypeChecker } from "./TypeChecker";

export class TypeCheckerSubtyper {
  synthesizeContext = SynthesizeContext.None;
  errors: TypeCheckError[] = [];

  constructor(public typechecker: TypeChecker) {}

  synthesize: typeof TypeCheckerSubtyper["prototype"]["synthesizeUnary"] &
    typeof TypeCheckerSubtyper["prototype"]["synthesizeBinary"] = (
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
      return this.synthesizeIntersection(() => {
        const t1s = isIntersectionType(t1) ? t1.types : [t1];
        const t2s = isIntersectionType(t2) ? t2.types : [t2];
        const errors: TypeCheckError[] = [];
        const types: AtlasType[] = [];

        for (const t1 of t1s) {
          for (const t2 of t2s) {
            try {
              types.push(fn(t1, t2));
            } catch (error) {
              if (!(error instanceof TypeCheckError)) throw error;
              errors.push(error);
            }
          }
        }

        return { types, errors };
      });
    } else {
      return fn(t1, t2);
    }
  }

  synthesizeUnary(t: AtlasType, fn: (t: AtlasType) => AtlasType): AtlasType {
    if (isUnionType(t)) {
      return Types.Union.init(t.types.map(t => this.synthesize(t, fn)));
    } else if (isIntersectionType(t)) {
      return this.synthesizeIntersection(() => {
        const errors: TypeCheckError[] = [];
        const types: AtlasType[] = [];

        for (const type of t.types) {
          try {
            types.push(fn(type));
          } catch (error) {
            if (!(error instanceof TypeCheckError)) throw error;
            errors.push(error);
          }
        }

        return { types, errors };
      });
    } else {
      return fn(t);
    }
  }

  synthesizeIntersection(
    getTypes: () => { types: AtlasType[]; errors: TypeCheckError[] }
  ): AtlasType {
    const enclosingContext = this.synthesizeContext;
    this.synthesizeContext = SynthesizeContext.Intersection;

    const { types, errors } = getTypes();
    if (types.length === 0) {
      this.errors.push(...errors);
      this.synthesizeContext = enclosingContext;
      return Types.Any;
    } else {
      this.synthesizeContext = enclosingContext;
      return Types.Intersection.init(types);
    }
  }

  check(
    source: SourceRangeable,
    actual: AtlasType,
    expected: AtlasType
  ): AtlasType {
    const { isSubtype, error } = createSubtyper()(actual, expected);
    if (isSubtype) return expected;

    return this.error(source, TypeCheckErrors.invalidSubtype(error));
  }

  error(source: SourceRangeable, message: SourceMessage): AtlasType {
    const error = new TypeCheckError(message, source.sourceRange());
    if (
      this.synthesizeContext === SynthesizeContext.None ||
      message.type === "warning"
    ) {
      this.errors.push(error);
      return Types.Any;
    } else {
      throw error;
    }
  }
}
