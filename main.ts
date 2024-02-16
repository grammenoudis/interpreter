#!/usr/bin/env node
import * as path from 'path';
import * as fs from 'fs';
import Parser from './parser';
import { evaluate } from './runtime/interpreter';
import Environment from './runtime/environment';
import { makeBooleanValue } from './runtime/values';

const args = process.argv.slice(2);
const absolutePath = path.resolve(args[0]);

const file = fs.readFileSync(absolutePath, 'utf-8');

const env = new Environment();
env.declareVariable('ΑΛΗΘΗΣ', 'Boolean');
env.declareVariable('ΨΕΥΔΗΣ', 'Boolean');
const parser = new Parser();
const program = parser.ProduceAST(file);

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

console.table(res);
console.log(errorMessage);
