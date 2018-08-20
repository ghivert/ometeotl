const fs = require('fs')
const util = require('util')

const tokensRegex = /([[\]{}()])/g

function tokenize(source: string): Array<string> {
  return source
    .replace(tokensRegex, ' $1 ')
    .split(' ')
    .reduce(flattenTokens, [])
}

function flattenTokens(accumulator: Array<string>, value: string): Array<string> {
  if (value === '') {
    return accumulator
  } else {
    return accumulator.concat([ value ])
  }
}

function mergeStrings(tokens: Array<string>): Array<string> {
  let newTokens = []
  while (tokens.length > 0) {
    let token = tokens.shift()
    if (token.startsWith('"')) {
      while (!token.endsWith('"')) {
        token = [ token, tokens.shift() ].join(' ')
      }
    }
    newTokens.push(token)
  }
  return newTokens
}

type AST
  = Atom
  | Array<AST>

function parse(tokens: Array<string>): AST {
  while (tokens.length > 0) {
    const token = tokens.shift()
    if (token === '(') {
      let expression = []
      while (tokens[0] !== ')') {
        expression.push(parse(tokens))
      }
      return expression
    } else if (token === ')') {
      throw 'Syntax Error'
    } else {
      return atom(token)
    }
  }
  return []
}

type Atom = {
  type: 'Symbol' | 'Float' | 'Int',
  value: number | string
}

function atom(token: string): Atom {
  const toInt = parseInt(token, 10)
  if (isNaN(toInt)) {
    const toFloat = parseFloat(token)
    if (isNaN(toFloat)) {
      return { type: 'Symbol', value: token }
    } else {
      return { type: 'Float', value: toFloat }
    }
  } else {
    return { type: 'Int', value: toInt }
  }
}

function debug<Type>(value: Type): Type { // eslint-disable-line
  console.log(value)
  return value
}

util.promisify(fs.readFile)(process.argv[2])
  .then(file => file.toString())
  .then(source => source.replace(/\n/g, ''))
  .then(tokenize)
  .then(mergeStrings)
  .then(parse)
  .then(sExps => console.log(sExps))
  .catch(error => console.error(error))
