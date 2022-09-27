import { SourceRangeable } from "../errors/SourceError";
import { typeGlobals } from "../globals";
import { AtlasType, Types, ValueTypes } from "../primitives/AtlasType";
import { VariableState } from "../utils/Enums";
import { Scope } from "../utils/Scope";

export class TypeCheckerScope {
  readonly typeScope: Scope<{
    type: AtlasType;
    state: VariableState;
    source?: SourceRangeable;
  }>;
  readonly valueScope: Scope<AtlasType>;

  constructor({
    typeScope = new Scope(),
    valueScope = new Scope(),
  }: Partial<TypeCheckerScope> = {}) {
    this.typeScope = typeScope;
    this.valueScope = valueScope;
  }
}

export const globalTypeScope = (): TypeCheckerScope =>
  new TypeCheckerScope({
    typeScope: Scope.fromGlobals(Types, (_, type) => ({
      type,
      state: VariableState.DEFINED,
    })),
    valueScope: Scope.fromGlobals(
      { ...typeGlobals, ...ValueTypes },
      (_, type) => type
    ),
  });
