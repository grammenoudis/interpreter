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
var errorMessage: string | undefined;

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
      errorMessage = error;
    }
    return token;
  }

  public ProduceAST(source: string): Program | string {
    let lexerResponse = tokenize(source);
    if (typeof lexerResponse === 'string') {
      return lexerResponse;
    }

    this.tokens = lexerResponse;
    const program: Program = {
      type: 'Program',
      body: [],
    };

    while (
      this.at().type != TokenType.EndOfProgram &&
      !errorMessage &&
      this.NotEOF()
    ) {
      program.body.push(this.ParseStatement());
    }
    if (errorMessage) return errorMessage;

    return program;
  }

  private ParseStatement(): Statement {
    switch (this.at().type) {
      case TokenType.If:
        return this.ParseIfStatement();
      case TokenType.Program:
        this.advance();
        this.expect(TokenType.Identifier, 'Περίμενα το όνομα του προγράμματος');
        this.expect(TokenType.EndOfLine, 'Expected end of line');
      case TokenType.Constants:
        return this.ParseDeclarationOfConstants();
      case TokenType.Variables:
        return this.ParseDeclarationOfVariables();
      case TokenType.Print:
        return this.ParsePrintStatement();
      case TokenType.ReadInput:
        return this.ParseReadInputStatement();
      case TokenType.For:
        return this.ParseForStatement();
      default:
        return this.ParseExpression();
    }
  }

  private ParseForStatement(): Statement {
    this.advance();
    let identifier = this.expect(TokenType.Identifier, 'Expected identifier');
    this.expect(TokenType.From, 'Expected FROM');
    let start = this.ParseExpression();
    this.expect(TokenType.Until, 'Expected UNTIL');
    let end = this.ParseExpression();
    let step = { type: 'NumberLiteral', value: 1 } as NumericLiteral;
    if (this.at().type == TokenType.Step) {
      this.advance();
      step = this.ParseExpression() as any;
    }
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    let body: Statement[] = [];
    while (this.at().type != TokenType.EndFor) {
      body.push(this.ParseStatement());
    }
    this.advance();
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    return {
      type: 'ForStatement',
      identifier: identifier,
      start: start,
      end: end,
      step: step as NumericLiteral,
      body: body as Statement[],
    } as Statement;
  }

  private ParseReadInputStatement(): Statement {
    this.advance();
    let identifiers: Identifier[] = [];
    identifiers.push(
      this.expect(TokenType.Identifier, 'Expected identifier') as any
    );
    while (
      this.at().type == TokenType.Seperator &&
      this.NotEOF() &&
      !errorMessage
    ) {
      this.advance();
      identifiers.push(
        this.expect(TokenType.Identifier, 'Expected identifier') as any
      );
    }
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    return {
      type: 'ReadInputStatement',
      identifiers: identifiers,
    } as Statement;
  }

  private ParseIfStatement(): Statement {
    this.advance();
    const condition = this.ParseExpression();
    console.table(this.at());
    this.expect(TokenType.Then, 'Expected THEN');
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    while (this.at().type == TokenType.EndOfLine) this.advance();
    var consequent: Statement[] = [];
    while (
      this.at().type != TokenType.Else &&
      this.at().type != TokenType.EndOfProgram &&
      this.at().type != TokenType.EndIf &&
      this.at().type != TokenType.ElseIf
    ) {
      consequent.push(this.ParseStatement());
    }
    while (this.at().type == TokenType.EndOfLine) this.advance();
    if (this.at().type == TokenType.ElseIf) {
      return {
        type: 'IfStatement',
        condition: condition,
        consequent: consequent,
        alternate: this.ParseIfStatement(),
      } as Statement;
    }
    while (this.at().type == TokenType.EndOfLine) this.advance();
    if (this.at().type == TokenType.Else) {
      this.advance();
      this.expect(TokenType.EndOfLine, 'Expected end of line');
      while (this.at().type == TokenType.EndOfLine) this.advance();
      var alternate: Statement[] = [];
      while (
        this.at().type != TokenType.EndOfProgram &&
        this.at().type != TokenType.EndIf
      ) {
        alternate.push(this.ParseStatement());
      }
      this.expect(TokenType.EndIf, 'Expected ENDIF');
      this.expect(TokenType.EndOfLine, 'Expected end of line');
      while (this.at().type == TokenType.EndOfLine) this.advance();
      return {
        type: 'IfStatement',
        condition: condition,
        consequent: consequent,
        alternate: alternate,
      } as Statement;
    }
    this.expect(TokenType.EndIf, 'Expected ENDIF');
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    while (this.at().type == TokenType.EndOfLine) this.advance();
    return {
      type: 'IfStatement',
      condition: condition,
      consequent: consequent,
    } as Statement;
  }

  private ParseDeclarationOfConstants(): Statement {
    this.advance();
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    let constantsToDeclare: Identifier[] = [];
    while (this.at().type != TokenType.Variables) {
      if (this.at().type != TokenType.Identifier) {
        errorMessage = 'Expected identifier';
      }
      let name = this.advance().value;
      this.expect(TokenType.EqualSign, 'Expected Equal sign');
      let value = this.ParseExpression();
      constantsToDeclare.push({
        type: 'Identifier',
        name: name,
        value: value,
      } as Identifier);
      if (this.at().type != TokenType.EndOfLine) {
        errorMessage = `Expected end of line near line ${
          this.at().line
        } column ${this.at().column}`;
      }
      this.advance();
      while (this.at().type == TokenType.EndOfLine) this.advance();
    }
    return {
      type: 'ConstantVariableDeclaration',
      value: constantsToDeclare,
    } as Statement;
  }

  private ParseDeclarationOfVariables(): Statement {
    this.advance();
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    let variablesToDeclare: Identifier[] = [];
    let typeOfVariables = this.advance().type;
    if (typeOfVariables !== TokenType.Constants)
      this.expect(TokenType.Colon, 'Expected colon');
    else this.expect(TokenType.EndOfLine, 'Expected end of line');
    switch (typeOfVariables) {
      case TokenType.Integers:
        while (this.at().type != TokenType.EndOfLine) {
          if (this.at().type != TokenType.Identifier) {
            errorMessage = `Expected identifier near line ${
              this.at().line
            } column ${this.at().column}`;
          }
          let value = this.at().value;
          variablesToDeclare.push({
            type: 'Identifier',
            name: value,
            index: parseInt(this.advance().arrayCell),
          } as Identifier);
          if (this.at().type == TokenType.EndOfLine) break;
          this.expect(TokenType.Seperator, 'Expected comma');
        }
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        while (this.at().type == TokenType.EndOfLine) this.advance();
        return {
          type: 'IntegerVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      case TokenType.RealNumbers:
        while (this.at().type != TokenType.EndOfLine) {
          let value = this.at().value;
          variablesToDeclare.push({
            type: 'Identifier',
            name: value,
            index: parseInt(this.advance().arrayCell),
          } as Identifier);
          if (this.at().type == TokenType.EndOfLine) break;
          this.expect(TokenType.Seperator, 'Expected comma');
        }
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        while (this.at().type == TokenType.EndOfLine) this.advance();
        return {
          type: 'RealVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      case TokenType.Alphanumericals:
        while (this.at().type != TokenType.EndOfLine) {
          let value = this.at().value;
          variablesToDeclare.push({
            type: 'Identifier',
            name: value,
            index: parseInt(this.advance().arrayCell),
          } as Identifier);
          if (this.at().type == TokenType.EndOfLine) break;
          this.expect(TokenType.Seperator, 'Expected comma');
        }
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        while (this.at().type == TokenType.EndOfLine) this.advance();
        return {
          type: 'StringVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      case TokenType.Booleans:
        while (this.at().type != TokenType.EndOfLine) {
          let value = this.at().value;
          variablesToDeclare.push({
            type: 'Identifier',
            name: value,
            index: parseInt(this.advance().arrayCell),
          } as Identifier);
          if (this.at().type == TokenType.EndOfLine) break;
          this.expect(TokenType.Seperator, 'Expected comma');
        }
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        while (this.at().type == TokenType.EndOfLine) this.advance();
        return {
          type: 'BooleanVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      default:
        errorMessage = `Unexpected token ${this.at().value} at line ${
          this.at().line
        } column ${this.at().column}`;
        return {} as Statement;
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
        return this.ParseOrExpression();
    }
  }
  ParseAssignmentExpression(): Statement {
    let res;
    if (this.at().arrayCell) {
      const parser = new Parser();
      res = parser.ProduceAST(this.at().arrayCell);
      if (typeof res === 'string') {
        errorMessage = res;
      }
      if (typeof res != 'string') res = res.body[0] as any;
    }
    const identifier = this.expect(TokenType.Identifier, 'Expected identifier');
    this.expect(TokenType.Assign, 'Expected assignment operator');

    let value: Expression = this.ParseExpression();

    const newLine = this.tokens.shift();
    if (newLine?.type != TokenType.EndOfLine && newLine?.value != 'EOF') {
      errorMessage = `Expected end of line near line ${this.at().line} column ${
        this.at().column
      }`;
    }

    return {
      type: 'AssignmentExpression',
      identifier: {
        type: 'Identifier',
        name: identifier.value,
        index: res,
      } as Identifier,
      value: value,
    } as Statement;
  }

  private ParseOrExpression(): Expression {
    let left = this.ParseAndExpression();
    while (this.at().value == 'Ή') {
      const operator = this.advance().value;
      const right = this.ParseAndExpression();

      left = {
        type: 'BinaryExpression',
        operator: operator,
        left: left,
        right: right,
      } as BinaryExpression;
    }
    return left;
  }

  private ParseAndExpression(): Expression {
    let left = this.ParseNotExpression();
    while (this.at().value == 'ΚΑΙ') {
      const operator = this.advance().value;
      const right = this.ParseNotExpression();

      left = {
        type: 'BinaryExpression',
        operator: operator,
        left: left,
        right: right,
      } as BinaryExpression;
    }
    return left;
  }

  private ParseNotExpression(): Expression {
    if (this.at().value == 'ΟΧΙ') {
      const operator = this.advance().value;
      const right = this.ParseComparisonExpression();
      return {
        type: 'UnaryExpression',
        operator: operator,
        right: right,
      } as UnaryExpression;
    }
    return this.ParseComparisonExpression();
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

  private ParsePrimaryExpression(): any {
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
        let index;
        if (this.at().arrayCell) {
          const parser = new Parser();
          let res = parser.ProduceAST(this.at().arrayCell);
          if (typeof res === 'string') {
            errorMessage = res;
            break;
          }
          res = res.body[0] as any;
          index = res;
        }
        if (this.tokens[1].type == TokenType.Assign) {
          return this.ParseAssignmentExpression();
        }
        console.table(index);
        return {
          type: 'Identifier',
          name: this.advance().value,
          index: index,
        } as Identifier;
      case TokenType.Integer:
      case TokenType.RealNumber:
        return {
          type: 'NumberLiteral',
          value: parseFloat(this.advance().value),
        } as NumericLiteral;
      case TokenType.Boolean:
        return {
          type: 'BooleanLiteral',
          value: this.advance().value == 'ΑΛΗΘΗΣ' ? true : false,
        } as any;
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
      case TokenType.Start:
        this.advance();
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        return this.ParseStatement();
      case TokenType.Not:
        return this.ParseNotExpression();
      case TokenType.EndOfProgram:
        this.advance();
        this.expect(TokenType.EndOfLine, 'Expected end of line');
      case TokenType.EndOfLine:
        this.advance();
        return this.ParseStatement();
      default:
        console.log(this.at());
        errorMessage = `Unexpected token ${this.at().value} at line ${
          this.at().line
        } column ${this.at().column}`;
        return {} as Expression;
    }
  }
}
