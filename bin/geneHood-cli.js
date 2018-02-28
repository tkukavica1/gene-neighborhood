#!/usr/bin/env node
'use strict'
const shell = require('shelljs')
const path = require('path')
const figlet = require('figlet')
const chalk = require('chalk')

const args = process.argv.slice(2).join(' ')
const path2pfqlFilter = path.resolve(__dirname, 'geneHood.js')
const path2bunyan = path.resolve(__dirname, '..', 'node_modules/.bin/bunyan')

const splash = figlet.textSync('geneHood-cli', {horizontalLayout: 'fitted'})
console.log(chalk.cyan(splash))
console.log(chalk.red('\t\t\t\t\t\t\t   by Davi Ortega'))

shell.exec('node ' + path2pfqlFilter + ' ' + args + ' | ' + path2bunyan + ' --color')
