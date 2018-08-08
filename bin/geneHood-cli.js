#!/usr/bin/env node
'use strict'
const shell = require('shelljs')
const path = require('path')
const figlet = require('figlet')
const chalk = require('chalk')

const pkjson = require('../package.json')

const args = process.argv.slice(2).join(' ')
const pathToApp = path.resolve(__dirname, 'geneHood.js')
const path2bunyan = path.resolve(__dirname, '..', 'node_modules/.bin/bunyan')

const splash = figlet.textSync('geneHood-cli', {horizontalLayout: 'fitted'})
console.log(chalk.cyan(splash))
console.log(`\t\t\t\t\t      ${chalk.cyan('version ' + pkjson.version)} ${chalk.red('by Davi Ortega')}`)

shell.exec('node ' + pathToApp + ' ' + args + ' | ' + path2bunyan + ' --color')
