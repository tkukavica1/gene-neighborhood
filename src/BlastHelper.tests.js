'use strict'

const path = require('path')
const fs = require('fs')
const glob = require('glob')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

const expect = chai.expect
const should = chai.should()

const BlastHelper = require('./BlastHelper')

const testDataPath = path.resolve(__dirname, '..', 'data-test')
const largerFasta = path.resolve(testDataPath, 'largerFasta.fa')


describe('BlastHelper', function() {
	describe('checkThirdParty', function() {
		it('if engine is there, then it is ok', function() {
			const blastHelper = new BlastHelper()
			expect(blastHelper.checkThirdParty()).to.be.true
		})
		it('if engine command is NOT there, expect to throw error', function() {
			const fakeCommands = {
				db: 'makeblastdb',
				engine: 'superblastfast'
			}
			const blastHelper = new BlastHelper(null, null, fakeCommands)
			expect(blastHelper.checkThirdParty.bind(blastHelper)).to.throw(`The program ${fakeCommands.engine} is not installed or not in PATH.`)
		})
		it('if db command is NOT there, expect to throw error', function() {
			const fakeCommands = {
				db: 'makddssaeblastdb',
				engine: 'blastp'
			}
			const blastHelper = new BlastHelper(null, null, fakeCommands)
			expect(blastHelper.checkThirdParty.bind(blastHelper)).to.throw(`The program ${fakeCommands.db} is not installed or not in PATH.`)
		})
	})
	describe('generateCommands', function() {
		it('should generate the right commands for making db and running the search engine', function() {
			const expectedInstructions = {
				db: 'makeblastdb -in geneHood.fa -out gndb -dbtype prot',
				engine: 'blastp -db gndb -query geneHood.fa -out blastp.genehood.xml -num_threads 10 -outfmt 5 -evalue 0.01 -max_target_seqs 100000'
			}
			const blastHelper = new BlastHelper()
			blastHelper.generateCommands()
			expect(blastHelper.instructions_).eql(expectedInstructions)
		})
	})
	describe('runCommand', function() {
		it('should run commands', function() {
			process.chdir(testDataPath)
			const blastHelper = new BlastHelper()
			blastHelper.generateCommands()
			return blastHelper.runCommand('db').then(
				blastHelper.runCommand('engine').should.be.fulfilled
			).should.be.fulfilled
		})
		it('should NOT run unrecognized commands', function() {
			process.chdir(testDataPath)
			const blastHelper = new BlastHelper()
			blastHelper.generateCommands()
			return blastHelper.runCommand('badCommand').should.be.rejectedWith('unrecognized command')
		})
		it('should read it too', function() {
			const blastHelper = new BlastHelper()
			blastHelper.generateCommands()
			return blastHelper.runCommand('db').then(() => {
				return blastHelper.runCommand('engine').then(() => {
					return blastHelper.parseOutput().then(() => {
						return fs.stat(blastHelper.fileNames_.parsed, (err, stat) => {
							expect(err).to.be.null
						})
					})
				})
			})
		})
		it('should read it too, even for larger fasta', function() {
			this.timeout(10000)
			const blastHelper = new BlastHelper(largerFasta)
			blastHelper.generateCommands()
			return blastHelper.runCommand('db').then(() => {
				return blastHelper.runCommand('engine').then(() => {
					return blastHelper.parseOutput().then(() => {
						return fs.stat(blastHelper.fileNames_.parsed, (err, stat) => {
							expect(err).to.be.null
						})
					})
				})
			})
		})
	})
	afterEach(function() {
		let files = []
		let configFilenamePattern = path.resolve(testDataPath, 'geneHood.pack.*')
		files = files.concat(glob.glob.sync(configFilenamePattern))
		configFilenamePattern = path.resolve(testDataPath, 'gndb.*')
		files = files.concat(glob.glob.sync(configFilenamePattern))
		configFilenamePattern = path.resolve(testDataPath, 'blastp.*')
		files = files.concat(glob.glob.sync(configFilenamePattern))
		files.forEach(function(file) {
			fs.unlinkSync(file)
		})
	})
})
