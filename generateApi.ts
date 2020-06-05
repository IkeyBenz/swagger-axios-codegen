const prettier = require('prettier')
const { codegen } = require('./src')
const colors = require('colors')
const fs = require('fs')
const diff = require('diff')
const hoverRepoDir = 'E:/Hover/mergg-react-native-refactored/'

const outputSplit = '>---------------------------------------------------------'

const getLineNumbersFromFileData = data => {
  const lines = data.toString().split('\n')
  const ret = {}
  let ln = 1
  lines.forEach(line => {
    ret[line] = ln
    ln += 1
  })
  return ret
}

// const PRETTIER_CONFIG = {
//   bracketSpacing: true,
//   jsxBracketSameLine: true,
//   singleQuote: true,
//   trailingComma: 'all',
//   parser: 'typescript'
// }

// codegen({
//   methodNameMode: 'summary',
//   source: require('./swagger.json'),
//   useCustomerRequestInstance: false,
//   outputDir: './api2',
//   multipleFileMode: true,
//   useClassTransformer: false,
//   useStaticMethod: true,
//   serviceNameSuffix: '',
//   extendGenericType: [],
//   extendDefinitionFile: undefined,
//   strictNullChecks: true,
//   modelMode: 'interface',
//   format: (text: string) => prettier.format(text, PRETTIER_CONFIG)
// })

const oldApiDir = hoverRepoDir + 'src/api2/'
const oldDecDir = hoverRepoDir + 'src/swagger.d.ts'

const newApiDir = './api2/'
const newDecDir = './swagger.d.ts'

let oldApiFiles = []
let newApiFiles = []

fs.readdirSync(oldApiDir).forEach(file => {
  oldApiFiles.push(file)
})

fs.readdirSync(newApiDir).forEach(file => {
  newApiFiles.push(file)
})

let sharedApiFiles = newApiFiles.filter(file => oldApiFiles.includes(file))
let newFiles = newApiFiles.filter(file => !oldApiFiles.includes(file))
let removedFiles = oldApiFiles.filter(file => !newApiFiles.includes(file))

sharedApiFiles.forEach(file => {
  // Read New file
  fs.readFile(newApiDir + file, function read(err, data) {
    if (err) throw err
    const newData = data
    const newDataLineNumbers = getLineNumbersFromFileData(newData)
    // Read old file
    fs.readFile(oldApiDir + file, function read(err, data) {
      if (err) throw err
      const oldData = data
      const oldDataLineNumbers = getLineNumbersFromFileData(oldData)

      let difference = diff.diffLines(oldData.toString(), newData.toString())

      if (difference.length == 1) {
        process.stderr.write(`File `['grey'] + `.../${file}`['white'] + ` is unchanged\n`['grey'])
      } else {
        process.stderr.write(
          `\nFile `['grey'] +
            `.../${file}`['cyan'] +
            ` has `['grey'] +
            `${difference.length} ` +
            `differences\n`['grey']
        )
        process.stderr.write(`${outputSplit}\n`['grey'])

        difference.forEach(line => {
          let color = line.added ? 'green' : line.removed ? 'red' : 'grey'
          let plusMinus = line.added ? '+ ' : line.removed ? '- ' : ''
          let lineNumber = oldDataLineNumbers[line.value.split('\n')[0]]
          if (!lineNumber) lineNumber = newDataLineNumbers[line.value.split('\n')[0]]
          let offset = 5 - lineNumber.toString().length
          lineNumber = '  ' + lineNumber.toString()['grey'] + ' '.repeat(offset)
          let lineNumberOffset = '         '
          // console.log(line.value.split('\n')[0])
          if (color == 'grey') return
          let numLines = line.value.split('\n').length - 1
          let lineValue = line.value
          if (numLines > 1) {
            // lineValue = lineValue.replace('\n', '\n')
            // console.log(lineValue)
            let first = true
            lineValue.split('\n').forEach(line => {
              line += '\n'
              if (first) {
                process.stderr.write(lineNumber + plusMinus + line[color])
                first = false
              } else {
                process.stderr.write(lineNumberOffset + line[color])
              }
            })
          } else {
            process.stderr.write(lineNumber + plusMinus + lineValue[color])
          }
        })

        process.stderr.write(`${outputSplit}\n\n`['grey'])
      }
    })
  })
})

removedFiles.forEach(file => {
  process.stderr.write(`File `['grey'] + `.../${file}`['red'] + ` has been removed\n`['grey'])
})

newFiles.forEach(file => {
  process.stderr.write(`File `['grey'] + `.../${file}`['green'] + ` has been added\n`['grey'])
})
