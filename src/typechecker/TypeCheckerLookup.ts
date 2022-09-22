import { Stack } from "../utils/Stack";
import { globalTypeScope, TypeCheckerScope } from "./TypeCheckerScope";
import type { TypeChecker } from "./TypeChecker";
import { TypeCheckErrors } from "../errors/TypeCheckError";
import { Token } from "../ast/Token";
import { AtlasType, Types } from "../primitives/AtlasType";
import { VariableState } from "../utils/Enums";
import { Parameter } from "../ast/Node";
import { GenericType } from "../primitives/GenericType";
import { TypeModuleEnv } from "./TypeUtils";

export class TypeCheckerLookup {
  private scopes: Stack<TypeCheckerScope> = new Stack();
  private cachedModules: { [path: string]: TypeModuleEnv } = {};

  constructor(public typechecker: TypeChecker) {}

  cachedModule(path: string): TypeModuleEnv | undefined {
    return this.cachedModules[path];
  }

  setCachedModule(path: string, value: TypeModuleEnv): void {
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
        entry.state = VariableState.DEFINED;
        return entry.type;
      }
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

    return undefined;
  }

  defineModule(name: Token, { values, types }: TypeModuleEnv): void {
    this.defineValue(name, Types.Module.init(name.lexeme, values));
    this.defineType(name, Types.Module.init(name.lexeme, types));
  }

  defineType(name: Token, type: AtlasType): AtlasType {
    const scope = this.getScope();

    if (scope.typeScope.has(name.lexeme)) {
      return this.typechecker.subtyper.error(
        name,
        TypeCheckErrors.prohibitedTypeRedeclaration()
      );
    } else {
      scope.typeScope.set(name.lexeme, {
        type,
        source: name,
        state: VariableState.DEFINED,
      });
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

      const type = new GenericType(param.name.lexeme, constraint);
      this.defineType(param.name, constraint || type);
      return type;
    });
  }

  withModuleScope<T extends TypeCheckerScope>(callback: () => T): T {
    const enclosingScopes = this.scopes;
    this.scopes = new Stack();

    this.beginScope(globalTypeScope());
    const scope = callback();
    this.endScope();

    this.scopes = enclosingScopes;
    return scope;
  }

  beginScope(newScope = new TypeCheckerScope()): void {
    this.scopes.push(newScope);
  }

  endScope(): void {
    this.scopes.pop();
  }

  getScope(): TypeCheckerScope {
    const scope = this.scopes.peek();
    if (!scope) throw new Error("Expected scope");
    return scope;
  }
}
