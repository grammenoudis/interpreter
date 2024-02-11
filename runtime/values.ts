export type ValueType = 'number' | 'boolean' | 'string' | 'array';

export interface RuntimeValue {
  type: ValueType;
  value: number | boolean | string | RuntimeValue[];
}

export interface NumberValue extends RuntimeValue {
  type: 'number';
  value: number;
}

export function makeNumberValue(value: number): NumberValue {
  return { type: 'number', value };
}

export interface BooleanValue extends RuntimeValue {
  type: 'boolean';
  value: boolean;
}

export function makeBooleanValue(value: boolean): BooleanValue {
  return { type: 'boolean', value };
}

export interface StringValue extends RuntimeValue {
  type: 'string';
  value: string;
}

export function makeStringValue(value: string): StringValue {
  return { type: 'string', value };
}
