import { FunctionDeclaration, ProcedureDeclaration } from '../ast';
import { RuntimeValue } from './values';

export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;
  private variableTypes: Map<string, string>;
  private constants: Map<string, RuntimeValue>;
  private arrays: Map<string, RuntimeValue[]>;
  private arrayLengths: Map<string, number>;
  private functions: Map<string, FunctionDeclaration>;
  private procedures: Map<string, ProcedureDeclaration>;

  constructor(parentENV?: Environment) {
    this.parent = parentENV;
    this.variables = new Map<string, RuntimeValue>();
    this.variableTypes = new Map<string, string>();
    this.constants = new Map<string, RuntimeValue>();
    this.arrays = new Map<string, RuntimeValue[]>();
    this.arrayLengths = new Map<string, number>();
    this.functions = new Map<string, FunctionDeclaration>();
    this.procedures = new Map<string, ProcedureDeclaration>();
  }

  public declareVariable(
    name: string,
    type: string,
    index: number | null = null
  ): void {
    if (index) {
      this.arrays.set(name, []);
      this.arrayLengths.set(name, index);
      this.variableTypes.set(name, type);
      return;
    }
    if (this.variables.has(name)) {
      console.error(`Variable ${name} already declared`);
      process.exit(1);
    } else if (this.constants.has(name)) {
      console.error(`Constant ${name} already declared`);
      process.exit(1);
    }
    this.variableTypes.set(name, type);
    return;
  }

  public declareConstant(name: string, value: RuntimeValue): void {
    if (this.constants.has(name)) {
      console.error(`Constant ${name} already declared`);
      process.exit(1);
    }
    this.constants.set(name, value);
    return;
  }

  public assignVariable(
    name: string,
    value: RuntimeValue,
    index: RuntimeValue | null = null
  ): RuntimeValue {
    if (index) {
      const arr = this.arrays.get(name);
      if (value.type == 'Integer' || value.type == 'Real') {
        value = { type: 'number', value: value.value };
      }
      if (arr) {
        arr[index.value as number] = value;
        return value;
      }
      throw new Error(`Array ${name} not declared`);
    }

    if (this.constants.has(name)) {
      throw new Error(`Cannot assign to constant ${name}`);
    } else if (!this.variableTypes.get(name)) {
      // console.log(name)
      throw new Error(`Variable ${name} not declared`);
    } else if (
      this.variableTypes.get(name) !== value.type &&
      value.type !== 'number'
    ) {
      throw new Error(`Type mismatch: cannot assign ${value.type} to ${name}`);
    }

    this.variables.set(name, value);
    return value;
  }

  public resolve(variableName: string): Environment {
    if (this.variables.has(variableName)) {
      return this;
    }
    if (this.constants.has(variableName)) {
      return this;
    }
    if (this.variableTypes.has(variableName)) {
      return this;
    }
    if (this.parent) {
      return this.parent.resolve(variableName);
    }
    throw new Error(`Variable ${variableName} not declared`);
  }

  public lookUpVariable(
    name: string,
    index: number | null = null
  ): RuntimeValue {
    const env = this.resolve(name);
    if (index) {
      const arr = env.arrays.get(name);
      if (arr) {
        return arr[index];
      }
      throw new Error(`Array ${name} not declared`);
    }
    if (env.variables.has(name)) {
      return env.variables.get(name) as RuntimeValue;
    } else if (env.constants.has(name)) {
      return env.constants.get(name) as RuntimeValue;
    }
    throw new Error(`Variable ${name} not declared`);
  }

  public lookUpVariableType(name: string): string {
    const env = this.resolve(name);
    if (env.variableTypes.has(name)) {
      return env.variableTypes.get(name) as string;
    }
    throw new Error(`Variable ${name} not declared`);
  }

  public lookUpFunction(name: string): FunctionDeclaration {
    if (this.functions.has(name)) {
      return this.functions.get(name) as FunctionDeclaration;
    }
    if (this.parent) {
      return this.parent.lookUpFunction(name);
    }
    throw new Error(`Function ${name} not declared`);
  }

  public lookUpProcedure(name: string): ProcedureDeclaration | undefined {
    if (this.procedures.has(name)) {
      return this.procedures.get(name) as ProcedureDeclaration;
    }
    if (this.parent) {
      return this.parent.lookUpProcedure(name);
    }
    return undefined;
  }

  public declareFunction(name: string, func: FunctionDeclaration): void {
    if (this.functions.has(name)) {
      console.error(`Function ${name} already declared`);
      process.exit(1);
    }
    this.functions.set(name, func);
    return;
  }

  public declareProcedure(name: string, proc: ProcedureDeclaration): void {
    if (this.procedures.has(name)) {
      console.error(`Procedure ${name} already declared`);
      process.exit(1);
    }
    this.procedures.set(name, proc);
    return;
  }

  public setArrayArgument(name: string, content: any): void {
    this.arrays.set(name, content);
    return;
  }

  public arrayLookup(name: string): any {
    if (this.arrays.has(name)) {
      return this.arrays.get(name) as RuntimeValue[];
    }
    if (this.parent) {
      return this.parent.arrayLookup(name);
    }
    return undefined;
  }
}
