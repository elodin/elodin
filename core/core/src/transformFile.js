import { join, dirname, basename } from 'path'
import readTransformWrite from 'read-transform-write'

import { parse } from '@elodin/parser'
import { traverse } from '@elodin/traverser'

export default function transformFile(inputPath, config, callback) {
  const { plugins = [], generator, errors = 'throw', log } = config

  if (!generator) {
    if (!log) {
      // TODO: Improve Error message
      throw new Error('No generator passed.')
    }
  }

  const transform = file => write => {
    const parsed = parse(file, {
      context: {
        path: inputPath,
        source: file,
      },
    })

    if (parsed.errors.length > 0) {
      if (log) {
        log(parsed.errors)
      } else {
        if (errors === 'throw') {
          console.error(parsed.errors[0].message)
        }

        if (errors === 'log') {
          console.log(parsed.errors[0].message)
        }
      }

      if (callback) {
        callback(false)
      }

      return
    }

    const ast = traverse(parsed.ast, plugins)
    const files = generator(ast, inputPath)

    const inputDir = dirname(inputPath)
    const inputFile = basename(inputPath)

    for (let fileName in files) {
      write(join(inputDir, fileName), files[fileName], files.length)
    }
  }

  readTransformWrite(inputPath, transform, ({ output, outputPath, isDone }) => {
    //console.log(`Written ${outputPath}.`)
    if (isDone && callback) {
      callback(true)
    }
  })
}
