import { ValueType, RuntimeValue, NumberValue } from './values';
import * as fs from 'fs';
import {
  BinaryExpression,
  Identifier,
  NodeTypes,
  NumericLiteral as NumericLiteral,
  Program,
  Statement,
} from '../ast';
import Environment from './environment';
import { TokenType } from '../lexer';

var outputList: any = [];
var errorMessage: string | undefined;

function evaluateProgram(program: Program, env: Environment): any {
  // let lastEvaluated: RuntimeValue = { type: 'number', value: 0 } as NumberValue;
  for (const statement of program.body) {
    evaluate(statement, env);
    if (errorMessage) return errorMessage;
    // console.log(lastEvaluated);
  }
  return outputList;
}
export function evaluateBinaryExpression(
  BinOp: BinaryExpression,
  env: Environment
): RuntimeValue {
  const right = evaluate(BinOp.right, env);
  const left = evaluate(BinOp.left, env);

  if (left.type === 'Boolean' && right.type === 'Boolean')
    switch (BinOp.operator) {
      case 'ΚΑΙ':
        return { type: 'Boolean', value: left.value && right.value } as any;
      case 'Ή':
        return { type: 'Boolean', value: left.value || right.value } as any;
    }

  switch (BinOp.operator) {
    case '<':
      return { type: 'Boolean', value: left.value < right.value } as any;
    case '>':
      return { type: 'Boolean', value: left.value > right.value } as any;
    case '<=':
      return { type: 'Boolean', value: left.value <= right.value } as any;
    case '>=':
      return { type: 'Boolean', value: left.value >= right.value } as any;
    case '<>':
      return { type: 'Boolean', value: left.value !== right.value } as any;
    case '=':
      return { type: 'Boolean', value: left.value === right.value } as any;
  }

  if (typeof left.value !== 'number' || typeof right.value !== 'number') {
    errorMessage = `Expected number, got ${typeof left.value} and ${typeof right.value}`;
    return {} as NumberValue;
  }
  switch (BinOp.operator) {
    case '+':
      return { type: 'number', value: left.value + right.value } as NumberValue;
    case '-':
      return { type: 'number', value: left.value - right.value } as NumberValue;
    case '*':
      return { type: 'number', value: left.value * right.value } as NumberValue;
    case '/':
      if (right.value === 0) {
        errorMessage = `Η διαίρεση με το μηδέν δεν επιτρέπεται (${left.value} / ${right.value})`;
      }
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
  env: Environment,
  index: RuntimeValue | undefined
): RuntimeValue {
  let value;
  if (index) {
    value = env.lookUpVariable(ASTnode.name, index.value as number);
  } else value = env.lookUpVariable(ASTnode.name);
  if (value === undefined) {
    errorMessage = `Undefined variable: ${ASTnode.name}`;
  }
  return value;
}

function evaluateIdentifierExpression(
  ASTnode: Identifier,
  env: Environment,
  value: RuntimeValue
): RuntimeValue {
  const val = env.assignVariable(ASTnode.name, value);
  return val;
}

function evaluateForStatement(ASTnode: any, env: Environment): RuntimeValue {
  // if (
  //   ASTnode.identifier.type !== TokenType.Identifier ||
  //   ASTnode.start.type !== 'NumberLiteral' ||
  //   ASTnode.end.type !== 'NumberLiteral' ||
  //   ASTnode.step.type !== 'NumberLiteral'
  // ) {
  //   errorMessage = 'Λάθος στην δήλωση του for';
  //   return {} as NumberValue;
  // }

  let start = evaluate(ASTnode.start, env);
  if (
    start.type !== 'Integer' &&
    start.type !== 'Real' &&
    start.type !== 'number'
  ) {
    errorMessage = 'Η αρχική τιμή του for πρέπει να είναι αριθμός';
    return {} as NumberValue;
  }
  env.assignVariable(ASTnode.identifier.value, start);

  let end = evaluate(ASTnode.end, env);
  if (end.type !== 'Integer' && end.type !== 'Real' && end.type !== 'number') {
    errorMessage = 'Η τελική τιμή του for πρέπει να είναι αριθμός';
    return {} as NumberValue;
  }
  let step = evaluate(ASTnode.step, env);
  if (
    step.type !== 'Integer' &&
    step.type !== 'Real' &&
    step.type !== 'number'
  ) {
    errorMessage = 'Το βήμα του for πρέπει να είναι αριθμός';
    return {} as NumberValue;
  }

  if (step.value === 0) {
    errorMessage = 'Το βήμα του for δεν μπορεί να είναι 0';
    return {} as NumberValue;
  }

  while (start.value != (end.value as any) + (step.value as any)) {
    for (const statement of ASTnode.body) {
      evaluate(statement, env);
    }
    start.value =
      (env.lookUpVariable(ASTnode.identifier.value).value as any) + step.value;
    if ((step.value as any) > 0 && start.value > end.value) break;
    if ((step.value as any) < 0 && start.value < end.value) break;
  }
  return {} as NumberValue;
}

function evaluateDoWhileStatement(
  ASTnode: any,
  env: Environment
): RuntimeValue {
  for (const statement of ASTnode.body) evaluate(statement, env);
  let condition = evaluate(ASTnode.condition, env);
  if (condition.type !== 'Boolean') {
    errorMessage = 'Η συνθήκη του while πρέπει να είναι λογική τιμή';
    return {} as NumberValue;
  }
  while (!condition.value) {
    for (const statement of ASTnode.body) {
      evaluate(statement, env);
    }
    condition = evaluate(ASTnode.condition, env);
    if (condition.type !== 'Boolean') {
      errorMessage = 'Η συνθήκη του while πρέπει να είναι λογική τιμή';
      return {} as NumberValue;
    }
  }
  return {} as NumberValue;
}

function evaluateWhileStatement(ASTnode: any, env: Environment): RuntimeValue {
  let condition = evaluate(ASTnode.condition, env);
  if (condition.type !== 'Boolean') {
    errorMessage = 'Η συνθήκη του while πρέπει να είναι λογική τιμή';
    return {} as NumberValue;
  }
  while (condition.value) {
    for (const statement of ASTnode.body) {
      evaluate(statement, env);
    }
    condition = evaluate(ASTnode.condition, env);
    if (condition.type !== 'Boolean') {
      errorMessage = 'Η συνθήκη του while πρέπει να είναι λογική τιμή';
      return {} as NumberValue;
    }
  }
  return {} as NumberValue;
}

function evaluateReadInputStatement(
  ASTnode: any,
  env: Environment
): RuntimeValue {
  let keyboardFile = fs.readFileSync('keyboard.txt', 'utf8');
  let lines = keyboardFile.split('\n');
  for (const identifierName of ASTnode.identifiers) {
    let identifier = identifierName.value;
    let line = lines.shift()?.trim();
    if (line === undefined) {
      errorMessage = `Δεν υπάρχει είσοδος για το ${identifier}`;
      return {} as NumberValue;
    }
    let valueType = env.lookUpVariableType(identifier);
    if (valueType === 'Integer') {
      let value = parseInt(line);
      if (isNaN(value)) {
        errorMessage = `Αναμενόταν ακέραιος για το ${identifier}`;
        return {} as NumberValue;
      }
      env.assignVariable(identifier, { type: 'Integer', value: value });
    } else if (valueType === 'Real') {
      let value = parseFloat(line);
      if (isNaN(value)) {
        errorMessage = `Αναμενόταν πραγματικός για το ${identifier}`;
        return {} as NumberValue;
      }
      env.assignVariable(identifier, { type: 'Real', value: value });
    } else if (valueType === 'String') {
      env.assignVariable(identifier, { type: 'String', value: line });
    } else if (valueType === 'Boolean') {
      errorMessage = 'Δεν υποστηρίζεται η είσοδος λογικής τιμής';
    }
  }
  return {} as NumberValue;
}

function evaluateIfStatement(ASTnode: any, env: Environment): RuntimeValue {
  const condition = evaluate(ASTnode.condition, env);
  if (condition.value) {
    for (const statement of ASTnode.consequent) {
      if (statement.type === 'IfStatement') {
        return evaluateIfStatement(statement, env);
      } else {
        evaluate(statement, env);
      }
    }
    return {} as NumberValue;
  } else if (ASTnode.alternate) {
    if (ASTnode.alternate.type === 'IfStatement') {
      return evaluateIfStatement(ASTnode.alternate, env);
    }
    for (const statement of ASTnode.alternate) {
      if (statement.type === 'IfStatement') {
        return evaluateIfStatement(statement, env);
      } else {
        evaluate(statement, env);
      }
    }
    return {} as NumberValue;
  }
  return {} as NumberValue;
}

export function evaluate(ASTnode: Statement, env: Environment): RuntimeValue {
  switch (ASTnode.type) {
    case 'Identifier':
      let arrayIndex;
      if ((ASTnode as any).index)
        arrayIndex = evaluate((ASTnode as any).index, env);
      return evaluateIdentifier(ASTnode as Identifier, env, arrayIndex);
    case 'NumberLiteral':
      return {
        type: Number.isInteger((ASTnode as NumericLiteral).value)
          ? 'Integer'
          : ('Real' as ValueType),
        value: (ASTnode as NumericLiteral).value,
      } as NumberValue;
    case 'StringLiteral':
      return { type: 'String', value: (ASTnode as any).value } as RuntimeValue;
    case 'BooleanLiteral':
      return { type: 'Boolean', value: (ASTnode as any).value } as RuntimeValue;
    case 'BinaryExpression':
      return evaluateBinaryExpression(ASTnode as BinaryExpression, env);
    case 'Program':
      return evaluateProgram(ASTnode as Program, env);
    case 'AssignmentExpression':
      let value = evaluate((ASTnode as any).value, env);
      let index;
      if ((ASTnode as any).identifier.index)
        index = evaluate((ASTnode as any).identifier.index, env);
      env.assignVariable((ASTnode as any).identifier.name, value, index);

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
        } as RuntimeValue;
      } else if ((ASTnode as any).operator === '+') {
        return {
          type: 'number',
          value: ((ASTnode as any).right as RuntimeValue).value,
        } as RuntimeValue;
      } else {
        let res = evaluate((ASTnode as any).right, env);
        return {
          type: 'Boolean',
          value: !res.value,
        } as RuntimeValue;
      }
    case 'PrintStatement':
      let stringToPrint = '';
      for (const statement of (ASTnode as any).value) {
        let res = evaluate(statement, env);
        if (res.type == 'Boolean') res.value = res.value ? 'ΑΛΗΘΗΣ' : 'ΨΕΥΔΗΣ';
        stringToPrint = stringToPrint + res.value + ' ';
      }
      outputList.push(stringToPrint);
      return { type: 'String', value: stringToPrint } as RuntimeValue;
    case 'IntegerVariableDeclaration':
      for (const variable of (ASTnode as any).value) {
        env.declareVariable(variable.name, 'Integer', variable.index);
      }
      return {} as NumberValue;
    case 'RealVariableDeclaration':
      if ((ASTnode as any).index) index = evaluate((ASTnode as any).index, env);
      for (const variable of (ASTnode as any).value) {
        env.declareVariable(variable.name, 'Real', variable.index);
      }
      return {} as NumberValue;
    case 'StringVariableDeclaration':
      for (const variable of (ASTnode as any).value) {
        env.declareVariable(variable.name, 'String', variable.index);
      }
      return {} as NumberValue;
    case 'BooleanVariableDeclaration':
      for (const variable of (ASTnode as any).value) {
        env.declareVariable(variable.name, 'Boolean', variable.index);
      }
      return {} as NumberValue;
    case 'ConstantVariableDeclaration':
      for (const variable of (ASTnode as any).value) {
        env.declareConstant(variable.name, evaluate(variable.value, env));
      }
      return {} as NumberValue;
    case 'IfStatement':
      return evaluateIfStatement(ASTnode as any, env);
    case 'ReadInputStatement':
      return evaluateReadInputStatement(ASTnode as any, env);
    case 'ForStatement':
      return evaluateForStatement(ASTnode as any, env);
    case 'WhileStatement':
      return evaluateWhileStatement(ASTnode as any, env);
    case 'DoWhileStatement':
      return evaluateDoWhileStatement(ASTnode as any, env);
    default:
      errorMessage = `Unknown AST node type: ${(ASTnode as any).type}`;
      return {} as NumberValue;
  }
}
