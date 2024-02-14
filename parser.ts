import {
  Statement,
  Program,
  Expression,
  BinaryExpression,
  NumericLiteral,
  Identifier,
  UnaryExpression,
} from './ast';

import { Token, TokenType, tokenize } from './lexer';

export default class Parser {
  private tokens: Token[] = [];
  private NotEOF(): boolean {
    return this.tokens[0].type != TokenType.EOF;
  }

  private at(): Token {
    return this.tokens[0] as Token;
  }

  private advance(): Token {
    return this.tokens.shift()!;
  }

  private expect(type: TokenType, error: string): Token {
    const token = this.tokens.shift()!;
    if (token.type != type || !token) {
      console.error(error, token);
      process.exit(1);
    }
    return token;
  }

  public ProduceAST(source: string): Program {
    this.tokens = tokenize(source);
    const program: Program = {
      type: 'Program',
      body: [],
    };

    while (this.NotEOF()) {
      program.body.push(this.ParseStatement());
    }

    return program;
  }

  private ParseStatement(): Statement {
    return this.ParseExpression();
  }

  private ParseDeclarationOfVariables(): Statement {
    let variablesToDeclare: Identifier[] = [];
    let typeOfVariables = this.advance().type;
    this.expect(TokenType.Colon, 'Expected colon');
    switch (typeOfVariables) {
      case TokenType.Integers:
        while (this.at().type != TokenType.EndOfLine) {
          if (this.at().type != TokenType.Identifier) {
            console.error('Expected identifier', this.at());
            process.exit(1);
          }
          variablesToDeclare.push({
            type: 'Identifier',
            name: this.advance().value,
          } as Identifier);
          if (this.at().type == TokenType.EndOfLine) break;
          this.expect(TokenType.Seperator, 'Expected comma');
        }
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        console.log('Variables to declare', variablesToDeclare);
        return {
          type: 'IntegerVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      case TokenType.RealNumbers:
        while (this.at().type != TokenType.EndOfLine) {
          variablesToDeclare.push({
            type: 'Identifier',
            name: this.advance().value,
          } as Identifier);
          if (this.at().type == TokenType.EndOfLine) break;
          this.expect(TokenType.Seperator, 'Expected comma');
        }
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        return {
          type: 'RealVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      case TokenType.Booleans:
        while (this.at().type != TokenType.EndOfLine) {
          variablesToDeclare.push({
            type: 'Identifier',
            name: this.advance().value,
          } as Identifier);
          if (this.at().type == TokenType.EndOfLine) break;
          this.expect(TokenType.Seperator, 'Expected comma');
        }
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        return {
          type: 'BooleanVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      case TokenType.Constants:
        while (this.at().type != TokenType.EndOfLine) {
          variablesToDeclare.push({
            type: 'Identifier',
            name: this.advance().value,
          } as Identifier);
          if (this.at().type == TokenType.EndOfLine) break;
          this.expect(TokenType.Seperator, 'Expected comma');
        }
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        return {
          type: 'ConstantVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      case TokenType.Alphanumericals:
        while (this.at().type != TokenType.EndOfLine) {
          variablesToDeclare.push({
            type: 'Identifier',
            name: this.advance().value,
          } as Identifier);
          if (this.at().type == TokenType.EndOfLine) break;
          this.expect(TokenType.Seperator, 'Expected comma');
        }
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        return {
          type: 'StringVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      default:
        console.error('Unexpected token', this.at());
        process.exit(1);
    }
  }

  private ParsePrintStatement(): Statement {
    if (this.at().type == TokenType.Print) {
      this.advance();
      let elementsToPrint: Expression[] = [];
      while (this.at().type != TokenType.EndOfLine) {
        elementsToPrint.push(this.ParseExpression());
        if (this.at().type == TokenType.EndOfLine) break;
        this.expect(TokenType.Seperator, 'Expected comma');
      }
      this.expect(TokenType.EndOfLine, 'Expected end of line');
      return {
        type: 'PrintStatement',
        value: elementsToPrint as Expression[],
      } as Statement;
    }
    return this.ParseStatement();
  }

  private ParseExpression(): Expression {
    switch (this.at().type) {
      case TokenType.Identifier:
        if (this.tokens[1].type == TokenType.Assign) {
          return this.ParseAssignmentExpression();
        }
      default:
        return this.ParseComparisonExpression();
    }
  }
  ParseAssignmentExpression(): Statement {
    const identifier = this.expect(TokenType.Identifier, 'Expected identifier');
    this.expect(TokenType.Assign, 'Expected assignment operator');

    let value: Expression = this.ParseExpression();

    const newLine = this.tokens.shift();
    if (newLine?.type != TokenType.EndOfLine && newLine?.value != 'EOF') {
      console.error('Expected end of line', newLine);
      process.exit(1);
    }

    return {
      type: 'AssignmentExpression',
      identifier: { type: 'Identifier', name: identifier.value } as Identifier,
      value: value,
    } as Statement;
  }
  private ParseComparisonExpression(): Expression {
    let left = this.ParseAdditiveExpression();
    while (
      this.at().value == '<' ||
      this.at().value == '>' ||
      this.at().value == '<=' ||
      this.at().value == '>=' ||
      this.at().value == '<>' ||
      this.at().value == '='
    ) {
      const operator = this.advance().value;
      const right = this.ParseAdditiveExpression();

      left = {
        type: 'BinaryExpression',
        operator: operator,
        left: left,
        right: right,
      } as BinaryExpression;
    }
    return left;
  }

  private ParseAdditiveExpression(): Expression {
    let left = this.ParseMultiplicativeExpression();
    while (this.at().value == '+' || this.at().value == '-') {
      const operator = this.advance().value;
      const right = this.ParseMultiplicativeExpression();

      left = {
        type: 'BinaryExpression',
        operator: operator,
        left: left,
        right: right,
      } as BinaryExpression;
    }
    return left;
  }

  private ParseMultiplicativeExpression(): Expression {
    let left = this.ParsePowerExpression();
    while (
      this.at().value == '*' ||
      this.at().value == '/' ||
      this.at().value == 'MOD' ||
      this.at().value == 'DIV'
    ) {
      const operator = this.advance().value;
      const right = this.ParsePowerExpression();

      left = {
        type: 'BinaryExpression',
        operator: operator,
        left: left,
        right: right,
      } as BinaryExpression;
    }
    return left;
  }

  private ParsePowerExpression(): Expression {
    let left = this.ParsePrimaryExpression();
    while (this.at().value == '^') {
      const operator = this.advance().value;
      const right = this.ParsePrimaryExpression();

      left = {
        type: 'BinaryExpression',
        operator: operator,
        left: left,
        right: right,
      } as BinaryExpression;
    }
    return left;
  }

  private ParsePrimaryExpression(): Expression {
    if (this.at().value == '-' || this.at().value == '+') {
      const operator = this.advance().value;
      const right = this.ParsePrimaryExpression();
      return {
        type: 'UnaryExpression',
        operator: operator,
        right: right,
      } as UnaryExpression;
    }
    const tk = this.at().type;
    switch (tk) {
      case TokenType.Identifier:
        if (this.tokens[1].type == TokenType.Assign) {
          return this.ParseAssignmentExpression();
        }
        return {
          type: 'Identifier',
          name: this.advance().value,
        } as Identifier;
      case TokenType.Integer:
      case TokenType.RealNumber:
        return {
          type: 'NumberLiteral',
          value: parseFloat(this.advance().value),
        } as NumericLiteral;
      case TokenType.String:
        return {
          type: 'StringLiteral',
          value: this.advance().value,
        } as any;
      case TokenType.LParenthesis:
        this.advance();
        const expression = this.ParseExpression();
        //advance closed parenthesis
        this.expect(
          TokenType.RParenthesis,
          `Expected closed parenthesis near line ${this.at().line} column ${
            this.at().column
          }`
        );
        return expression;
      case TokenType.Print:
        return this.ParsePrintStatement();
      case TokenType.Variables:
        this.advance();
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        return this.ParseDeclarationOfVariables();
      case TokenType.Integers:
      case TokenType.RealNumbers:
      case TokenType.Booleans:
      case TokenType.Constants:
      case TokenType.Alphanumericals:
        return this.ParseDeclarationOfVariables();
      case TokenType.Start:
        this.advance();
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        return this.ParseStatement();
      default:
        console.error('Unexpected token', this.at());
        process.exit(1);
    }
  }
}
