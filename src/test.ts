/// <reference path="../typings/tsd.d.ts" />

import {SymSpell} from './SymSpell';
import * as fs from 'fs';
import * as readline from 'readline';

var s = new SymSpell();

s.createDictionary(fs.readFileSync('./big.txt').toString(), '');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(word) {
  var suggestions = s.correct(word.trim(), '');

  for (let key in suggestions) {
    let suggestion = suggestions[key];
    console.log(`${suggestion.term} ${suggestion.distance} ${suggestion.count}`, suggestion);
  }
  console.log(`${suggestions.length}  suggestions`);

});

