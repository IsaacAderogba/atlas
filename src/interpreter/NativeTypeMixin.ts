import { Class } from "../utils/types";

export class NativeTypeMixin {
  static readonly atlasClassName: string;
}

export function applyMixin(targetClass: Class, mixinClass: Class): void {
  Object.getOwnPropertyNames(mixinClass.prototype).forEach(name => {
    if (name === "constructor") return;
    const descriptor = Object.getOwnPropertyDescriptor(mixinClass.prototype, name);
    if (descriptor) {
      Object.defineProperty(targetClass.prototype, name, descriptor);
    }
  });
}
