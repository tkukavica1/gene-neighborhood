'use strict'

const fs = require('fs')
const through2 = require('through2')
const NodeMist3 = require('node-mist3')
const bunyan = require('bunyan')
const pumpify = require('pumpify')

const mistGenes = new NodeMist3.Genes()
const mistGenomes = new NodeMist3.Genomes()

const kDefault = {
	upstream: 5,
	downstream: 5
}

const logGN = bunyan.createLogger({name: 'gene-hood-from-stable-list'})

function parser() {
	let bufferParser = ''
	return through2.obj(function(chunk, enc, next) {
		bufferParser += chunk.toString()
		const stableIds = bufferParser.split('\n')
		bufferParser = stableIds.pop()
	
		const self = this
		stableIds.forEach(function(stableId) {
			logGN.info(`pushing ${stableId}`)
			self.push(stableId)
		})
		next()
	}, function(next) {
		logGN.info('done parsing')
		this.push(bufferParser)
		next()
	})
}

const getGN = function(downstream = kDefault.downstream, upstream = kDefault.upstream) {
	return through2.obj(function(chunk, enc, next) {
		const self = this
		mistGenes.getGeneHood(chunk, downstream, upstream).then(function(result) {
			logGN.info(`Done fetching ${chunk}`)
			self.push(result)
			next()
		})
		.catch((err) => {
			next(err)
		})
	})
}

function addSeqInfo() {
	return through2.obj(function(chunk, enc, next) {
		const self = this
		mistGenes.addAseqInfo(chunk).then((genes) => {
			self.push(genes)
			next()
		})
		.catch((err) => {
			next(err)
		})
	})
}

function writeFasta() {
	return through2.obj(function(chunk, enc, next) {
		const genomeVersion = chunk[0].stable_id.split('-')[0]
		mistGenomes.getGenomeInfoByVersion(genomeVersion).then((genomeInfo) => {
			const mkFasta = new NodeMist3.MakeFasta(genomeInfo)
			const fastaEntries = mkFasta.process(chunk)
			this.push(fastaEntries.join(''))
			next()
		})
		.catch((err) => {
			next(err)
		})
	})
}

const fetch = function(filePathIn, filePathOut, downstream = kDefault.downstream, upstream = kDefault.upstream) {
	return new Promise((resolve, reject) => {
		logGN.info('Preparing the data')
		const reader = fs.ReadStream(filePathIn)
		const writer = fs.WriteStream(filePathOut)
		const pipeline = pumpify(parser(), getGN(downstream, upstream), addSeqInfo(), writeFasta(), writer)
		reader.pipe(pipeline)
			.on('finish', () => {
				logGN.info(`Data fetched and stored in ${filePathOut}`)
				resolve(filePathOut)
			})
			.on('error', (err) => {
				logGN.error('Something went wrong.')
				reject(err)
			})
	})
}

module.exports = {
	fetch
}
