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
  Characters,
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
  For,
  EndLoop,
  From,
  Until,
  While,
  Step,
  Repeat,
  DoWhile,
  Program,
  LBracket,
  RBracket,
  StartLoop,
  Function,
  EndFunction,
  ReturnType,
  Procedure,
  EndProcedure,
  Call,
  EOF,
}
const KEYWORDS = new Map<string, TokenType>([
  ['ΠΡΟΓΡΑΜΜΑ', TokenType.Program],
  ['MOD', TokenType.Mod],
  ['DIV', TokenType.Div],
  ['EOF', TokenType.EOF],
  ['ΓΡΑΨΕ', TokenType.Print],
  ['ΑΛΗΘΗΣ', TokenType.Boolean],
  ['ΨΕΥΔΗΣ', TokenType.Boolean],
  ['ΣΤΑΘΕΡΕΣ', TokenType.Constants],
  ['ΜΕΤΑΒΛΗΤΕΣ', TokenType.Variables],
  ['ΠΡΑΓΜΑΤΙΚΕΣ', TokenType.RealNumbers],
  ['ΧΑΡΑΚΤΗΡΕΣ', TokenType.Characters],
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
  ['ΓΙΑ', TokenType.For],
  ['ΑΠΟ', TokenType.From],
  ['ΜΕΧΡΙ', TokenType.Until],
  ['ΜΕΧΡΙΣ_ΟΤΟΥ', TokenType.DoWhile],
  ['ΜΕ_ΒΗΜΑ', TokenType.Step],
  ['ΕΠΑΝΑΛΑΒΕ', TokenType.Repeat],
  ['ΟΣΟ', TokenType.While],
  ['ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ', TokenType.EndLoop],
  ['ΑΡΧΗ_ΕΠΑΝΑΛΗΨΗΣ', TokenType.StartLoop],
  ['ΔΙΑΔΙΚΑΣΙΑ', TokenType.Procedure],
  ['ΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ', TokenType.EndProcedure],
  ['ΚΑΛΕΣΕ', TokenType.Call],
  ['ΣΥΝΑΡΤΗΣΗ', TokenType.Function],
  ['ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ', TokenType.EndFunction],
  ['ΑΚΕΡΑΙΑ', TokenType.ReturnType],
  ['ΠΡΑΓΜΑΤΙΚΗ', TokenType.ReturnType],
  ['ΑΛΦΑΡΙΘΜΗΤΙΚΗ', TokenType.ReturnType],
  ['ΛΟΓΙΚΗ', TokenType.ReturnType],
]);

export interface Token {
  value: string;
  type: TokenType;
  line: number;
  column: number;
  arrayCell?: any;
}

function makeToken(
  value = '',
  type: TokenType,
  line: number,
  column: number,
  arrayCell?: any
): Token {
  return { value, type, line, column, arrayCell };
}

function isWhitespace(char: string): boolean {
  //detect if character is whitespace apart newline
  return char.match(/[ \t]/) !== null;
}

var errorMessage: string | void;

// Function to normalize line endings
function normalizeInput(input: string): string {
  // Replace all CRLF with LF
  return input.replace(/\r\n/g, '\n');
}

export function tokenize(input: string): Token[] | string {
  // Normalize input first
  input = normalizeInput(input);
  
  const tokens: Token[] = [];
  const src: string[] = input.split('');

  let line: number = 1; // Starting from line 1 is more conventional
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
        line++;
        column = -1; // Will be incremented to 0 at the end of the loop
        break;
      case '\r':
        // Skip carriage returns as they are normalized to \n
        column--; // Negate the column increment that happens at the end
        break;
      case ':':
        tokens.push(makeToken(char, TokenType.Colon, line, column));
        break;
      case ' ':
      case '\t':
        // Just skip whitespace
        break;
      case '!':
        // Comment handling
        src.shift();
        while (src.length > 0 && src[0] != '\n') src.shift();
        break;
      default:
        let charactersToBuild: string = char;
        let isExpectingString: boolean = char == `'`;
        let arrayCell = '';

        if (isExpectingString) {
          while (src.length > 0 && src[0] !== '\n' && src[0] !== "'") {
            charactersToBuild += src.shift();
            column++;
          }
          if (src.length > 0 && src[0] === `'`) {
            charactersToBuild += src.shift();
            column++;
          } else {
            errorMessage = `Λάθος στην γραμμή ${line}, στήλη ${column}, δεν έχει κλείσει το απόστροφο`;
          }
        } else {
          while (
            (src.length > 0 && src[0].match(/[a-zA-ZΑ-Ωα-ω0-9.]/)) ||
            (src.length > 0 && (src[0] === '_' || src[0] === '['))
          ) {
            if (src.length > 0 && src[0] === '[') {
              src.shift();
              while (
                src.length > 0 && 
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
              if (src.length > 0) src.shift();
            } else if (src.length > 0 && !isWhitespace(src[0])) {
              charactersToBuild += src.shift();
              column++;
            }
          }
        }

        let reserved = KEYWORDS.get(charactersToBuild.toUpperCase());
        if (reserved !== undefined) {
          tokens.push(
            makeToken(charactersToBuild, reserved as TokenType, line, column)
          );
        } else if (charactersToBuild[0] === "'") {
          if (charactersToBuild[charactersToBuild.length - 1] !== "'") {
            errorMessage = `Λάθος στην γραμμή ${line}, στήλη ${column}, δεν έχει κλείσει το απόστροφο`;
          } else {
            charactersToBuild = charactersToBuild.slice(
              1,
              charactersToBuild.length - 1
            );
            tokens.push(
              makeToken(charactersToBuild, TokenType.String, line, column)
            );
          }
        } else if (!isNaN(Number(charactersToBuild))) {
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
            arrayCell = arrayCell + '\n';
            tokens.push(
              makeToken(
                charactersToBuild,
                TokenType.Identifier,
                line,
                column,
                //get rid of newline and eof
                arrayCell.slice(0, arrayCell.length - 1)
              )
            );
          } else {
            tokens.push(
              makeToken(charactersToBuild, TokenType.Identifier, line, column)
            );
          }
        } else {
          if (char === '"') {
            errorMessage = `Στην γραμμή ${line}, στήλη ${column}, χρησιμοποίησε απόστροφο αντί για εισαγωγικά`;
          } else {
            errorMessage = `Αγνωστος χαρακτήρας: '${char}' στην γραμμή ${line}, στήλη ${column}`;
          }
        }
    }
    column++;
  }
  tokens.push(makeToken('EOF', TokenType.EOF, line, column));
  
  // Remove consecutive newlines (accept only 1 at a time)
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type === TokenType.EndOfLine && tokens[i + 1].type === TokenType.EndOfLine) {
      tokens.splice(i, 1);
      i--;
    }
  }
  
  if (errorMessage) return errorMessage;
  console.log(JSON.stringify(tokens, null, 2));
  return tokens;
}