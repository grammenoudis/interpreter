export enum TokenType {
  Number,
  BinaryOperator,
  LParenthesis,
  RParenthesis,
  Identifier,
  Mod,
  Div,
  Power,
  Assign,
  EOF,
}

const KEYWORDS = new Map<string, TokenType>([
  ['MOD', TokenType.Mod],
  ['DIV', TokenType.Div],
  ['<-', TokenType.Assign],
]);

export interface Token {
  value: string;
  type: TokenType;
  line: number;
  column: number;
}

function makeToken(
  value = '',
  type: TokenType,
  line: number,
  column: number
): Token {
  return { value, type, line, column };
}

function isWhitespace(char: string): boolean {
  return char.match(/\s/) !== null;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const src: string[] = input.split('');
  let line: number = 1;
  let column: number = 0;
  while (src.length > 0) {
    const char = src.shift()!;
    switch (char) {
      case '(':
        tokens.push(makeToken(char, TokenType.LParenthesis, line, column));
        break;
      case ')':
        tokens.push(makeToken(char, TokenType.RParenthesis, line, column));
        break;
      case '+':
      case '-':
      case '*':
      case '/':
        tokens.push(makeToken(char, TokenType.BinaryOperator, line, column));
        break;
      case '^':
        tokens.push(makeToken(char, TokenType.Power, line, column));
        break;
      case '<':
        if (src[0] === '-') {
          tokens.push(makeToken('<-', TokenType.Assign, line, column));
          src.shift();
        }
        break;
      default:
        if (char.match(/[0-9]/)) {
          let number = char;
          while (src[0]?.match(/[0-9]/)) {
            number += src.shift();
          }
          tokens.push(makeToken(number, TokenType.Number, line, column));
        } else if (char.match(/[a-zA-Z]/)) {
          let identifier = char;
          while (
            src[0]?.match(/[a-zA-Z]/) ||
            src[0]?.match(/[0-9]/) ||
            src[0]?.match(/_/)
          ) {
            if (KEYWORDS.get(identifier) !== undefined) break;
            identifier += src.shift();
          }
          const reserved = KEYWORDS.get(identifier);
          if (typeof reserved != 'number') {
            tokens.push(
              makeToken(identifier, TokenType.Identifier, line, column)
            );
            column += identifier.length - 2;
          } else {
            tokens.push(
              makeToken(identifier, reserved as TokenType, line, column)
            );
            column += identifier.length - 1;
          }
        } else if (isWhitespace(char)) {
          column++;
        } else {
          console.error(
            `Αγνωστος χαρακτήρας: '${char}' στην γραμμή ${line}, στήλη ${column}`
          );
          process.exit(1);
        }
    }
    column++;
    if (char === '\n') {
      line++;
      column = 1;
    }
  }
  tokens.push(makeToken('EOF', TokenType.EOF, line, column));
  // console.log(tokens);
  return tokens;
}
