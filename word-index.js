/**
 * This is a really terrible word index of every word in the quotes
 */

const wordIndex = new Map();
const quotes = require('./quotes');
const _ = require('lodash');

// these are from https://github.com/fergiemcdowall/stopword/blob/master/lib/stopwords_en.js
const stopWords = new Set([
  'about', 'after', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'are', 'as', 'at', 'be',
  'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'can',
  'come', 'could', 'did', 'do', 'each', 'for', 'from', 'get', 'got', 'has', 'had',
  'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'how', 'if', 'in', 'into',
  'is', 'it', 'like', 'make', 'many', 'me', 'might', 'more', 'most', 'much', 'must',
  'my', 'never', 'now', 'of', 'on', 'only', 'or', 'other', 'our', 'out', 'over',
  'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than',
  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'up', 'very', 'was', 'way', 'we', 'well', 'were',
  'what', 'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your', 'a', 'i'
]);

const REPLACE_CHARS = /\W+|\'|\"|[...]|\.|\?|\:/gi;

function initIndex() {
  quotes.forEach((q, idx) => {
    const words = q.split(' ');

    words.forEach(w => {
      const word = w.toLowerCase().replace(REPLACE_CHARS, '');

      // don't add stop words to index
      if (stopWords.has(word)) {
        return;
      }

      // create a set of integers that will correspond to the matching quote index in the quotes array
      if (!wordIndex.has(word)) {
        const set = new Set([idx]);
        wordIndex.set(word, set);
      } 
      // we already have this entry, so just add it
      else {
        const entry = wordIndex.get(word);
        entry.add(idx);
      }
    });
  });
}

function getQuoteByWord(_word = '') {
  if (!_.isUndefined(_word)) {
    const word = _word.toLowerCase().replace(REPLACE_CHARS, '');
    const entries = wordIndex.get(word);
    if (entries && entries.size > 0) {
      // get a random item from the array of indexes that have the matching word for the quote
      return makeQuoteObj(word, true, quotes[_.sample(Array.from(entries))]);
    } else {
      return makeQuoteObj(word, false, _.sample(quotes));
    }
  } else {
    return makeQuoteObj(word, false, _.sample(quotes));
  }
}

function makeQuoteObj(origWord, wasFound, quote) {
  return {
    origWord,
    wasFound,
    quote
  };
}

module.exports = {
  initIndex,
  getQuoteByWord
};
