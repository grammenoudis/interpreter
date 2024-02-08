import { ValueType, RuntimeValue, NumberValue } from './values';
import {
  BinaryExpression,
  Identifier,
  NodeTypes,
  NumericLiteral as NumericLiteral,
  Program,
  Statement,
} from '../ast';
import Environment from './environment';

function evaluateProgram(program: Program, env: Environment): RuntimeValue {
  let lastEvaluated: RuntimeValue = { type: 'number', value: 0 } as NumberValue;
  for (const statement of program.body) {
    lastEvaluated = evaluate(statement, env);
    console.log(lastEvaluated);
  }
  return lastEvaluated;
}
export function evaluateBinaryExpression(
  BinOp: BinaryExpression,
  env: Environment
): RuntimeValue {
  const left = evaluate(BinOp.left, env);
  const right = evaluate(BinOp.right, env);

  if (typeof left.value !== 'number' || typeof right.value !== 'number') {
    console.error(
      `Expected number, got ${typeof left.value} and ${typeof right.value}`
    );
    process.exit(1);
  }
  switch (BinOp.operator) {
    case '+':
      return { type: 'number', value: left.value + right.value } as NumberValue;
    case '-':
      return { type: 'number', value: left.value - right.value } as NumberValue;
    case '*':
      return { type: 'number', value: left.value * right.value } as NumberValue;
    case '/':
      return { type: 'number', value: left.value / right.value } as NumberValue;
    case '^':
      return {
        type: 'number',
        value: Math.pow(left.value, right.value),
      } as NumberValue;
    case 'MOD':
      return { type: 'number', value: left.value % right.value } as NumberValue;
    case 'DIV':
      return {
        type: 'number',
        value: Math.floor(left.value / right.value),
      } as NumberValue;
    default:
      console.error(`Unknown operator: ${BinOp.operator}`);
      process.exit(1);
  }
}

function evaluateIdentifier(
  ASTnode: Identifier,
  env: Environment
): RuntimeValue {
  const value = env.lookUpVariable(ASTnode.name);
  if (value === undefined) {
    console.error(`Undefined variable: ${ASTnode.name}`);
    process.exit(1);
  }
  return value;
}

function evaluateIdentifierExpression(
  ASTnode: Identifier,
  env: Environment,
  value: RuntimeValue
): RuntimeValue {
  const val = env.declareVariable(ASTnode.name, {
    type: 'number',
    value: value.value,
  } as NumberValue);
  return val;
}

export function evaluate(ASTnode: Statement, env: Environment): RuntimeValue {
  switch (ASTnode.type) {
    case 'Identifier':
      return evaluateIdentifier(ASTnode as Identifier, env);
    case 'NumberLiteral':
      return {
        type: 'number',
        value: (ASTnode as NumericLiteral).value,
      } as NumberValue;
    case 'BinaryExpression':
      return evaluateBinaryExpression(ASTnode as BinaryExpression, env);
    case 'Program':
      return evaluateProgram(ASTnode as Program, env);
    case 'AssignmentExpression':
      let value = evaluate((ASTnode as any).value, env);
      console.log(value.value);
      return evaluateIdentifierExpression(
        (ASTnode as any).identifier,
        env,
        value
      );
    case 'UnaryExpression':
      if ((ASTnode as any).operator === '-') {
        return {
          type: 'number',
          value: -((ASTnode as any).right as RuntimeValue).value,
        } as NumberValue;
      } else {
        return {
          type: 'number',
          value: ((ASTnode as any).right as RuntimeValue).value,
        } as NumberValue;
      }

    default:
      console.error(`Unknown AST node type: ${(ASTnode as any).type}`);
      process.exit(1);
  }
}
