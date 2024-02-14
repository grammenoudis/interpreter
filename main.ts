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
// env.declareVariable('ΑΛΗΘΗΣ', makeBooleanValue(false));
// env.declareVariable('ΨΕΥΔΗΣ', makeBooleanValue(true));
const parser = new Parser();
const program = parser.ProduceAST(file);
console.log(program);

const res = evaluate(program, env) as any;

for (const print of res) {
  fs.writeFileSync('output.txt', print + '\n', { flag: 'a' });
}

console.table(res);
