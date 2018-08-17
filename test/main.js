const fs = require('fs')

let environment = {}

function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, function(err, res) {
      if (err) {
        reject(err)
      } else {
        resolve(res.toString())
      }
    })
  })
}

function processSource(source) {
  const sExps = splitSExps(source.replace(/\n/g, ''))
  console.log(sExps);
}

function foldStr(fun, acc, str) {
  for (let char of str) {
    acc = fun(char, acc)
  }
  return acc
}

function addSExp(braces, acc, expressions) {
  const newBraces = braces - 1
  if (newBraces === 0) {
    return [ newBraces, '', [].concat(expressions, [ acc ]) ]
  } else {
    return [ newBraces, acc, expressions ]
  }
}

function foldSExps(char, [ braces, acc, expressions ]) {
  const newAcc = acc + char
  switch (char) {
    case '(':
      return [ braces + 1, newAcc, expressions ]
      break
    case ')':
      return addSExp(braces, newAcc, expressions)
      break
    default:
      return [ braces, newAcc, expressions ]
  }
}

function splitSExps(source) {
  return foldStr(foldSExps, [ 0, '', [] ], source)[2]
}

readFile(process.argv[2])
  .then(file => processSource(file))
  .catch(error => console.error(error))
