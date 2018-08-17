const fs = require('fs')
const util = require('util')
const parser = require('./parser')

let environment = {}

util.promisify(fs.readFile)(process.argv[2])
  .then(file => file.toString())
  .then(source => source.replace(/\n/g, ''))
  .then(source => parser.splitSExps(source))
  .then(sExps => console.log(sExps))
  .catch(error => console.error(error))
