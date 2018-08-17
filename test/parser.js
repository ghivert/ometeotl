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
    return Promise.reject('Wrong lexing')
  } else {
    return Promise.resolve(expressions)
  }
}

module.exports = {
  splitSExps
}
