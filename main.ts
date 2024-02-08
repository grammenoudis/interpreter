import * as path from 'path';
import * as fs from 'fs';
import Parser from './parser';
import { evaluate } from './runtime/interpreter';
import Environment from './runtime/environment';
import { makeBooleanValue, makeNumberValue } from './runtime/values';

const args = process.argv.slice(2);
const absolutePath = path.resolve(args[0]);

const file = fs.readFileSync(absolutePath, 'utf-8');

const env = new Environment();
env.declareVariable('true', makeBooleanValue(true));
env.declareVariable('false', makeBooleanValue(false));
const parser = new Parser();
const program = parser.ProduceAST(file);

const res = evaluate(program, env);

// console.log(program);
// console.log(res);
