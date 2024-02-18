export enum TokenType {
  EqualSign,
  Number,
  String,
  RealNumber,
  Integer,
  Boolean,
  BinaryOperator,
  LParenthesis,
  RParenthesis,
  Identifier,
  Mod,
  Div,
  Power,
  Assign,
  Compare,
  EndOfLine,
  Print,
  Seperator,
  Apostrophe,
  Constants,
  Variables,
  RealNumbers,
  Alphanumericals,
  Booleans,
  Integers,
  And,
  Or,
  Not,
  If,
  Then,
  ElseIf,
  Else,
  EndIf,
  Start,
  Colon,
  EndOfProgram,
  Switch,
  EndSwitch,
  Case,
  Range,
  ReadInput,
  EOF,
}

const KEYWORDS = new Map<string, TokenType>([
  ['MOD', TokenType.Mod],
  ['DIV', TokenType.Div],
  ['EOF', TokenType.EOF],
  ['ΓΡΑΨΕ', TokenType.Print],
  ['ΑΛΗΘΗΣ', TokenType.Boolean],
  ['ΨΕΥΔΗΣ', TokenType.Boolean],
  ['ΣΤΑΘΕΡΕΣ', TokenType.Constants],
  ['ΜΕΤΑΒΛΗΤΕΣ', TokenType.Variables],
  ['ΠΡΑΓΜΑΤΙΚΕΣ', TokenType.RealNumbers],
  ['ΧΑΡΑΚΤΗΡΕΣ', TokenType.Alphanumericals],
  ['ΛΟΓΙΚΕΣ', TokenType.Booleans],
  ['ΑΚΕΡΑΙΕΣ', TokenType.Integers],
  ['ΟΧΙ', TokenType.Not],
  ['ΚΑΙ', TokenType.And],
  ['Ή', TokenType.Or],
  ['ΑΝ', TokenType.If],
  ['ΤΟΤΕ', TokenType.Then],
  ['ΑΛΛΙΩΣ_ΑΝ', TokenType.ElseIf],
  ['ΑΛΛΙΩΣ', TokenType.Else],
  ['ΤΕΛΟΣ_ΑΝ', TokenType.EndIf],
  ['ΑΡΧΗ', TokenType.Start],
  ['ΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ', TokenType.EndOfProgram],
  ['ΔΙΑΒΑΣΕ', TokenType.ReadInput],
]);

export interface Token {
  value: string;
  type: TokenType;
  line: number;
  column: number;
  arrayCell?: number;
}

function makeToken(
  value = '',
  type: TokenType,
  line: number,
  column: number,
  arrayCell?: number
): Token {
  return { value, type, line, column, arrayCell };
}

function isWhitespace(char: string): boolean {
  //detect if character is whitespace apart newline
  return char.match(/[ \t]/) !== null;
}

var errorMessage: string | void;

function expectTemplate(src: string[]): string | void {
  let programmaKeyword = src.splice(0, 9);
  if (programmaKeyword.join('') !== 'ΠΡΟΓΡΑΜΜΑ') {
    return 'Αναμενόταν η λέξη "ΠΡΟΓΡΑΜΜΑ"';
  }

  while (isWhitespace(src[0])) {
    src.shift();
  }

  let ProgramHasName = false;
  while (src[0] !== '\n') {
    ProgramHasName = true;
    src.shift();
  }
  if (!ProgramHasName) return 'Το πρόγραμμα σου πρέπει να έχει όνομα';
  //remove newline character
  src.shift();
}
export function tokenize(input: string): Token[] | string {
  const tokens: Token[] = [];
  const src: string[] = input.split('');
  let error = expectTemplate(src);
  if (error) {
    errorMessage = error;
    return errorMessage;
  }

  let line: number = 2;
  let column: number = 0;
  while (src.length > 0 && !errorMessage) {
    const char = src.shift()!;
    switch (char) {
      case '(':
        tokens.push(makeToken(char, TokenType.LParenthesis, line, column));
        break;
      case ')':
        tokens.push(makeToken(char, TokenType.RParenthesis, line, column));
        break;
      case '=':
        tokens.push(makeToken(char, TokenType.EqualSign, line, column));
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
        } else if (src[0] === '>') {
          tokens.push(makeToken('<>', TokenType.Compare, line, column));
          src.shift();
        } else if (src[0] == '=') {
          tokens.push(makeToken('<=', TokenType.Compare, line, column));
          src.shift();
        } else {
          tokens.push(makeToken(char, TokenType.Compare, line, column));
        }
        break;
      case '>':
        if (src[0] === '=') {
          tokens.push(makeToken('>=', TokenType.Compare, line, column));
          src.shift();
        } else tokens.push(makeToken(char, TokenType.Compare, line, column));
        break;
      case ',':
        tokens.push(makeToken(char, TokenType.Seperator, line, column));
        break;
      case 'Ή':
        tokens.push(makeToken('Ή', TokenType.Or, line, column));
        break;
      case '\n':
        tokens.push(makeToken(char, TokenType.EndOfLine, line, column));
        break;
      case ':':
        tokens.push(makeToken(char, TokenType.Colon, line, column));
        break;
      case ' ':
        break;
      default:
        let charactersToBuild: string = char;
        let isExpectingString: boolean = char == `'`;
        let arrayCell = '';

        if (isExpectingString) {
          while (src[0] !== '\n' && src[0] !== "'") {
            charactersToBuild += src.shift();
            column++;
          }
          if (src[0] === `'`) {
            charactersToBuild += src.shift();
            column++;
          }
        } else {
          while (
            src[0].match(/[a-zA-ZΑ-Ωα-ω0-9.]/) ||
            src[0] === '[' ||
            src[0] === '_'
          ) {
            if (src[0] === '[') {
              src.shift();
              while (
                (src[0] as string) !== ']' &&
                (src[0] as string) !== '\n'
              ) {
                if (isWhitespace(src[0])) {
                  src.shift();
                } else {
                  arrayCell += src.shift();
                  column++;
                }
              }
              // Shift the closing bracket
              src.shift();
            } else if (!isWhitespace(src[0])) {
              charactersToBuild += src.shift();
              column++;
            }
          }
        }

        let reserved = KEYWORDS.get(charactersToBuild);
        if (reserved !== undefined) {
          tokens.push(
            makeToken(charactersToBuild, reserved as TokenType, line, column)
          );
        } else if (charactersToBuild[0] === "'") {
          if (charactersToBuild[charactersToBuild.length - 1] !== "'") {
            errorMessage = `Λάθος στην γραμμή ${line}, στήλη ${column}, δεν έχει κλείσει το απόστροφο`;
          }
          charactersToBuild = charactersToBuild.slice(
            1,
            charactersToBuild.length - 1
          );
          tokens.push(
            makeToken(charactersToBuild, TokenType.String, line, column)
          );
        } else if (!isNaN(charactersToBuild as string as any)) {
          if (charactersToBuild.includes('.')) {
            tokens.push(
              makeToken(charactersToBuild, TokenType.RealNumber, line, column)
            );
          } else {
            tokens.push(
              makeToken(charactersToBuild, TokenType.Integer, line, column)
            );
          }
        } else if (charactersToBuild[0].match(/[a-zA-ZΑ-Ωα-ω]/)) {
          if (arrayCell) {
            tokens.push(
              makeToken(
                charactersToBuild,
                TokenType.Identifier,
                line,
                column,
                parseInt(arrayCell)
              )
            );
          } else
            tokens.push(
              makeToken(charactersToBuild, TokenType.Identifier, line, column)
            );
        } else {
          if (char === '"')
            errorMessage = `Στην γραμμή ${line}, στήλη ${column}, χρησιμοποίησε απόστροφο αντί για εισαγωγικά`;
          else
            errorMessage = `Αγνωστος χαρακτήρας: '${char}' στην γραμμή ${line}, στήλη ${column}`;
        }
    }
    column++;
    if (char === '\n') {
      line++;
      column = 1;
    }
  }
  tokens.push(makeToken('EOF', TokenType.EOF, line, column));
  console.log(tokens);
  if (errorMessage) return errorMessage;

  return tokens;
}
