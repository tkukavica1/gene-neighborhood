#!/usr/bin/env node
'use strict'

const path = require('path')
const ArgumentParser = require('argparse').ArgumentParser
const fs = require('fs')
const chalk = require('chalk')

const GeneHoodEngine = require('../src/GeneHoodEngine')

let parser = new ArgumentParser({
	addHelp: true,
	description: 'Command line application to generate the data for Gene neighborhood visualization.'
})

parser.addArgument(
	'input',
	{
		help: 'File with list of MiST3 stable ids (One per line)'
	}
)

parser.addArgument(
	['-d', '--downstream'],
	{
		help: 'Number of neighbors downstream',
		defaultValue: 14
	}
)

parser.addArgument(
	['-u', '--upstream'],
	{
		help: 'Number of neighbors upstream',
		defaultValue: 14
	}
)

parser.addArgument(
	['-p', '--phylogeny'],
	{
		help: 'name of the phylogenetic file in Newick format'
	}
)

parser.addArgument(
	['-o', '--output'],
	{
		help: 'Name of the output file',
		defaultValue: 'geneHood.pack.json'
	}
)

const args = parser.parseArgs()
if (fs.existsSync(args.input)) {
	const geneHood = new GeneHoodEngine(args.input, args.phylogeny, args.output)
	console.log(GeneHoodEngine.log)
	geneHood.run(args.downstream, args.upstream)
}
else {
	console.error('Error: Input files does not exists.')
}

