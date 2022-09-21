import { Stack } from "../utils/Stack";
import { globalTypeScope, TypeCheckerScope } from "./TypeCheckerScope";
import type { TypeChecker } from "./TypeChecker";
import { TypeCheckErrors } from "../errors/TypeCheckError";
import { Token } from "../ast/Token";
import { AtlasType, Types } from "../primitives/AtlasType";
import { ClassType, VariableState } from "../utils/Enums";
import { Parameter } from "../ast/Node";
import { GenericType } from "../primitives/GenericType";
import { TypeModuleEntry } from "./TypeUtils";

export class TypeCheckerLookup {
  private readonly scopes: Stack<TypeCheckerScope> = new Stack();
  readonly globalScope = globalTypeScope();
  private cachedModules: { [path: string]: TypeModuleEntry } = {};

  constructor(public typechecker: TypeChecker) {}

  cachedModule(path: string): TypeModuleEntry | undefined {
    return this.cachedModules[path];
  }

  setCachedModule(path: string, value: TypeModuleEntry): void {
    this.cachedModules[path] = value;
  }

  value(name: Token): AtlasType {
    const type = this.scopedValue(name.lexeme);
    if (type) return type;
    return this.typechecker.subtyper.error(
      name,
      TypeCheckErrors.undefinedValue(name.lexeme)
    );
  }

  type(name: Token): AtlasType {
    for (const scope of this.scopes) {
      const entry = scope.typeScope.get(name.lexeme);
      if (entry) {
        entry.state = VariableState.SETTLED;
        return entry.type;
      }
    }

    const entry = this.globalScope.typeScope.get(name.lexeme);
    if (entry) {
      entry.state = VariableState.SETTLED;
      return entry.type;
    }

    return this.typechecker.subtyper.error(
      name,
      TypeCheckErrors.undefinedType(name.lexeme)
    );
  }

  scopedValue(name: string): AtlasType | undefined {
    for (const scope of this.scopes) {
      const type = scope.valueScope.get(name);
      if (type) return type;
    }

    const type = this.globalScope.valueScope.get(name);
    if (type) return type;

    return undefined;
  }

  defineModule(name: Token, { values, types }: TypeModuleEntry): void {
    this.defineValue(name, Types.Module.init(name.lexeme, values));
    this.defineType(
      name,
      Types.Module.init(name.lexeme, types),
      VariableState.SETTLED
    );
  }

  defineType(
    name: Token,
    type: AtlasType,
    state = VariableState.DEFINED
  ): AtlasType {
    const scope = this.getScope();

    if (scope.typeScope.has(name.lexeme)) {
      return this.typechecker.subtyper.error(
        name,
        TypeCheckErrors.prohibitedTypeRedeclaration()
      );
    } else {
      scope.typeScope.set(name.lexeme, { type, source: name, state });
      return type;
    }
  }

  declareValue(name: Token, type: AtlasType): AtlasType {
    this.getScope().valueScope.set(name.lexeme, type);
    return type;
  }

  defineValue(name: Token, type: AtlasType): AtlasType {
    this.getScope().valueScope.set(name.lexeme, type);
    return type;
  }

  defineGenerics(parameters: Parameter[]): GenericType[] {
    return parameters.map(param => {
      const constraint = param.baseType
        ? this.typechecker.acceptTypeExpr(param.baseType)
        : undefined;

      const type = new GenericType(param, constraint);
      this.defineType(param.name, constraint || type);
      return type;
    });
  }

  beginScope(newScope = new TypeCheckerScope()): void {
    this.scopes.push(newScope);
  }

  endScope(): void {
    const scope = this.scopes.pop();
    if (scope && this.typechecker.currentClass === ClassType.NONE) {
      for (const { state, source } of scope.typeScope.values()) {
        if (state === VariableState.DEFINED && source) {
          this.typechecker.subtyper.error(source, TypeCheckErrors.unusedType());
        }
      }
    }
  }

  getScope(): TypeCheckerScope {
    const scope = this.scopes.peek();
    if (!scope) throw new Error("Expected scope");
    return scope;
  }
}
