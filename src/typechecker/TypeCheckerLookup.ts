import { Stack } from "../utils/Stack";
import { globalTypeScope, TypeCheckerScope } from "./TypeCheckerScope";
import type { TypeChecker } from "./TypeChecker";
import { TypeCheckErrors } from "../errors/TypeCheckError";
import { Token } from "../ast/Token";
import { AtlasType } from "../primitives/AtlasType";
import { ClassType, VariableState } from "../utils/Enums";
import { GetExpr, SetExpr } from "../ast/Expr";

export class TypeCheckerLookup {
  private readonly scopes: Stack<TypeCheckerScope> = new Stack();
  readonly globalScope = globalTypeScope();

  constructor(public typechecker: TypeChecker) {}

  value(name: Token): AtlasType {
    const type = this.scopedValue(name.lexeme);
    if (type) return type;
    return this.typechecker.error(
      name,
      TypeCheckErrors.undefinedValue(name.lexeme)
    );
  }

  type(name: Token): AtlasType {
    for (const scope of this.scopes) {
      const entry = scope.typeScope.get(name.lexeme);
      if (entry) return this.settleType(name, entry.type);
    }

    const entry = this.globalScope.typeScope.get(name.lexeme);
    if (entry) return this.settleType(name, entry.type);

    return this.typechecker.error(
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

  field({ name, object }: GetExpr | SetExpr): AtlasType {
    const objectType = this.typechecker.acceptExpr(object);
    
    const memberType = objectType.get(name);
    if (memberType) return memberType;
    return this.typechecker.error(
      name,
      TypeCheckErrors.undefinedProperty(name.lexeme)
    );
  }

  defineType(name: Token, type: AtlasType): AtlasType {
    const scope = this.getScope();

    if (scope.typeScope.has(name.lexeme)) {
      return this.typechecker.error(
        name,
        TypeCheckErrors.prohibitedTypeRedeclaration()
      );
    } else {
      scope.typeScope.set(name.lexeme, {
        type,
        source: name,
        state: VariableState.DEFINED,
      });
      return type
    }
  }

  settleType(name: Token, type: AtlasType): AtlasType {
    this.getScope().typeScope.set(name.lexeme, {
      type,
      state: VariableState.SETTLED,
      source: name,
    });
    return type;
  }

  declareValue(name: Token, type: AtlasType): AtlasType {
    this.getScope().valueScope.set(name.lexeme, type);
    return type;
  }

  defineValue(name: Token, type: AtlasType): AtlasType {
    this.getScope().valueScope.set(name.lexeme, type);
    return type;
  }

  beginScope(newScope = new TypeCheckerScope()): void {
    this.scopes.push(newScope);
  }

  endScope(): void {
    const scope = this.scopes.pop();
    if (scope && this.typechecker.currentClass === ClassType.NONE) {
      for (const { state, source } of scope.typeScope.values()) {
        if (state === VariableState.DEFINED && source) {
          this.typechecker.error(source, TypeCheckErrors.unusedType());
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
