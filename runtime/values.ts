export type ValueType =
  | 'number'
  | 'Boolean'
  | 'String'
  | 'array'
  | 'Integer'
  | 'Real';

export interface RuntimeValue {
  type: ValueType;
  value: number | boolean | string | RuntimeValue[];
}

export interface NumberValue extends RuntimeValue {
  type: 'Integer' | 'Real' | 'number';
  value: number;
}

export function makeIntegerValue(value: number): NumberValue {
  return { type: 'Integer', value };
}

export function makeRealValue(value: number): NumberValue {
  return { type: 'Real', value };
}
export interface BooleanValue extends RuntimeValue {
  type: 'Boolean';
  value: boolean;
}

export function makeBooleanValue(value: boolean): BooleanValue {
  return { type: 'Boolean', value };
}

export interface StringValue extends RuntimeValue {
  type: 'String';
  value: string;
}

export function makeStringValue(value: string): StringValue {
  return { type: 'String', value };
}
