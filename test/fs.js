const fs = require('fs')

const readFile = file =>
  new Promise((resolve, reject) =>
    fs.readFile(file, (err, res) =>
      err ? reject(err) : resolve(res)
    )
  )

module.exports = {
  readFile
}
