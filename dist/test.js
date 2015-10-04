/// <reference path="../typings/tsd.d.ts" />
var SymSpell_1 = require('./SymSpell');
var fs = require('fs');
var readline = require('readline');
var s = new SymSpell_1.SymSpell();
s.createDictionary(fs.readFileSync('./big.txt').toString(), '');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
rl.on('line', function (word) {
    var suggestions = s.correct(word.trim(), '');
    for (var key in suggestions) {
        var suggestion = suggestions[key];
        console.log(suggestion.term + " " + suggestion.distance + " " + suggestion.count, suggestion);
    }
    console.log(suggestions.length + "  suggestions");
});

//# sourceMappingURL=test.js.map
