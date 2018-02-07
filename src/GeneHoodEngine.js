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

const pack_ = (blastFile, phyloFile, tempGeneFile, packedFile, pipeline) => {
	const packLog = bunyan.createLogger({name: 'packing'})
	if (pipeline.fetch && pipeline.runBlast) {
		const packed = {
			data: [],
			phylo: null
		}
		const blastData = JSON.parse(fs.readFileSync(blastFile))
		let gnData = JSON.parse(fs.readFileSync(tempGeneFile))
		for (let i = 0, N = gnData.length; i < N; i++) {
			for (let j = 0, M = gnData[i].gn.length; j < M; j++) {
				const blastDataForOneGene = blastData.iterations.filter((query) => {
					return query['query-def'].split('|')[1] === gnData[i].gn[j].stable_id
				})[0]
				gnData[i].gn[j].blast = blastDataForOneGene.hits
			}
		}
		packed.data = gnData
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
	constructor(stableIdFile, phyloFile = null, packedFile = 'geneHood.pack.json', tempFastaFile = 'geneHood.temp.fa', tempGeneFile = 'geneHood.gene.json') {
		this.stableIdFile_ = stableIdFile
		this.phyloFile_ = phyloFile
		this.packedFile_ = packedFile
		this.tempFastaFile_ = tempFastaFile
		this.tempGeneFile_ = tempGeneFile
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
		return gh.fetch(this.stableIdFile_, this.tempFastaFile_, this.tempGeneFile_, downstream, upstream)
			.then(() => {
				this.pipeline_.fetch = true
				this.log.info(`Running BLAST on ${this.tempFastaFile_}`)
				return runBlast_(this.tempFastaFile_)
			})
			.then((blastFile) => {
				this.pipeline_.runBlast = true
				this.log.info(`Packing results ${blastFile}`)
				pack_(blastFile, this.phyloFile_, this.tempGeneFile_, this.packedFile_, this.pipeline_)
			})
			.catch((err) => {
				throw err
			})
			.then(() => {
				this.log.info('All done')
			})
			.catch((err) => {
				throw err
			})
	}
}
