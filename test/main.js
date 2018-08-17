const fs = require('./fs')
const parser = require('./parser')

let environment = {}

fs.readFile(process.argv[2])
  .then(file => file.toString())
  .then(source => source.replace(/\n/g, ''))
  .then(source => parser.splitSExps(source))
  .then(sExps => console.log(sExps))
  .catch(error => console.error(error))
