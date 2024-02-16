#!/usr/bin/env node
import Parser from './parser';
import { evaluate } from './runtime/interpreter';
import Environment from './runtime/environment';
import * as path from 'path';
import * as fs from 'fs';

export function run(isCli = false, src = '') {
  if (isCli) {
    const args = process.argv.slice(2);
    const absolutePath = path.resolve(args[0]);
    fs.writeFile('output.txt', '', function (err) {});
    src = fs.readFileSync(absolutePath, 'utf-8');
  }
  const env = new Environment();
  const parser = new Parser();
  const program = parser.ProduceAST(src);

  var errorMessage: string | undefined;
  var res;
  if (typeof program === 'string') {
    errorMessage = program;
  } else {
    console.log(JSON.stringify(program, null, 2));
    res = evaluate(program, env) as any;
    if (typeof res === 'string') {
      errorMessage = res;
    } else {
      for (const print of res) {
        fs.writeFileSync('output.txt', print + '\n', { flag: 'a' });
      }
    }
  }

  if (errorMessage) return errorMessage;
  return res;
}

console.table(run(true));
