#SymSpell.js (TypeScript)

This is a TypeScript port of the [C# SymSpell library by Wolf Garbe](https://github.com/wolfgarbe/symspell).

It was written in TypeScript and compiled to EC5 JavaScript with CommonJS support so it works well with Node.js. It is mostly a proof of concept and can easily be adapted for actual use.

##About SymSpell

1 million times faster through Symmetric Delete spelling correction algorithm

The Symmetric Delete spelling correction algorithm reduces the complexity of edit candidate generation and dictionary lookup for a given Damerau-Levenshtein distance. It is six orders of magnitude faster (than the standard approach with deletes + transposes + replaces + inserts) and language independent.

##Considerations

This is an extremely fast spelling correction algorithm, but it has a large memory footprint and the dictionary takes a considerable amount of time to build when you first start the program.

##License

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License, 
version 3.0 (LGPL-3.0) as published by the Free Software Foundation.
[http://www.opensource.org/licenses/LGPL-3.0](http://www.opensource.org/licenses/LGPL-3.0)

##Usage

* clone repo
* run `npm start`
    * wait for the dictionary to build
    * enter a word for spelling corrections
    * CTRL+C to quit

Note: the dictionary takes almost a minute to build on my laptop using the included big.txt word list.

##Contributions

If you'd like to contribute or modify this library take the following steps.

* Install dev dependencies with `npm install`
* Modify code in the src folder
* Run `gulp build` to rebuild the js in the dist folder.
* run `npm start` to execture the test file.

Feel free to submit pull requests
