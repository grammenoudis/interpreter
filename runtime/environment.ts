import { RuntimeValue } from './values';

export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;
  private variableTypes: Map<string, string>;
  private constants: Map<string, RuntimeValue>;

  constructor(parentENV?: Environment) {
    this.parent = parentENV;
    this.variables = new Map<string, RuntimeValue>();
    this.variableTypes = new Map<string, string>();
    this.constants = new Map<string, RuntimeValue>();
  }

  public declareVariable(name: string, type: string): void {
    this.variableTypes.set(name, type);
    return;
  }

  public declareConstant(name: string, value: RuntimeValue): void {
    this.constants.set(name, value);
    return;
  }

  public assignVariable(name: string, value: RuntimeValue): RuntimeValue {
    if (this.variableTypes.get(name) !== value.type) {
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
      console.log(variableName);
      return this;
    }
    if (this.parent) {
      return this.parent.resolve(variableName);
    }
    throw new Error(`Variable ${variableName} not declared`);
  }

  public lookUpVariable(name: string): RuntimeValue {
    const env = this.resolve(name);
    // return env.variables.get(name) as RuntimeValue;
    if (env.variables.has(name)) {
      return env.variables.get(name) as RuntimeValue;
    } else if (env.constants.has(name)) {
      return env.constants.get(name) as RuntimeValue;
    }
    throw new Error(`Variable ${name} not declared`);
  }
}
