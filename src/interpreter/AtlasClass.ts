import { AtlasCallable, isCallable } from "./AtlasCallable";
import { AtlasInstance } from "./AtlasInstance";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, AtlasObjectProps } from "./AtlasObject";
import { Interpreter } from "./Interpreter";
import { Token } from "../ast/Token";
import { RuntimeErrors } from "../errors/RuntimeError";

export class AtlasClass extends AtlasObject implements AtlasCallable {
  readonly type = "CLASS";
  name: string;
  staticClass?: AtlasClass;

  constructor(
    name: string,
    properties: AtlasObjectProps = {},
    staticClass?: AtlasClass
  ) {
    super({ ...properties });

    this.name = name;
    this.staticClass = staticClass;
  }

  arity(): number {
    return this.findMethod("init")?.arity() || 0;
  }

  bind(): AtlasClass {
    return this;
  }

  get(name: Token): AtlasValue {
    if (this.staticClass) {
      const field = this.staticClass.fields.get(name.lexeme);
      if (field) return field;

      const method = this.staticClass.methods.get(name.lexeme);
      if (method) return method.bind(this);
    }

    throw this.error(name, RuntimeErrors.undefinedProperty(name.lexeme));
  }

  set(name: Token, value: AtlasValue): void {
    if (this.staticClass) {
      if (isCallable(value)) {
        this.staticClass.methods.set(name.lexeme, value);
      } else {
        this.staticClass.fields.set(name.lexeme, value);
      }
      return;
    }

    throw this.error(name, RuntimeErrors.undefinedProperty(name.lexeme));
  }

  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue {
    const instance = new AtlasInstance(this, this.fields);
    return (
      this.findMethod("init")?.bind(instance).call(interpreter, args) ??
      instance
    );
  }

  findMethod(name: string): (AtlasCallable & AtlasValue) | undefined {
    return this.methods.get(name);
  }

  toString(): string {
    return this.name;
  }
}
