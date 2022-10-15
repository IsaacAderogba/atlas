import {
  AssignExpr,
  BinaryExpr,
  CallableTypeExpr,
  CallExpr,
  CompositeTypeExpr,
  Expr,
  FunctionExpr,
  GenericTypeExpr,
  GetExpr,
  GetTypeExpr,
  GroupingExpr,
  isFunctionExpr,
  isSubTypeExpr,
  ListExpr,
  LiteralExpr,
  LogicalExpr,
  RecordExpr,
  SetExpr,
  SubTypeExpr,
  TernaryExpr,
  ThisExpr,
  TypeExpr,
  UnaryExpr,
  VariableExpr,
} from "../ast/Expr";
import { Property } from "../ast/Node";
import {
  BlockStmt,
  ClassStmt,
  ExpressionStmt,
  IfStmt,
  ImportStmt,
  InterfaceStmt,
  ModuleStmt,
  PanicStmt,
  ReturnStmt,
  Stmt,
  TypeStmt,
  VarStmt,
  WhileStmt,
} from "../ast/Stmt";
import { SourceRange, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError, TypeCheckErrors } from "../errors/TypeCheckError";
import { isAnyType } from "../primitives/AnyType";
import { isCallableType } from "../primitives/AtlasCallable";
import { isAtlasString } from "../primitives/AtlasString";
import { Types, AtlasType } from "../primitives/AtlasType";
import { FunctionEnum } from "../utils/Enums";
import { TypeCheckerLookup } from "./TypeCheckerLookup";
import {
  CurrentInterface,
  CurrentFunction,
  TypeModuleEnv,
  TypeVisitor,
} from "./TypeUtils";
import { TypeCheckerSubtyper } from "./TypeCheckerSubtyper";
import { globalTypeScope, TypeCheckerScope } from "./TypeCheckerScope";
import { AtlasAPI } from "../AtlasAPI";
import { isGenericType } from "../primitives/GenericType";
import { isAliasType } from "../primitives/AliasType";

export class TypeChecker implements TypeVisitor {
  readonly lookup = new TypeCheckerLookup(this);
  readonly subtyper = new TypeCheckerSubtyper(this);
  currentFunction?: CurrentFunction;
  currentInterface?: CurrentInterface;

  constructor(private readonly atlas: AtlasAPI) {}

  typeCheck(statements: Stmt[]): { errors: TypeCheckError[] } {
    this.lookup.beginScope(globalTypeScope());
    for (const statement of statements) {
      this.acceptStmt(statement);
    }
    this.lookup.endScope();

    return { errors: this.subtyper.errors };
  }

  acceptStmt(statement: Stmt): void {
    statement.accept(this);
  }

  acceptExpr(expression: Expr, expectedType?: AtlasType): AtlasType {
    return expression.accept(this, expectedType);
  }

  acceptTypeExpr(typeExpr: TypeExpr, expectedType?: AtlasType): AtlasType {
    return typeExpr.accept(this, expectedType);
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.lookup.beginScope();
    for (const statement of stmt.statements) this.acceptStmt(statement);
    this.lookup.endScope();
  }

  visitBreakStmt(): void {
    // no op
  }

  visitClassStmt({ name, properties, typeExpr, parameters }: ClassStmt): void {
    const classType = Types.Class.init(name.lexeme);

    const enclosingClass = this.currentInterface;
    this.currentInterface = { type: classType };
    this.lookup.defineValue(name, classType);
    this.lookup.beginScope();

    // prepare for type synthesis and checking
    classType.generics = this.lookup.defineGenerics(parameters);

    const fields: Property[] = [];
    const methods: Property[] = [];
    for (const prop of properties) {
      const props = isFunctionExpr(prop.initializer) ? methods : fields;
      props.push(prop);
    }

    // type check and define fields in scope
    for (const prop of fields) {
      const type = this.visitProperty(prop);
      classType.set(prop.name.lexeme, type);
    }

    // *only* type functions
    for (const { type, name } of methods) {
      const value = type
        ? this.acceptTypeExpr(type)
        : this.subtyper.error(
            name,
            TypeCheckErrors.requiredFunctionAnnotation()
          );

      classType.set(name.lexeme, value);
    }

    // create "this" now that everything has been typed
    this.lookup.getScope().valueScope.set("this", classType.returns);

    // with all functions typed, we can finally check them
    for (const prop of methods) {
      const { name, type } = prop;
      console.log("type function", name.lexeme);

      const prev = classType.findField(name.lexeme);
      const expected =
        !isAnyType(prev) && type ? this.acceptTypeExpr(type) : prev;

      classType.set(
        name.lexeme,
        this.visitProperty(
          prop,
          name.lexeme === "init" ? FunctionEnum.INIT : FunctionEnum.METHOD,
          expected
        )
      );
    }
    console.log("end");

    // assert the type if an `implements` keyword was used
    if (typeExpr) {
      const { file, start } = name.sourceRange();
      this.subtyper.check(
        new SourceRange(file, start, typeExpr.sourceRange().end),
        classType,
        this.acceptTypeExpr(typeExpr)
      );
    }

    this.lookup.endScope();
    this.currentInterface = enclosingClass;
  }

  visitContinueStmt(): void {
    // no op
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.acceptExpr(stmt.expression);
  }

  visitIfStmt(stmt: IfStmt): void {
    const conditionActual = this.acceptExpr(stmt.condition);
    this.subtyper.check(stmt.condition, conditionActual, Types.Boolean);

    this.acceptStmt(stmt.thenBranch);
    if (stmt.elseBranch) this.acceptStmt(stmt.elseBranch);
  }

  visitInterfaceStmt(stmt: InterfaceStmt): void {
    const interfaceType = Types.Interface.init(stmt.name.lexeme, {}, []);
    const enclosingClass = this.currentInterface;
    this.currentInterface = { type: interfaceType };

    this.lookup.defineType(stmt.name, interfaceType);

    this.lookup.beginScope();

    interfaceType.generics = this.lookup.defineGenerics(stmt.parameters);
    stmt.entries.forEach(({ key, value }) => {
      const type = this.acceptTypeExpr(value);
      this.lookup.defineType(key, type);
      interfaceType.set(key.lexeme, type);
    });

    this.lookup.endScope();
    this.currentInterface = enclosingClass;
  }

  visitImportStmt({ modulePath, name }: ImportStmt): void {
    if (!isAtlasString(modulePath.literal)) throw new Error("invariant");

    this.atlas.reader.readFile(
      modulePath.literal.value,
      ({ statements, errors, file }) => {
        const cachedModule = this.lookup.cachedModule(file.module);

        if (cachedModule) {
          this.lookup.defineModule(name, cachedModule);
        } else {
          if (this.atlas.reportErrors(errors)) process.exit(0);
          const moduleEnv = this.visitModule(statements);
          this.lookup.defineModule(name, moduleEnv);
          this.lookup.setCachedModule(file.module, moduleEnv);
        }
      }
    );
  }

  visitModuleStmt({ name, block }: ModuleStmt): void {
    this.lookup.defineModule(name, this.visitModule(block.statements));
  }

  visitPanicStmt(stmt: PanicStmt): void {
    this.acceptExpr(stmt.value);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    const value = this.acceptExpr(stmt.value, this.currentFunction?.expected);
    if (this.currentFunction && this.currentFunction.returns) {
      this.currentFunction.returns = Types.Union.init([
        this.currentFunction.returns,
        value,
      ]);
    } else if (this.currentFunction) {
      this.currentFunction.returns = value;
    }
  }

  visitVarStmt(stmt: VarStmt): void {
    this.visitProperty(stmt.property, FunctionEnum.FUNCTION);
  }

  visitTypeStmt(stmt: TypeStmt): void {
    this.lookup.beginScope();

    const generics = this.lookup.defineGenerics(stmt.parameters);
    const alias = Types.Alias.init(
      stmt.name.lexeme,
      this.acceptTypeExpr(stmt.type),
      generics
    );

    this.lookup.endScope();
    this.lookup.defineType(stmt.name, alias);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    const conditionActual = this.acceptExpr(stmt.condition);
    this.subtyper.check(stmt.condition, conditionActual, Types.Boolean);
    this.acceptStmt(stmt.body);
  }

  visitAssignExpr(expr: AssignExpr): AtlasType {
    const expected = this.lookup.value(expr.name);
    const actual = this.acceptExpr(expr.value, expected);
    return this.subtyper.check(expr.value, actual, expected);
  }

  visitBinaryExpr(expr: BinaryExpr): AtlasType {
    return this.subtyper.synthesize(
      this.acceptExpr(expr.left),
      this.acceptExpr(expr.right),
      (left, right) => {
        switch (expr.operator.type) {
          case "HASH":
            this.subtyper.check(expr.left, left, Types.String);
            this.subtyper.check(expr.right, right, Types.String);
            return Types.String;
          case "PLUS":
          case "MINUS":
          case "SLASH":
          case "STAR":
            this.subtyper.check(expr.left, left, Types.Number);
            this.subtyper.check(expr.right, right, Types.Number);
            return Types.Number;
          case "GREATER":
          case "GREATER_EQUAL":
          case "LESS":
          case "LESS_EQUAL":
            this.subtyper.check(expr.left, left, Types.Number);
            this.subtyper.check(expr.right, right, Types.Number);
            return Types.Boolean;
          case "COLON_EQUAL":
          case "EQUAL_EQUAL":
          case "BANG_EQUAL":
            return Types.Boolean;
          default:
            return this.subtyper.error(
              expr.operator,
              TypeCheckErrors.unexpectedBinaryOperator()
            );
        }
      }
    );
  }

  visitCallExpr(expr: CallExpr): AtlasType {
    const { callee, open, close, args, typeExprs } = expr;
    return this.subtyper.synthesize(this.acceptExpr(callee), calleeType => {
      if (isAnyType(calleeType)) return calleeType;

      let type: AtlasType | undefined;
      if (typeExprs.length > 0) {
        type = this.visitGenericCall(
          expr,
          calleeType,
          expr.typeExprs.map(expr => this.acceptTypeExpr(expr))
        );
      } else {
        if (calleeType.generics.length > 0) {
          return this.subtyper.error(
            callee,
            TypeCheckErrors.requiredGenericArgs()
          );
        }
        type = calleeType;
      }

      if (isAnyType(type)) return type;
      if (!isCallableType(type)) {
        return this.subtyper.error(
          callee,
          TypeCheckErrors.expectedCallableType()
        );
      }

      if (type.arity() !== args.length) {
        return this.subtyper.error(
          new SourceRange(open.sourceRange().file, open, close),
          TypeCheckErrors.mismatchedArity(type.arity(), args.length)
        );
      }

      type.params.forEach((expected, i) => {
        const actual = this.acceptExpr(args[i], expected);
        this.subtyper.check(args[i], actual, expected);
      });

      return type.returns;
    });
  }

  visitFunctionExpr(
    expr: FunctionExpr,
    expected = this.subtyper.error(
      expr,
      TypeCheckErrors.requiredFunctionAnnotation()
    )
  ): AtlasType {
    console.log("visitFunctionExpr");
    return this.visitFunction({
      expr,
      enumType: FunctionEnum.FUNCTION,
      expected,
    });
  }

  visitGetExpr(expr: GetExpr): AtlasType {
    return this.visitGetter(expr);
  }

  visitTernaryExpr(expr: TernaryExpr): AtlasType {
    const conditionActual = this.acceptExpr(expr.expression);
    this.subtyper.check(expr.expression, conditionActual, Types.Boolean);

    const thenResult = this.acceptExpr(expr.thenBranch);
    const elseResult = this.acceptExpr(expr.elseBranch);

    return (
      this.subtyper.check(expr.thenBranch, thenResult, elseResult) &&
      this.subtyper.check(expr.elseBranch, elseResult, thenResult)
    );
  }

  visitGroupingExpr(expr: GroupingExpr): AtlasType {
    return this.acceptExpr(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): AtlasType {
    switch (expr.value.type) {
      case "Null":
        return Types.Null;
      case "Boolean":
        return Types.Boolean;
      case "Number":
        return Types.Number;
      case "String":
        return Types.String;
      default:
        throw this.subtyper.error(
          expr,
          TypeCheckErrors.unexpectedLiteralType(expr.value.type)
        );
    }
  }

  visitListExpr(expr: ListExpr): AtlasType {
    const types = expr.items.map(item => this.acceptExpr(item));
    const actual = types.length ? Types.Union.init(types) : Types.Any;
    return Types.List.init(actual);
  }

  visitLogicalExpr(expr: LogicalExpr): AtlasType {
    return this.subtyper.synthesize(
      this.acceptExpr(expr.left),
      this.acceptExpr(expr.right),
      (left, right) => {
        switch (expr.operator.type) {
          case "PIPE_PIPE":
          case "AMPERSAND_AMPERSAND":
            this.subtyper.check(expr.left, left, Types.Boolean);
            this.subtyper.check(expr.right, right, Types.Boolean);
            return Types.Boolean;
          default:
            return this.subtyper.error(
              expr.operator,
              TypeCheckErrors.unexpectedLogicalOperator()
            );
        }
      }
    );
  }

  visitRecordExpr(expr: RecordExpr): AtlasType {
    // const type = expected && isInterfaceType(expected) ? expected : undefined;
    const types = expr.entries.map(({ value }) => this.acceptExpr(value));
    const actual = types.length ? Types.Union.init(types) : Types.Any;
    return Types.Record.init(actual);
  }

  visitSetExpr(expr: SetExpr): AtlasType {
    const expected = this.visitGetter(expr);
    const actual = this.acceptExpr(expr.value, expected);
    return this.subtyper.check(expr.value, actual, expected);
  }

  visitThisExpr(expr: ThisExpr): AtlasType {
    return this.lookup.value(expr.keyword);
  }

  visitUnaryExpr(expr: UnaryExpr): AtlasType {
    return this.subtyper.synthesize(this.acceptExpr(expr.right), right => {
      switch (expr.operator.type) {
        case "BANG":
          this.subtyper.check(expr.right, right, Types.Boolean);
          return Types.Boolean;
        case "MINUS":
          this.subtyper.check(expr.right, right, Types.Number);
          return Types.Number;
        default:
          return this.subtyper.error(
            expr.operator,
            TypeCheckErrors.unexpectedUnaryOperator()
          );
      }
    });
  }

  visitVariableExpr(expr: VariableExpr): AtlasType {
    return this.lookup.value(expr.name);
  }

  visitCallableTypeExpr(typeExpr: CallableTypeExpr): AtlasType {
    this.lookup.beginScope();
    const params = typeExpr.paramTypes.map(p => this.acceptTypeExpr(p));
    const returns = this.acceptTypeExpr(typeExpr.returnType);
    this.lookup.endScope();
    return Types.Function.init({ params, returns });
  }

  visitCompositeTypeExpr(typeExpr: CompositeTypeExpr): AtlasType {
    switch (typeExpr.operator.type) {
      case "PIPE":
        return Types.Union.init([
          this.acceptTypeExpr(typeExpr.left),
          this.acceptTypeExpr(typeExpr.right),
        ]);
      case "AMPERSAND":
        return Types.Intersection.init([
          this.acceptTypeExpr(typeExpr.left),
          this.acceptTypeExpr(typeExpr.right),
        ]);
      default:
        return this.subtyper.error(
          typeExpr.operator,
          TypeCheckErrors.unexpectedCompositeOperator()
        );
    }
  }

  visitGetTypeExpr({ object, name }: GetTypeExpr): AtlasType {
    const objectType = this.acceptTypeExpr(object);
    if (isAnyType(objectType)) return objectType;

    const memberType = objectType.get(name.lexeme);
    if (memberType) return memberType;

    return this.subtyper.error(
      name,
      TypeCheckErrors.unknownProperty(name.lexeme)
    );
  }

  visitGenericTypeExpr(expr: GenericTypeExpr): AtlasType {
    const type = isSubTypeExpr(expr.callee)
      ? this.lookup.type(expr.callee.name)
      : this.acceptTypeExpr(expr.callee);

    return this.visitGenericCall(
      expr,
      type,
      expr.typeExprs.map(expr => this.acceptTypeExpr(expr))
    );
  }

  visitSubTypeExpr(expr: SubTypeExpr): AtlasType {
    const type = this.lookup.type(expr.name);
    if (type.generics.length > 0) {
      return this.subtyper.error(expr, TypeCheckErrors.requiredGenericArgs());
    }
    return type;
  }

  // utils
  visitModule(statements: Stmt[]): TypeModuleEnv {
    const scope = this.lookup.withModuleScope(() => {
      const scope = new TypeCheckerScope();
      this.lookup.beginScope(scope);
      for (const statement of statements) this.acceptStmt(statement);
      this.lookup.endScope();
      return scope;
    });

    const values: { [key: string]: AtlasType } = {};
    for (const [key, value] of scope.valueScope.entries()) {
      values[key] = value;
    }

    const types: { [key: string]: AtlasType } = {};
    for (const [key, { type }] of scope.typeScope.entries()) {
      types[key] = type;
    }

    return { values, types };
  }

  visitGenericCall(
    source: SourceRangeable,
    genericType: AtlasType,
    actuals: AtlasType[]
  ): AtlasType {
    /**
     * Don't bind generics from the current class context
     * Only matters during the initial typechecking phase when not all methods have been created
     */
    if (this.currentInterface) {
      const { type } = this.currentInterface;
      if (type === genericType && type.type === "Interface") {
        console.log("skipped");
        return genericType;
      }
    }

    if (genericType.generics.length !== actuals.length) {
      return this.subtyper.error(
        source,
        TypeCheckErrors.mismatchedArity(
          genericType.generics.length,
          actuals.length
        )
      );
    }

    const genericTypeMap = new Map(
      genericType.generics.map((generic, i) => {
        let actual = actuals[i];
        if (isGenericType(generic) && generic.constraint) {
          actual = this.subtyper.check(source, actual, generic.constraint);
        }

        return [generic, actual];
      })
    );

    return genericType.bindGenerics(genericTypeMap, new Map());
  }

  visitGetter({ name, object }: GetExpr | SetExpr): AtlasType {
    return this.subtyper.synthesize(this.acceptExpr(object), objectType => {
      const memberType = objectType.get(name.lexeme);
      if (isAnyType(objectType)) return objectType;

      if (memberType) return memberType;
      return this.subtyper.error(
        name,
        TypeCheckErrors.unknownProperty(name.lexeme)
      );
    });
  }

  private visitProperty(
    { initializer: expr, name, type }: Property,
    enumType: FunctionEnum = FunctionEnum.FUNCTION,
    expectedType?: AtlasType
  ): AtlasType {
    if (isFunctionExpr(expr) && type) {
      const expected = expectedType || this.acceptTypeExpr(type);
      this.lookup.declareValue(name, expected);
      console.log("visitProperty");
      const value = this.visitFunction({ expr, enumType, expected });

      return this.lookup.defineValue(name, value);
    } else if (isFunctionExpr(expr)) {
      return this.subtyper.error(
        expr,
        TypeCheckErrors.requiredFunctionAnnotation()
      );
    } else {
      const expected = type ? this.acceptTypeExpr(type) : undefined;

      if (expr) {
        let actual = this.acceptExpr(expr, expected);
        if (expected) actual = this.subtyper.check(expr, actual, expected);

        return this.lookup.defineValue(name, actual);
      } else if (expected) {
        return this.lookup.defineValue(name, expected);
      } else {
        return this.subtyper.error(
          name,
          TypeCheckErrors.requiredAnnotationOrInitializer()
        );
      }
    }
  }

  private visitFunction(current: CurrentFunction): AtlasType {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = current;
    this.lookup.beginScope();

    const { expr, expected } = current;

    let unwrapped = expected;
    while (isAliasType(unwrapped)) {
      unwrapped = unwrapped.wrapped;
    }

    const expectedParams = isCallableType(unwrapped) ? unwrapped.params : [];
    const params = expr.params.map(({ name }, i) => {
      this.lookup.defineValue(name, expectedParams[i] || Types.Any);
      return expectedParams[i] || Types.Any;
    });

    for (const statement of expr.body.statements) this.acceptStmt(statement);

    const returns =
      this.currentInterface &&
      this.currentFunction.enumType === FunctionEnum.INIT
        ? this.lookup.scopedValue("this")
        : this.currentFunction.returns;

    // console.log("actual return", {
    //   actual: isInstanceType(returns) ? returns.classType : returns,
    //   // @ts-ignore
    //   expected: unwrapped?.returns,
    // });

    const actual = Types.Function.init({
      params,
      returns: returns || Types.Null,
    });

    this.lookup.endScope();
    this.currentFunction = enclosingFunction;
    // @ts-ignore
    // console.log({ actual: actual.returns, expected: unwrapped.returns });
    return this.subtyper.check(expr, actual, expected);
  }
}
