import { RuntimeValue } from './values';

export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;
  private variableTypes: Map<string, string>;

  constructor(parentENV?: Environment) {
    this.parent = parentENV;
    this.variables = new Map<string, RuntimeValue>();
    this.variableTypes = new Map<string, string>();
  }

  public declareVariable(name: string, type: string): void {
    this.variableTypes.set(name, type);
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
    if (this.parent) {
      return this.parent.resolve(variableName);
    }
    throw new Error(`Variable ${variableName} not declared`);
  }

  public lookUpVariable(name: string): RuntimeValue {
    const env = this.resolve(name);
    return env.variables.get(name) as RuntimeValue;
  }
}
