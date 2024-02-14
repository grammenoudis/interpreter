import * as fs from 'fs';

export enum TokenType {
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
  If,
  Then,
  ElseIf,
  Else,
  EndIf,
  EOF,
}

//clear the output file
fs.writeFile('output.txt', '', function (err) {});

const KEYWORDS = new Map<string, TokenType>([
  ['MOD', TokenType.Mod],
  ['DIV', TokenType.Div],
  ['EOF', TokenType.EOF],
  ['ΓΡΑΨΕ', TokenType.Print],
  ['ΑΛΗΘΗΣ', TokenType.Booleans],
  ['ΨΕΥΔΗΣ', TokenType.Booleans],
  ['ΣΤΑΘΕΡΕΣ', TokenType.Constants],
  ['ΜΕΤΑΒΛΗΤΕΣ', TokenType.Variables],
  ['ΠΡΑΓΜΑΤΙΚΕΣ', TokenType.RealNumbers],
  ['ΧΑΡΑΚΤΗΡΕΣ', TokenType.Alphanumericals],
  ['ΛΟΓΙΚΕΣ', TokenType.Booleans],
  ['ΑΚΕΡΑΙΕΣ', TokenType.Integers],
  ['ΚΑΙ', TokenType.And],
  ['Ή', TokenType.Or],
  ['ΑΝ', TokenType.If],
  ['ΤΟΤΕ', TokenType.Then],
  ['ΑΛΛΙΩΣ_ΑΝ', TokenType.ElseIf],
  ['ΑΛΛΙΩΣ', TokenType.Else],
  ['ΤΕΛΟΣ_ΑΝ', TokenType.EndIf],
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
  //detect if character is whitespace apart newline
  return char.match(/[ \t]/) !== null;
}

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
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const src: string[] = input.split('');
  let error = expectTemplate(src);
  if (error) {
    console.error(error);
    process.exit(1);
  }

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
      case ' ':
        break;
      default:
        let charactersToBuild: string = char;
        let isExpectingString: boolean = char == `'`;

        if (isExpectingString) {
          while (!isWhitespace(src[0]) && src[0] !== '\n') {
            charactersToBuild += src.shift();
            console.log(charactersToBuild);
            column++;
          }
        } else {
          while (
            src[0].match(/[a-zA-ZΑ-Ω0-9.]/) &&
            !isWhitespace(src[0]) &&
            src[0] !== '\n'
          ) {
            charactersToBuild += src.shift();
            column++;
          }
        }

        // if (src[0] != '\n') {
        //   src.shift();
        // }
        let reserved = KEYWORDS.get(charactersToBuild);
        if (reserved !== undefined) {
          tokens.push(
            makeToken(charactersToBuild, reserved as TokenType, line, column)
          );
        } else if (charactersToBuild[0] === "'") {
          if (charactersToBuild[charactersToBuild.length - 1] !== "'") {
            console.error(`Λάθος στην γραμμή ${line}, στήλη ${column}`);
            process.exit(1);
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
              makeToken(charactersToBuild, TokenType.Number, line, column)
            );
          }
        } else if (charactersToBuild[0].match(/[a-zA-ZΑ-Ω]/)) {
          tokens.push(
            makeToken(charactersToBuild, TokenType.Identifier, line, column)
          );
        } else {
          console.error(
            `Αγνωστος χαρακτήρας: '${char}' στην γραμμή ${line}, στήλη ${column}`
          );
          process.exit(1);
        }
    }
    // if (char.match(/[0-9]/)) {
    //   let number = char;
    //   while (src[0]?.match(/[0-9]/)) {
    //     number += src.shift();
    //   }
    //   tokens.push(makeToken(number, TokenType.Number, line, column));
    // } else if (
    //   char.match(/[a-zA-ZΑ-Ω]/) ||
    //   char.match(/[0-9]/) ||
    //   char.match(/_/)
    // ) {
    //   let identifier = char;
    //   while (
    //     src[0]?.match(/[a-zA-ZΑ-Ω]/) ||
    //     src[0]?.match(/[0-9]/) ||
    //     src[0]?.match(/_/)
    //   ) {
    //     //check if the word is a keyword. If the next character is a space and the word that has been built is a keyword, then break
    //     if (KEYWORDS.get(identifier) !== undefined && src[1] != ' ') break;
    //     identifier += src.shift();
    //   }
    //   const reserved = KEYWORDS.get(identifier);
    //   if (typeof reserved != 'number') {
    //     tokens.push(
    //       makeToken(identifier, TokenType.Identifier, line, column)
    //     );
    //     column += identifier.length - 2;
    //   } else {
    //     tokens.push(
    //       makeToken(identifier, reserved as TokenType, line, column)
    //     );
    //     column += identifier.length - 1;
    //   }
    // } else if (isWhitespace(char)) {
    //   column++;
    // } else {
    //   console.error(
    //     `Αγνωστος χαρακτήρας: '${char}' στην γραμμή ${line}, στήλη ${column}`
    //   );
    //   process.exit(1);
    // }
    column++;
    if (char === '\n') {
      line++;
      column = 1;
    }
  }
  tokens.push(makeToken('EOF', TokenType.EOF, line, column));
  console.log(tokens);
  return tokens;
}
