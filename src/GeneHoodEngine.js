'use strict'

const fs = require('fs')
const childProcess = require('child_process')
const bunyan = require('bunyan')
const through2 = require('through2')

const gh = require('./GeneHoodFromStableList')

const Blastinutils = require('blastinutils')
const blast = new Blastinutils()

const dbFile = 'gndb'
const outFile = 'blastp.genehood.dat'

const makeDB_ = (fastaFile) => {
	const command = blast.buildMakeDatabaseCommand(fastaFile, dbFile)
	return new Promise((resolve, reject) => {
		childProcess.exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error)
				return
			}
			resolve()
		})
	})
}

const runBlast_ = (fastaFile) => {
	const command = blast.buildBlastpCommand(dbFile, fastaFile, outFile)
	return new Promise((resolve, reject) => {
		childProcess.exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error)
				return
			}
			resolve(outFile)
		})
	})
}

const parseBlastOutPut = (blastOutFile, geneFile) => {
	return new Promise((resolve, reject) => {
		let buffer = ''
		const blastResults = []
		fs.createReadStream(blastOutFile)
			.pipe(through2((chunk, enc, next) => {
				if (chunk) {
					buffer += chunk.toString() || ''
					const lines = buffer.split('\n')
					buffer = lines.pop()
					for (const line of lines) {
						const blastEntry = blast.parseTabularData(line)
						if (typeof blastEntry === 'object') {
							blastResults.push(blastEntry)
						}
						else {
							console.error(line)
							this.emit('error', new Error ('BLAST data seems to be corrupt.'))
						}
					}
				}
				next()
			}), (next) => {
				const lines = buffer.split('\n')
				for (const line of lines) {
					const blastEntry = blast.parseTabularData(line)
					if (typeof blastEntry === 'object') {
						blastResults.push(blastEntry)
					}
					else {
						console.error(line)
						this.emit('error', new Error ('BLAST data seems to be corrupt.'))
					}
				}
				next()
			})
			.on('finish', () => {
				resolve(blastResults)
			})
			.on('error', (err) => {
				throw err
			})
	})
}


const pack_ = (gnDataFile, phyloFile, blastResults, packedFile) => {
	const packLog = bunyan.createLogger({name: 'packing'})
	const gnData = JSON.parse(fs.readFileSync(gnDataFile))
	const packed = {
		gnData,
		blast: blastResults,
		phylo: null
	}
	if (phyloFile)
		packed.phylo = fs.readFileSync(phyloFile).toString()
	packLog.info('Saving results')
	fs.writeFileSync(packedFile, JSON.stringify(packed, null, ' '))
}

module.exports =
class GeneHoodEngine {
	constructor(stableIdFile, phyloFile = null, packedFile = 'geneHood.pack.json', tempFastaFile = 'geneHood.fa', tempGeneFile = 'geneHood.gene.json') {
		this.stableIdFile_ = stableIdFile
		this.phyloFile_ = phyloFile
		this.packedFile_ = packedFile
		this.tempFastaFile_ = tempFastaFile
		this.tempGeneFile_ = tempGeneFile
		this.log = bunyan.createLogger({
			name: 'gene-hood-engine'
		})
	}

	run(downstream, upstream) {
		this.log.info('Fetching sequences')
		return gh.fetch(this.stableIdFile_, this.tempFastaFile_, this.tempGeneFile_, downstream, upstream)
			.then(() => {
				this.log.info(`Making BLAST database from ${this.tempFastaFile_}`)
				return makeDB_(this.tempFastaFile_)
			})
			.catch((err) => {
				throw err
			})
			.then(() => {
				this.log.info(`Running BLAST on ${this.tempFastaFile_}`)
				return runBlast_(this.tempFastaFile_)
			})
			.then((outBlastFile) => {
				this.log.info('Parsing BLAST data')
				return parseBlastOutPut(outBlastFile, this.tempGeneFile_)
			})
			.then((blastResults) => {
				this.log.info('Packing results')
				pack_(this.tempGeneFile_, this.phyloFile_, blastResults, this.packedFile_)
			})
			.catch((err) => {
				throw err
			})
			.then(() => {
				this.log.info('All done')
			})
	}
}
