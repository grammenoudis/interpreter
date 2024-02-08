import { RuntimeValue } from './values';

export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;

  constructor(parentENV?: Environment) {
    this.parent = parentENV;
    this.variables = new Map<string, RuntimeValue>();
  }

  public declareVariable(name: string, value: RuntimeValue): RuntimeValue {
    this.variables.set(name, value);
    return value;
  }

  public assignVariable(name: string, value: RuntimeValue): RuntimeValue {
    const env = this.resolve(name);
    env.variables.set(name, value);
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
