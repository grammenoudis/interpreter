import {
  BinaryExpression,
  Expression,
  FunctionDeclaration,
  Identifier,
  NumericLiteral,
  ProcedureDeclaration,
  Program,
  Statement,
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
    if (!token || token.type != type) {
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
      functions: new Map<string, FunctionDeclaration>(),
      procedures: new Map<string, ProcedureDeclaration>(),
    };

    while (
      this.NotEOF() &&
      this.at().type != TokenType.EndOfProgram &&
      !errorMessage
    ) {
      program.body.push(this.ParseStatement());
    }
    if (this.at().type == TokenType.EndOfProgram) this.advance();
    if (errorMessage) return errorMessage;

    while (this.at().type != TokenType.EOF) {
      while (this.at().type == TokenType.EndOfLine) this.advance();
      if (this.at().type == TokenType.EOF) break;
      
      let token = this.at().type;
      switch (token) {
        case TokenType.Function:
          let functionDeclaration = this.ParseFunctionDeclaration() as any;
          program.functions.set(
            functionDeclaration.name,
            functionDeclaration as FunctionDeclaration
          );
          break;
        case TokenType.Procedure:
          let procedureDeclaration = this.ParseProcedureDeclaration() as any;
          program.procedures.set(
            procedureDeclaration.name,
            procedureDeclaration as ProcedureDeclaration
          );
          break;
        default:
          errorMessage = `Unexpected token ${this.at().value} at line ${
            this.at().line
          } column ${this.at().column}`;
          return errorMessage;
      }
    }
    return program;
  }

  private ParseStatement(): Statement {
    // Skip empty lines
    while (this.at().type == TokenType.EndOfLine) this.advance();
    
    switch (this.at().type) {
      case TokenType.If:
        return this.ParseIfStatement();
      case TokenType.Program:
        this.advance();
        this.expect(TokenType.Identifier, 'Περίμενα το όνομα του προγράμματος');
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        return { type: 'ProgramDeclaration' } as Statement;
      case TokenType.Constants:
        return this.ParseDeclarationOfConstants();
      case TokenType.Variables:
        return this.ParseVariablesSection();
      case TokenType.Integers:
      case TokenType.RealNumbers:
      case TokenType.Characters:
      case TokenType.Booleans:
        return this.ParseDeclarationOfVariables();
      case TokenType.Print:
        return this.ParsePrintStatement();
      case TokenType.ReadInput:
        return this.ParseReadInputStatement();
      case TokenType.For:
        return this.ParseForStatement();
      case TokenType.While:
        return this.ParseWhileStatement();
      case TokenType.StartLoop:
        return this.ParseDoWhileStatement();
      case TokenType.Call:
        return this.ParseProcedureCall();
      case TokenType.Start:
        this.advance();
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        return { type: 'StartStatement', value: 'ΑΡΧΗ' } as Statement;
      case TokenType.EndOfProgram:
        this.advance();
        this.expect(TokenType.EndOfLine, 'Expected end of line');
        return { type: 'EndOfProgramStatement' } as Statement;
      case TokenType.EndOfLine:
        this.advance();
        return this.ParseStatement();
      case TokenType.EOF:
        return { type: 'EOFStatement' } as Statement;
      default:
        return this.ParseExpression();
    }
  }

  private ParseVariablesSection(): Statement {
    this.advance(); // Consume Variables token
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    
    // Skip any additional empty lines
    while (this.at().type == TokenType.EndOfLine) this.advance();
    
    return { type: 'VariablesSection' } as Statement;
  }

  private ParseProcedureDeclaration(): Statement {
    this.advance();
    let name = this.expect(TokenType.Identifier, 'Expected procedure name').value;
    this.expect(TokenType.LParenthesis, 'Expected open parenthesis');
    let args: Identifier[] = [];
    while (this.at().type != TokenType.RParenthesis) {
      args.push({
        type: 'Identifier',
        name: this.expect(TokenType.Identifier, 'Expected identifier').value,
      } as Identifier);
      if (this.at().type == TokenType.RParenthesis) break;
      this.expect(TokenType.Seperator, 'Expected comma');
    }
    this.expect(TokenType.RParenthesis, 'Expected closed parenthesis');
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    let body: Statement[] = [];
    while (this.at().type != TokenType.EndProcedure && this.NotEOF() && !errorMessage) {
      body.push(this.ParseStatement());
    }
    this.expect(TokenType.EndProcedure, 'Expected end of procedure');
    if (this.at().type == TokenType.EndOfLine) this.advance();
    return {
      type: 'ProcedureDeclaration',
      name: name,
      body: body,
      arguments: args,
    } as Statement;
  }

  private ParseFunctionDeclaration(): Statement {
    this.advance();
    let name = this.expect(TokenType.Identifier, 'Expected function name').value;
    this.expect(TokenType.LParenthesis, 'Expected open parenthesis');
    let args: Identifier[] = [];
    while (this.at().type != TokenType.RParenthesis) {
      args.push({
        type: 'Identifier',
        name: this.expect(TokenType.Identifier, 'Expected identifier').value,
      } as Identifier);
      if (this.at().type == TokenType.RParenthesis) break;
      this.expect(TokenType.Seperator, 'Expected comma');
    }
    this.expect(TokenType.RParenthesis, 'Expected closed parenthesis');
    this.expect(TokenType.Colon, 'Expected colon');
    let returnType = this.expect(TokenType.ReturnType, 'Expected return type').value;
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    let body: Statement[] = [];
    while (this.at().type != TokenType.EndFunction && this.NotEOF() && !errorMessage) {
      body.push(this.ParseStatement());
    }
    this.expect(TokenType.EndFunction, 'Expected end of function');
    if (this.at().type == TokenType.EndOfLine) this.advance();
    return {
      type: 'FunctionDeclaration',
      name: name,
      body: body,
      returnType: returnType,
      arguments: args,
    } as Statement;
  }

  private ParseDoWhileStatement(): Statement {
    this.advance();
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    let body: Statement[] = [];
    while (this.at().type != TokenType.DoWhile && this.NotEOF() && !errorMessage) {
      body.push(this.ParseStatement());
    }
    this.advance();
    let condition = this.ParseExpression();
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    return {
      type: 'DoWhileStatement',
      condition: condition,
      body: body,
    } as Statement;
  }

  private ParseWhileStatement(): Statement {
    this.advance();
    let condition = this.ParseExpression();
    this.expect(TokenType.Repeat, 'Expected REPEAT');
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    let body: Statement[] = [];
    while (this.at().type != TokenType.EndLoop && this.NotEOF() && !errorMessage) {
      body.push(this.ParseStatement());
    }
    this.advance();
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    return {
      type: 'WhileStatement',
      condition: condition,
      body: body,
    } as Statement;
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
      step = this.ParseExpression() as NumericLiteral;
    }
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    let body: Statement[] = [];
    while (
      this.at().type != TokenType.EndLoop &&
      this.NotEOF() &&
      !errorMessage
    ) {
      body.push(this.ParseStatement());
    }
    this.expect(TokenType.EndLoop, 'Expected end of loop');
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    return {
      type: 'ForStatement',
      identifier: identifier,
      start: start,
      end: end,
      step: step,
      body: body,
    } as Statement;
  }

  private ParseReadInputStatement(): Statement {
    this.advance();
    let identifiers: Identifier[] = [];
    identifiers.push({
      type: 'Identifier',
      name: this.expect(TokenType.Identifier, 'Expected identifier').value,
    } as Identifier);
    
    while (this.at().type == TokenType.Seperator) {
      this.advance();
      identifiers.push({
        type: 'Identifier',
        name: this.expect(TokenType.Identifier, 'Expected identifier').value,
      } as Identifier);
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
    this.expect(TokenType.Then, 'Expected THEN');
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    
    // Skip any empty lines
    while (this.at().type == TokenType.EndOfLine) this.advance();
    
    var consequent: Statement[] = [];
    while (
      this.at().type != TokenType.Else &&
      this.at().type != TokenType.EndIf &&
      this.at().type != TokenType.ElseIf &&
      this.NotEOF() &&
      !errorMessage
    ) {
      consequent.push(this.ParseStatement());
    }
    
    // Handle ElseIf
    if (this.at().type == TokenType.ElseIf) {
      return {
        type: 'IfStatement',
        condition: condition,
        consequent: consequent,
        alternate: this.ParseIfStatement(),
      } as Statement;
    }
    
    // Handle Else
    if (this.at().type == TokenType.Else) {
      this.advance();
      this.expect(TokenType.EndOfLine, 'Expected end of line');
      
      // Skip any empty lines
      while (this.at().type == TokenType.EndOfLine) this.advance();
      
      var alternate: Statement[] = [];
      while (
        this.at().type != TokenType.EndIf &&
        this.NotEOF() &&
        !errorMessage
      ) {
        alternate.push(this.ParseStatement());
      }
      this.expect(TokenType.EndIf, 'Expected ENDIF');
      this.expect(TokenType.EndOfLine, 'Expected end of line');
      return {
        type: 'IfStatement',
        condition: condition,
        consequent: consequent,
        alternate: alternate,
      } as Statement;
    }
    
    // Handle simple If without Else
    this.expect(TokenType.EndIf, 'Expected ENDIF');
    this.expect(TokenType.EndOfLine, 'Expected end of line');
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
    
    while (this.at().type != TokenType.Variables && this.NotEOF() && !errorMessage) {
      // Skip empty lines
      if (this.at().type == TokenType.EndOfLine) {
        this.advance();
        continue;
      }
      
      if (this.at().type != TokenType.Identifier) {
        errorMessage = `Expected identifier near line ${this.at().line} column ${this.at().column}`;
        break;
      }
      
      let name = this.advance().value;
      this.expect(TokenType.EqualSign, 'Expected Equal sign');
      let value = this.ParseExpression();
      constantsToDeclare.push({
        type: 'Identifier',
        name: name,
        value: value,
      } as Identifier);
      
      this.expect(TokenType.EndOfLine, 'Expected end of line');
    }
    
    return {
      type: 'ConstantVariableDeclaration',
      value: constantsToDeclare,
    } as Statement;
  }

  private ParseDeclarationOfVariables(): Statement {
    let variablesToDeclare: Identifier[] = [];
    let typeOfVariables = this.advance().type;
    
    this.expect(TokenType.Colon, 'Expected colon');
    
    while (this.at().type != TokenType.EndOfLine && this.NotEOF() && !errorMessage) {
      if (this.at().type != TokenType.Identifier) {
        errorMessage = `Expected identifier near line ${this.at().line} column ${this.at().column}`;
        break;
      }
      
      const currentToken = this.advance();
      let value = currentToken.value;
      let index = currentToken.arrayCell ? parseInt(currentToken.arrayCell) : undefined;
      
      variablesToDeclare.push({
        type: 'Identifier',
        name: value,
        index: index,
      } as Identifier);
      
      if (this.at().type == TokenType.EndOfLine) break;
      this.expect(TokenType.Seperator, 'Expected comma');
    }
    
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    
    // Skip any additional empty lines
    while (this.at().type == TokenType.EndOfLine) this.advance();
    
    switch (typeOfVariables) {
      case TokenType.Integers:
        return {
          type: 'IntegerVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      case TokenType.RealNumbers:
        return {
          type: 'RealVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      case TokenType.Characters:
        return {
          type: 'StringVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      case TokenType.Booleans:
        return {
          type: 'BooleanVariableDeclaration',
          value: variablesToDeclare,
        } as Statement;
      default:
        errorMessage = `Unexpected token ${this.at().value} at line ${this.at().line} column ${this.at().column}`;
        return {} as Statement;
    }
  }

  private ParsePrintStatement(): Statement {
    this.advance();
    let elementsToPrint: Expression[] = [];
    
    while (this.at().type != TokenType.EndOfLine && this.NotEOF() && !errorMessage) {
      elementsToPrint.push(this.ParseExpression());
      if (this.at().type == TokenType.EndOfLine) break;
      this.expect(TokenType.Seperator, 'Expected comma');
    }
    
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    return {
      type: 'PrintStatement',
      value: elementsToPrint,
    } as Statement;
  }

  private ParseExpression(): Expression {
    if (this.at().type == TokenType.Identifier && this.tokens[1]?.type == TokenType.Assign) {
      return this.ParseAssignmentExpression();
    }
    return this.ParseOrExpression();
  }
  
  private ParseAssignmentExpression(): Statement {
    let res;
    let identifier = this.at();
    
    if (identifier.arrayCell) {
      const parser = new Parser();
      res = parser.ProduceAST(identifier.arrayCell);
      if (typeof res === 'string') {
        errorMessage = res;
      } else if (res.body && res.body.length > 0) {
        res = res.body[0] as any;
      }
    }
    
    this.advance(); // Consume identifier
    this.expect(TokenType.Assign, 'Expected assignment operator');
    let value: Expression = this.ParseExpression();

    this.expect(TokenType.EndOfLine, 'Expected end of line');

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
    
    while (this.at().type == TokenType.Or) {
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
    
    while (this.at().type == TokenType.And) {
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
    if (this.at().type == TokenType.Not) {
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
      this.at().type == TokenType.Compare ||
      this.at().type == TokenType.EqualSign
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
    
    while (
      this.at().type == TokenType.BinaryOperator && 
      (this.at().value == '+' || this.at().value == '-')
    ) {
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
      (this.at().type == TokenType.BinaryOperator && 
       (this.at().value == '*' || this.at().value == '/')) ||
      this.at().type == TokenType.Mod ||
      this.at().type == TokenType.Div
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
    
    while (this.at().type == TokenType.Power) {
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

  private ParseFunctionCall(): Expression {
    const identifier = this.advance().value;
    this.expect(TokenType.LParenthesis, 'Expected open parenthesis');
    let args: Expression[] = [];
    
    if (this.at().type != TokenType.RParenthesis) {
      do {
        args.push(this.ParseExpression());
        if (this.at().type == TokenType.RParenthesis) break;
        this.expect(TokenType.Seperator, 'Expected comma');
      } while (this.at().type != TokenType.RParenthesis && this.NotEOF() && !errorMessage);
    }
    
    this.expect(TokenType.RParenthesis, 'Expected closed parenthesis');
    return {
      type: 'FunctionCall',
      identifier: identifier,
      arguments: args,
    } as Expression;
  }

  private ParseProcedureCall(): Statement {
    this.advance(); // Consume CALL token
    const identifier = this.expect(TokenType.Identifier, 'Expected procedure identifier').value;
    this.expect(TokenType.LParenthesis, 'Expected open parenthesis');
    let args: Expression[] = [];
    
    if (this.at().type != TokenType.RParenthesis) {
      do {
        args.push(this.ParseExpression());
        if (this.at().type == TokenType.RParenthesis) break;
        this.expect(TokenType.Seperator, 'Expected comma');
      } while (this.at().type != TokenType.RParenthesis && this.NotEOF() && !errorMessage);
    }
    
    this.expect(TokenType.RParenthesis, 'Expected closed parenthesis');
    this.expect(TokenType.EndOfLine, 'Expected end of line');
    return {
      type: 'ProcedureCall',
      identifier: identifier,
      arguments: args,
    } as Statement;
  }

  private ParsePrimaryExpression(): any {
    // Handle unary plus/minus
    if (
      this.at().type == TokenType.BinaryOperator && 
      (this.at().value == '-' || this.at().value == '+')
    ) {
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
        // Check if it's a function call
        if (this.tokens[1]?.type == TokenType.LParenthesis) {
          return this.ParseFunctionCall();
        }
        
        // Handle array access
        let identifier = this.advance();
        let index;
        if (identifier.arrayCell) {
          const parser = new Parser();
          let res = parser.ProduceAST(identifier.arrayCell);
          if (typeof res === 'string') {
            errorMessage = res;
            break;
          }
          if (res.body && res.body.length > 0) {
            index = res.body[0];
          }
        }
        
        return {
          type: 'Identifier',
          name: identifier.value,
          index: index,
        } as Identifier;
        
      case TokenType.Integer:
        return {
          type: 'NumberLiteral',
          value: parseInt(this.advance().value),
        } as NumericLiteral;
        
      case TokenType.RealNumber:
        return {
          type: 'NumberLiteral',
          value: parseFloat(this.advance().value),
        } as NumericLiteral;
        
      case TokenType.Boolean:
        return {
          type: 'BooleanLiteral',
          value: this.advance().value == 'ΑΛΗΘΗΣ',
        } as Expression;
        
      case TokenType.String:
        return {
          type: 'StringLiteral',
          value: this.advance().value,
        } as Expression;
        
      case TokenType.LParenthesis:
        this.advance();
        const expression = this.ParseExpression();
        this.expect(TokenType.RParenthesis, 'Expected closed parenthesis');
        return expression;
        
      case TokenType.Not:
        return this.ParseNotExpression();
        
      default:
        errorMessage = `Unexpected token ${this.at().value} at line ${this.at().line} column ${this.at().column}`;
        return {} as Expression;
    }
  }
}