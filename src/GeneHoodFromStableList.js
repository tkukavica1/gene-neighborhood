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
			if (stableId !== '') {
				logGN.info(`pushing ${stableId}`)
				self.push(stableId)
			}
		})
		next()
	}, function(next) {
		logGN.info('done parsing')
		if (bufferParser !== '')
			this.push(bufferParser)
		next()
	})
}

const getGN = function(downstream = kDefault.downstream, upstream = kDefault.upstream) {
	return through2.obj(function(chunk, enc, next) {
		const self = this
		let data = {
			ref: chunk
		}
		mistGenes.getGeneHood(chunk, downstream, upstream).then(function(result) {
			logGN.info(`Done fetching geneHood of ${chunk}`)
			data.gn = result
			self.push(data)
			next()
		})
		.catch((err) => {
			next(err, null)
		})
	})
}

function addSeqInfo() {
	return through2.obj(function(chunk, enc, next) {
		const self = this
		mistGenes.addAseqInfo(chunk.gn).then((genes) => {
			for (let i = 0, N = chunk.gn.length; i < N; i++)
				chunk.gn[i] = genes[i]
			self.push(chunk)
			next()
		})
		.catch((err) => {
			next(err)
		})
	})
}

function writeFasta() {
	return through2.obj(function(chunk, enc, next) {
		logGN.info(`Writing Fasta data from ${chunk.ref}`)
		const genomeVersion = chunk.ref.split('-')[0]
		mistGenomes.getGenomeInfoByVersion(genomeVersion).then((genomeInfo) => {
			const mkFasta = new NodeMist3.MakeFasta(genomeInfo)
			const fastaEntries = mkFasta.process(chunk.gn)
			this.push(fastaEntries.join(''))
			next()
		})
		.catch((err) => {
			next(err)
		})
	})
}

function writeGN() {
	const allData = []
	return through2.obj(function(chunk, enc, next) {
		logGN.info(`Collecting geneHood data from ${chunk.ref}`)
		allData.push(chunk)
		next()
	}, function(next) {
		this.push(JSON.stringify(allData, null, ' '))
		next()
	})
}

const fetch = function(filePathIn, filePathOut, filePathGNOut, downstream = kDefault.downstream, upstream = kDefault.upstream) {
	return new Promise((resolve, reject) => {
		logGN.info('Preparing the data')
		const reader = fs.ReadStream(filePathIn)
		const writerF = fs.WriteStream(filePathOut)
		const writerG = fs.WriteStream(filePathGNOut)
		const commonPipeline = pumpify.obj(reader, parser(), getGN(downstream, upstream), addSeqInfo())
		const fastaPipeline = pumpify.obj(commonPipeline, writeFasta(), writerF)
		const geneHoodPipeline = pumpify.obj(commonPipeline, writeGN(), writerG)
		const pipelines = []

		pipelines.push(
			new Promise((res, rej) => {
				fastaPipeline
					.on('finish', () => {
						logGN.info(`Data fetched and stored in ${filePathOut}`)
						res(filePathOut)
					})
					.on('error', (err) => {
						rej(err)
					})
			})
		)

		pipelines.push(
			new Promise((res, rej) => {
				geneHoodPipeline
					.on('finish', () => {
						logGN.info(`Data fetched and stored in ${filePathGNOut}`)
						res(filePathGNOut)
					})
					.on('error', (err) => {
						rej(err)
					})
			})
		)

		Promise.all(pipelines)
			.then((paths) => {
				resolve(paths)
			})
			.catch((err) => {
				reject(err)
			})
	})
}

module.exports = {
	fetch
}
