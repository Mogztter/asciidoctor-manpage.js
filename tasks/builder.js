'use strict'
const fs = require('fs')
const log = require('bestikk-log')
const bfs = require('bestikk-fs')
const Download = require('bestikk-download')
const OpalBuilder = require('opal-compiler').Builder

const concat = (message, files, destination) => {
  log.debug(message)
  bfs.concatSync(files, destination)
}

const templateFile = function (templateFile, context, outputFile) {
  const template = fs.readFileSync(templateFile, 'utf8')
  const lines = template.split('\n')
  lines.forEach(function (line, index, result) {
    if (line in context) {
      result[index] = context[line]
    }
  })
  const content = lines.join('\n')
  fs.writeFileSync(outputFile, content, 'utf8')
}

const copyToDist = () => {
  log.task('copy to dist/')
  removeDistDirSync()
  bfs.copySync('build/asciidoctor-manpage.js', 'dist/main.js')
}

const removeDistDirSync = () => {
  log.debug('remove dist directory')
  bfs.removeSync('dist')
  bfs.mkdirsSync('dist')
}

const removeBuildDirSync = () => {
  log.debug('remove build directory')
  bfs.removeSync('build')
  bfs.mkdirsSync('build')
}

const generateUMD = () => {
  log.task('generate UMD')
  const files = [
    'build/asciidoctor-manpage.js'
  ]
  concat('Asciidoctor ManPage', files, 'build/asciidoctor-manpage.js')
  const asciidoctorTemplateContext = {
    '//#{asciidoctorManPageCode}': fs.readFileSync('build/asciidoctor-manpage.js', 'utf8')
  }
  templateFile('src/template-asciidoctor-manpage.js', asciidoctorTemplateContext, 'build/asciidoctor-manpage.js')
}

const clean = () => {
  log.task('clean')
  removeBuildDirSync()
}

const compile = () => {
  log.task('compile')
  const module = 'manpage'
  const opalBuilder = OpalBuilder.create()
  opalBuilder.appendPaths('build/asciidoctor/lib')
  opalBuilder.appendPaths('node_modules/opal-compiler/src/stdlib')
  opalBuilder.appendPaths('lib')
  opalBuilder.setCompilerOptions({ dynamic_require_severity: 'ignore' })
  fs.writeFileSync(`build/asciidoctor-${module}.js`, opalBuilder.build(`asciidoctor/converter/${module}`).toString(), 'utf8')
}

class Builder {
  constructor () {
    this.asciidoctorCoreVersion = '2.0.7'
    this.download = new Download({})
  }

  async build () {
    if (process.env.SKIP_BUILD) {
      log.info('SKIP_BUILD environment variable is true, skipping "build" task')
      return
    }
    if (process.env.DRY_RUN) {
      log.debug('build')
      return
    }
    const start = process.hrtime()

    try {
      clean()
      await this.downloadDependencies()
      await compile()
      generateUMD()
      copyToDist()
    } catch (e) {
      console.log(e)
      process.exit(1)
    }

    log.success('Done in ' + process.hrtime(start)[0] + 's')
  }

  async downloadDependencies () {
    log.task('download dependencies')
    await this.download.getContentFromURL(`https://codeload.github.com/asciidoctor/asciidoctor/tar.gz/v${this.asciidoctorCoreVersion}`, 'build/asciidoctor.tar.gz')
    await bfs.untar('build/asciidoctor.tar.gz', 'asciidoctor', 'build')
  }
}

module.exports = Builder
