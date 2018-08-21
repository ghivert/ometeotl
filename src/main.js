const fs = require('fs')
const path = require('path')
const runtime = require('./runtime')

import type { AST, Atom } from './types'

const tokensRegex = /([[\]{}()])/g
const METADATA = 'ometeotl.json'

function tokenize(source: string): Array<string> {
  return source
    .replace(/;.*\n/g, '\n')
    .replace(/\n/g, '')
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

function parse(tokens: Array<string>): AST {
  while (tokens.length > 0) {
    const token = tokens.shift()
    if (token === '(') {
      let expression = []
      while (tokens[0] !== ')') {
        expression.push(parse(tokens))
      }
      tokens.shift()
      return { type: 'List', value: expression }
    } else if (token === '[') {
      let array = []
      while (tokens[0] !== ']') {
        array.push(parse(tokens))
      }
      tokens.shift()
      return { type: 'Array', value: array }
    } else if (token === ']') {
      throw 'Syntax Error'
    } else if (token === ')') {
      throw 'Syntax Error'
    } else {
      return atom(token)
    }
  }
  throw 'Empty File'
}

function atom(token: string): Atom {
  const toInt = parseInt(token, 10)
  if (isNaN(toInt)) {
    const toFloat = parseFloat(token)
    if (isNaN(toFloat)) {
      if (token.startsWith(':')) {
        return { type: 'Symbol', value: token.slice(1) }
      } else if (token.startsWith('"')) {
        return { type: 'String', value: removeQuotes(token) }
      } else {
        return { type: 'Identifier', value: token }
      }
    } else {
      return { type: 'Float', value: toFloat }
    }
  } else {
    return { type: 'Int', value: toInt }
  }
}

function removeQuotes(token: string): string {
  return token.slice(1, token.length - 1)
}

function debug<Type>(value: Type): Type { // eslint-disable-line
  console.log(JSON.stringify(value, null, 1))
  return value
}

function loadFile(fileName) {
  const absolutePath = path.resolve(fileName)
  const metadata = loadMetadata(absolutePath)
  if (!metadata) {
    throw 'Unable to find' + METADATA + '. Are you sure you have one in root folder?'
  } else {
    if (fs.existsSync(absolutePath)) {
      compileFile(metadata, absolutePath)
    } else {
      throw 'Unable to find' + fileName + '.'
    }
  }
}

function loadMetadata(fileName) {
  const pathSegments = path
    .dirname(fileName)
    .split('/')
  while (pathSegments.length > 0) {
    const basePath = pathSegments.join('/')
    const pathToMetadata = path.resolve(basePath, METADATA)
    if (fs.existsSync(pathToMetadata)) {
      const metadata = JSON.parse(
        fs.readFileSync(pathToMetadata)
          .toString()
      )
      metadata.basePath = basePath
      return metadata
    }
    pathSegments.pop()
  }
  return null
}

function resolveNamespace(metadata, fileName) {
  const pathSegments = path
    .dirname(fileName)
    .split('/')
    .reverse()
  pathSegments.unshift(path.basename(fileName, '.ome'))
  let namespace = []
  while (pathSegments.length > 0) {
    const segment = pathSegments.shift()
    if (metadata['source-directories'].includes(segment)) {
      return namespace
    } else {
      namespace.push(segment)
    }
  }
  throw 'Not in source-directories.'
}

function compileFile(metadata, fileName) {
  const namespace = resolveNamespace(metadata, fileName)
  Promise.resolve(fileName)
    .then(fs.readFileSync)
    .then(file => file.toString())
    .then(tokenize)
    .then(mergeStrings)
    .then(source => {
      try {
        return parse(source)
      } catch (error) {
        return { type: 'List', value: [] }
      }
    })
    .then(debug)
    .then(runtime.compile(namespace))
    .then(console.log)
    .catch(console.log)
}

// function defun(name, args, body) {
//   return ''
// }

loadFile(process.argv[2])
