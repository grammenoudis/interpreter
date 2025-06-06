export type NodeTypes =
  | 'BinaryExpression'
  | 'NumberLiteral'
  | 'Identifier'
  | 'AssignmentExpression'
  | 'UnaryExpression'
  | 'Program'
  | 'CallExpression'
  | 'FunctionDeclaration'
  | 'PrintStatement'
  | 'IntegerVariableDeclaration'
  | 'RealVariableDeclaration'
  | 'StringVariableDeclaration'
  | 'BooleanVariableDeclaration'
  | 'ConstantVariableDeclaration'
  | 'StringLiteral'
  | 'BooleanLiteral'
  | 'IfStatement'
  | 'CaseStatement'
  | 'SwitchStatement'
  | 'ReadInputStatement'
  | 'ForStatement'
  | 'WhileStatement'
  | 'DoWhileStatement'
  | 'FunctionDeclaration'
  | 'FunctionCall'
  | 'StartStatement'
  | 'ProcedureDeclaration'
  | 'EndOfProgramStatement'
  | 'ProgramDeclaration'
  | 'EOFStatement'
  | 'VariablesSection'
  | 'ProcedureCall';

export interface Statement {
  type: NodeTypes;
}

export interface Program extends Statement {
  type: 'Program';
  body: Statement[];
  functions: Map<string, FunctionDeclaration>;
  procedures: Map<string, ProcedureDeclaration>;
}

export interface FunctionDeclaration extends Statement {
  type: 'FunctionDeclaration';
  name: string;
  body: Statement[];
  returnType: string;
  arguments: string[];
}

export interface Expression extends Statement {}

export interface BinaryExpression extends Expression {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface Identifier extends Expression {
  type: 'Identifier';
  name: string;
}

export interface NumericLiteral extends Expression {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteral extends Expression {
  type: 'StringLiteral';
  value: string;
}

export interface AssignmentExpression extends Statement {
  type: 'AssignmentExpression';
  identifier: Identifier;
  value: Expression;
}

export interface UnaryExpression extends Expression {
  type: 'UnaryExpression';
  operator: string;
  right: Expression;
}

export interface BooleanLiteral extends Expression {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface IfStatement extends Statement {
  type: 'IfStatement';
  condition: Expression;
  consequent: Statement;
  alternate?: Statement;
}

export interface CaseStatement extends Statement {
  type: 'CaseStatement';
  test: Expression;
  consequent: Statement[];
}

export interface SwitchStatement extends Statement {
  type: 'SwitchStatement';
  discriminant: Expression;
  cases: CaseStatement[];
}

export interface ForStatement extends Statement {
  type: 'ForStatement';
  identifier: Identifier;
  start: NumericLiteral;
  end: NumericLiteral;
  step: NumericLiteral;
  body: Statement[];
}

export interface WhileStatement extends Statement {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement[];
}

export interface DoWhileStatement extends Statement {
  type: 'DoWhileStatement';
  condition: Expression;
  body: Statement[];
}

export interface ProcedureDeclaration extends Statement {
  type: 'ProcedureDeclaration';
  name: string;
  body: Statement[];
  arguments: string[];
}

export interface ProcedureCall extends Statement {
  type: 'ProcedureCall';
  identifier: string;
  arguments: Identifier[];
}
