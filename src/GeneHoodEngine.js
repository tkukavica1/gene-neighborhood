'use strict'

const fs = require('fs')
const through2 = require('through2')
const NodeMist3 = require('node-mist3')

const mistGenes = new NodeMist3.Genes()
const mistGenomes = new NodeMist3.Genomes()

const kDefault = {
	upstream: 5,
	downstream: 5
}

let bufferParser = ''

const parser = through2.obj(function(chunk, enc, next) {
	bufferParser += chunk.toString()
	const stableIds = bufferParser.split('\n')
	bufferParser = stableIds.pop()

	const self = this
	stableIds.forEach(function(stableId) {
		self.push(stableId)
	})
	next()
}, function(next) {
	this.push(bufferParser)
	next()
})

const getGN = function(downstream = kDefault.downstream, upstream = kDefault.upstream) {
	return through2.obj(function(chunk, enc, next) {
		const self = this
		mistGenes.getGeneHood(chunk, downstream, upstream).then(function(result) {
			self.push(result)
			next()
		})
	})
}

const addSeqInfo = through2.obj(function(chunk, enc, next) {
	const self = this
	mistGenes.getAseqInfo(chunk).then((genes) => {
		self.push(genes)
		next()
	})
})

const writeFasta = through2.obj(function(chunk, enc, next) {
	const genomeVersion = chunk[0].stable_id.split('-')[0]
	mistGenomes.getGenomeInfoByVersion(genomeVersion).then((genomeInfo) => {
		const mkFasta = new NodeMist3.MakeFasta(genomeInfo)
		const fastaEntries = mkFasta.process(chunk)
		this.push(fastaEntries.join(''))
		next()
	})
})

const getGNFromStableList = function(filePathIn, filePathOut, downstream = kDefault.downstream, upstream = kDefault.upstream) {
	return new Promise((resolve, reject) => {
		const reader = fs.ReadStream(filePathIn)
		const writer = fs.WriteStream(filePathOut)
		reader.pipe(parser)
			.pipe(getGN(downstream, upstream))
			.pipe(addSeqInfo)
			.pipe(writeFasta)
			.pipe(writer)
			.on('finish', () => {
				resolve()
			})
			.on('error', (err) => {
				reject(err)
			})
	})
}

module.exports = {
	getGNFromStableList
}
