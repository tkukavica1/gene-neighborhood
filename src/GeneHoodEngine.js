'use strict'

const fs = require('fs')
const BlastHelper = require('./BlastHelper')
const gh = require('./GeneHoodFromStableList')
const bunyan = require('bunyan')


const runBlast_ = (fastaFile) => {
	const blast = new BlastHelper(fastaFile)
	blast.generateCommands()
	return blast.runCommand('db')
		.then(() => {
			return blast.runCommand('engine')
		})
		.then(() => {
			return blast.parseOutput()
		})
		.catch((err) => {
			throw Error(err)
		})
}

const pack_ = (blastFile, phyloFile, packedFile, pipeline) => {
	if (pipeline.fetch && pipeline.runBlast) {
		const packed = {
			blast: [],
			phylo: null
		}
		packed.blast = JSON.parse(fs.readFileSync(blastFile))
		if (phyloFile)
			packed.phylo = fs.readFileSync(phyloFile).toString()
		fs.writeFileSync(packedFile, JSON.stringify(packed, null, ' '))
	}
	else {
		throw Error('It needs to fetch and process the data first')
	}
}

module.exports =
class GeneHoodEngine {
	constructor(stableIdFile, phyloFile = null, packedFile = 'geneHood.pack.json', tempFastaFile = 'geneHood.temp.fa') {
		this.stableIdFile_ = stableIdFile
		this.phyloFile_ = phyloFile
		this.packedFile_ = packedFile
		this.tempFastaFile_ = tempFastaFile
		this.pipeline_ = {
			fetch: false,
			runBlast: false
		}
		this.log = bunyan.createLogger({
			name: 'gene-hood-engine'
		})
	}

	run(downstream, upstream) {
		this.log.info('Fetching sequences')
		return gh.fetch(this.stableIdFile_, this.tempFastaFile_, downstream, upstream)
			.then(() => {
				this.pipeline_.fetch = true
				this.log.info(`Running BLAST on ${this.tempFastaFile_}`)
				return runBlast_(this.tempFastaFile_)
			})
			.then((blastFile) => {
				this.pipeline_.runBlast = true
				this.log.info(`Packing results ${blastFile}`)
				pack_(blastFile, this.phyloFile_, this.packedFile_, this.pipeline_)
			})
			.then(() => {
				this.log.info('All done')
			})
	}
}
