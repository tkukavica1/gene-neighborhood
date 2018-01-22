'use strict'

const fs = require('fs')
const through2 = require('through2')
const NodeMist3 = require('node-mist3')

const getGNMist = new NodeMist3.Genes()
const fastaStream = require('core-bio').fastaStream


let bufferParser = ''

const parser = through2({objectMode: true}, function(chunk, enc, next) {
	bufferParser += chunk.toString()
	const stableIds = bufferParser.split('\n')
	bufferParser = stableIds.pop()

	const self = this
	stableIds.forEach(function(stableId) {
		self.push(stableId)
		console.log(stableId)
		next()
	})
}, function(next) {
	this.push(bufferParser)
	next()
})

const getGN = through2.obj({objectMode: true}, function(chunk, enc, next) {
	const self = this
	getGNMist.getGeneHood(chunk).then(function(result) {
		console.log('Here: ')
		// console.log(JSON.stringify(result))
		self.push(result)
		next()
	})
})

const getGNFromStableList = function(filePathIn, filePathOut) {
	return new Promise((resolve, reject) => {
		const reader = fs.ReadStream(filePathIn)
		const writer = fs.WriteStream(filePathOut)
		reader.pipe(parser).pipe(getGN).pipe(process.stdout).on('end', () => {
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
