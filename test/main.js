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

function splitSExps(source) {
  let expressions = []
  let braces = 0
  let acc = ''

  for (let char of source) {
    acc += char
    if (char === '(') {
      braces += 1
    } else if (char === ')') {
      braces -= 1
      if (braces === 0) {
        expressions.push(acc)
        acc = ''
      }
    }
  }

  if (acc.startsWith('(')) {
    return null
  } else {
    return expressions
  }
}

readFile(process.argv[2])
  .then(file => processSource(file))
  .catch(error => console.error(error))
