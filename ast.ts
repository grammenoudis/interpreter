export type NodeTypes =
  | 'BinaryExpression'
  | 'NumberLiteral'
  | 'Identifier'
  | 'AssignmentExpression'
  | 'UnaryExpression'
  | 'Program'
  | 'CallExpression'
  | 'FunctionDeclaration';

export interface Statement {
  type: NodeTypes;
}

export interface Program extends Statement {
  type: 'Program';
  body: Statement[];
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
