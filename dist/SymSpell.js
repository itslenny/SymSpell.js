/// <reference path="../typings/tsd.d.ts" />
(function (MODES) {
    MODES[MODES["TOP"] = 0] = "TOP";
    MODES[MODES["SMALLEST"] = 1] = "SMALLEST";
    MODES[MODES["ALL"] = 2] = "ALL";
})(exports.MODES || (exports.MODES = {}));
var MODES = exports.MODES;
var DictionaryItem = (function () {
    function DictionaryItem() {
        this.suggestions = [];
        this.count = 0;
    }
    DictionaryItem.prototype.clear = function () {
        this.suggestions = [];
        this.count = 0;
    };
    return DictionaryItem;
})();
var SuggestItem = (function () {
    function SuggestItem() {
        this.term = '';
        this.distance = 0;
        this.count = 0;
    }
    return SuggestItem;
})();
var SymSpell = (function () {
    function SymSpell(options) {
        //Dictionary that contains both the original words and the deletes derived from them
        this.dictionary = {};
        //List of unique words.
        this.wordList = [];
        //maximum dictionary term length
        this.maxLength = 0;
        this.options = {
            mode: MODES.TOP,
            verbose: 2,
            editDistanceMax: 2,
            debug: true
        };
        if (options) {
            for (var key in options) {
                this.options[key] = options[key];
            }
        }
    }
    SymSpell.prototype.parseWords = function (text) {
        return text.toLowerCase().match(/([\w\d_](-[\w\d_])?('(t|d|s|m|ll|re|ve))?)+/g);
    };
    SymSpell.prototype.createDictionaryEntry = function (key, language) {
        var result = false;
        var value;
        var dictKey = language + key;
        var valueo = dictKey in this.dictionary ? this.dictionary[dictKey] : false;
        if (valueo !== false) {
            if (typeof valueo === 'number') {
                var tmp = valueo;
                value = new DictionaryItem();
                value.suggestions.push(tmp);
                this.dictionary[dictKey] = value;
            }
            else {
                value = valueo;
            }
            if (value.count < Number.MAX_VALUE)
                value.count++;
        }
        else if (this.wordList.length < Number.MAX_VALUE) {
            value = new DictionaryItem();
            value.count++;
            this.dictionary[dictKey] = value;
            if (key.length > this.maxLength)
                this.maxLength = key.length;
        }
        if (value.count === 1) {
            var keyInt = this.wordList.length;
            this.wordList.push(key);
            result = true;
            //returns object where key and value == each delete
            var edits = this.edits(key, 0);
            for (var delItem in edits) {
                var delKey = language + delItem;
                var value2 = delKey in this.dictionary ? this.dictionary[delKey] : false;
                if (value2 !== false) {
                    if (typeof value2 === 'number') {
                        var tmp_1 = value2;
                        var di = new DictionaryItem();
                        di.suggestions.push(tmp_1);
                        this.dictionary[delKey] = di;
                        //if suggestions does not contain keyInt
                        if (di.suggestions.indexOf(keyInt) === -1) {
                            this.addLowestDistance(di, key, keyInt, delItem);
                        }
                    }
                    else if (value2.suggestions.indexOf(value2.suggestions.indexOf(keyInt) === -1)) {
                        this.addLowestDistance(value2, key, keyInt, delItem);
                    }
                }
                else {
                    this.dictionary[delKey] = keyInt;
                }
            }
        }
        return result;
    }; //end createDictionaryEntry
    SymSpell.prototype.createDictionary = function (corpus, language) {
        var wordCount = 0;
        if (this.options.debug) {
            console.log('Creating dictionary...');
            var tStart = Date.now();
        }
        var words = this.parseWords(corpus);
        var self = this;
        words.forEach(function (word) {
            if (self.createDictionaryEntry(word, language)) {
                wordCount++;
            }
        });
        if (this.options.debug) {
            var tEnd = Date.now();
            var tDiff = tEnd - tStart;
            console.log("Dictionary: " + wordCount + " words, " + Object.keys(this.dictionary).length + " entries, edit distance=" + this.options.editDistanceMax + " in " + tDiff + " ms");
            console.log('memory:', process.memoryUsage());
        }
    };
    SymSpell.prototype.addLowestDistance = function (item, suggestion, suggestionInt, delItem) {
        //remove all existing suggestions of higher distance, if verbose<2
        //index2word
        if (this.options.verbose < 2 &&
            item.suggestions.length > 0 &&
            this.wordList[item.suggestions[0]].length - delItem.length > suggestion.length - delItem.length) {
            item.clear();
        }
        //do not add suggestion of higher distance than existing, if verbose<2
        if (this.options.verbose == 2 ||
            item.suggestions.length == 0 ||
            this.wordList[item.suggestions[0]].length - delItem.length >= suggestion.length - delItem.length) {
            item.suggestions.push(suggestionInt);
        }
    };
    //inexpensive and language independent: only deletes, no transposes + replaces + inserts
    //replaces and inserts are expensive and language dependent (Chinese has 70,000 Unicode Han characters)
    //C# returned HashSet<string>
    //TS returns object with key and value == each delete
    SymSpell.prototype.edits = function (word, editDistance, deletes) {
        deletes = deletes || {};
        editDistance++;
        if (word.length > 1) {
            for (var i = 0; i < word.length; i++) {
                //emulate C#'s word.Remove(i, 1)
                var delItem = word.substring(0, i) + word.substring(i + 1);
                if (!(delItem in deletes)) {
                    deletes[delItem] = delItem;
                    if (editDistance < this.options.editDistanceMax) {
                        this.edits(delItem, editDistance, deletes);
                    }
                }
            }
        }
        return deletes;
    };
    SymSpell.prototype.lookup = function (input, language, editDistanceMax) {
        if (input.length - editDistanceMax > this.maxLength) {
            return [new SuggestItem()];
        }
        var candidates = [];
        var obj1 = {};
        var suggestions = [];
        var obj2 = {};
        candidates.push(input);
        while (candidates.length > 0) {
            var candidate = candidates.shift();
            //save some time
            //early termination
            //suggestion distance=candidate.distance... candidate.distance+editDistanceMax
            //if canddate distance is already higher than suggestion distance, than there are no better suggestions to be expected
            if (this.options.verbose < 2 &&
                suggestions.length > 0 &&
                input.length - candidate.length > suggestions[0].distance) {
                break;
            }
            var dictKey = language + candidate;
            var valueo = dictKey in this.dictionary ? this.dictionary[dictKey] : false;
            if (valueo !== false) {
                var value = new DictionaryItem();
                if (typeof valueo === 'number') {
                    value.suggestions.push(valueo);
                }
                else {
                    value = valueo;
                }
                //if count>0 then candidate entry is correct dictionary term, not only delete item
                if (value.count > 0 && !(candidate in obj2)) {
                    obj2[candidate] = candidate;
                    var si = new SuggestItem();
                    si.term = candidate;
                    si.count = value.count;
                    si.distance = input.length - candidate.length;
                    suggestions.push(si);
                    //early termination
                    if (this.options.verbose < 2 &&
                        input.length - candidate.length == 0) {
                        break;
                    }
                }
                //iterate through suggestions (to other correct dictionary items) of delete item and add them to suggestion list
                var self = this;
                value.suggestions.forEach(function (intItem) {
                    var suggestion = self.wordList[intItem];
                    if (!(suggestion in obj2)) {
                        obj2[suggestion] = suggestion;
                        //True Damerau-Levenshtein Edit Distance: adjust distance, if both distances>0
                        //We allow simultaneous edits (deletes) of editDistanceMax on on both the dictionary and the input term.
                        //For replaces and adjacent transposes the resulting edit distance stays <= editDistanceMax.
                        //For inserts and deletes the resulting edit distance might exceed editDistanceMax.
                        //To prevent suggestions of a higher edit distance, we need to calculate the resulting edit distance, if there are simultaneous edits on both sides.
                        //Example: (bank==bnak and bank==bink, but bank!=kanb and bank!=xban and bank!=baxn for editDistanceMaxe=1)
                        //Two deletes on each side of a pair makes them all equal, but the first two pairs have edit distance=1, the others edit distance=2.
                        var distance = 0;
                        if (suggestion != input) {
                            if (suggestion.length === candidate.length) {
                                distance = input.length - candidate.length;
                            }
                            else if (input.length === candidate.length) {
                                distance = suggestion.length - candidate.length;
                            }
                            else {
                                //common prefixes and suffixes are ignored, because this speeds up the Damerau-levenshtein-Distance calculation without changing it.
                                var ii = 0;
                                var jj = 0;
                                while (ii < suggestion.length && ii < input.length && suggestion[ii] == input[ii])
                                    ii++;
                                while (jj < suggestion.length - ii && jj < input.length - ii && suggestion[suggestion.length - jj - 1] == input[input.length - jj - 1])
                                    jj++;
                                if (ii > 0 || jj > 0) {
                                    //c# substring = substr in js
                                    distance = self.damerauLevenshteinDistance(suggestion.substr(ii, suggestion.length - ii - jj), input.substr(ii, input.length - ii - jj));
                                }
                                else {
                                    distance = self.damerauLevenshteinDistance(suggestion, input);
                                }
                            }
                        }
                        //save some time.
                        //remove all existing suggestions of higher distance, if verbose<2
                        if (self.options.verbose < 2 && suggestions.length > 0 && suggestions[0].distance > distance) {
                            suggestions = [];
                        }
                        //do not process higher distances than those already found, if verbose<2
                        if (self.options.verbose < 2 && suggestions.length > 0 && distance > suggestions[0].distance) {
                            return;
                        }
                        if (distance <= editDistanceMax) {
                            var dictKey2 = language + suggestion;
                            var value2 = dictKey2 in self.dictionary ? self.dictionary[dictKey2] : false;
                            if (value2 !== false) {
                                var si = new SuggestItem();
                                si.term = suggestion;
                                si.count = value2.count;
                                si.distance = distance;
                                suggestions.push(si);
                            }
                        }
                    }
                }); //end forEach
            } //end if -- valueo
            //add edits
            //derive edits (deletes) from candidate (input) and add them to candidates list
            //this is a recursive process until the maximum edit distance has been reached
            if (input.length - candidate.length < editDistanceMax) {
                //save some time
                //do not create edits with edit distance smaller than suggestions already found
                if (this.options.verbose < 2 && suggestions.length > 0 && input.length - candidate.length >= suggestions[0].distance) {
                    continue;
                }
                for (var i = 0; i < candidate.length; i++) {
                    //emulate C#'s word.Remove(i, 1)
                    var delItem = candidate.substring(0, i) + candidate.substring(i + 1);
                    // var delItem: string = candidate.Remove(i, 1);
                    if (!(delItem in obj1)) {
                        obj1[delItem] = delItem;
                        candidates.push(delItem);
                    }
                }
            }
        } //end while
        //sort by ascending edit distance, then by descending word frequency
        //sort:
        if (this.options.verbose < 2) {
            suggestions = suggestions.sort(function (x, y) {
                //-x.count.CompareTo(y.count)
                return y.count - x.count;
            });
        }
        else {
            suggestions = suggestions.sort(function (x, y) {
                // 2 * x.distance.CompareTo(y.distance) - x.count.CompareTo(y.count)
                return 2 * (x.distance - y.distance) - (x.count - y.count);
            });
        }
        if (this.options.verbose == 0 && suggestions.length > 1) {
            //C#: GetRange
            return suggestions.slice(0, 1);
        }
        else {
            return suggestions;
        }
    };
    SymSpell.prototype.correct = function (input, language) {
        var suggestions = [];
        //check in dictionary for existence and frequency; sort by ascending edit distance, then by descending word frequency
        suggestions = this.lookup(input, language, this.options.editDistanceMax);
        return suggestions;
    };
    // Damerau--Levenshtein distance algorithm and code
    // from http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance (as retrieved in June 2012)
    SymSpell.prototype.damerauLevenshteinDistance = function (source, target) {
        var m = source.length;
        var n = target.length;
        //new Int32[m + 2, n + 2];
        var H = [];
        var sd = {};
        var INF = m + n;
        H[0] = [];
        H[0][0] = INF;
        //init structures
        for (var i = 0; i <= m; i++) {
            if (!H[i + 1])
                H[i + 1] = [];
            H[i + 1][1] = i;
            H[i + 1][0] = INF;
            sd[source[i]] = 0;
        }
        for (var j = 0; j <= n; j++) {
            H[1][j + 1] = j;
            H[0][j + 1] = INF;
            sd[target[j]] = 0;
        }
        var concatString = source + target;
        for (var i = 1; i <= m; i++) {
            var DB = 0;
            for (var j = 1; j <= n; j++) {
                var i1 = sd[target[j - 1]];
                var j1 = DB;
                if (source[i - 1] == target[j - 1]) {
                    H[i + 1, j + 1] = H[i, j];
                    DB = j;
                }
                else {
                    H[i + 1][j + 1] = Math.min(H[i][j], Math.min(H[i + 1][j], H[i][j + 1])) + 1;
                }
                H[i + 1][j + 1] = Math.min(H[i + 1][j + 1], H[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1));
            }
            sd[source[i - 1]] = i;
        }
        return H[m + 1][n + 1];
    };
    return SymSpell;
})();
exports.SymSpell = SymSpell; //end SymSpell class

//# sourceMappingURL=SymSpell.js.map
