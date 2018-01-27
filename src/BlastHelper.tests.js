'use strict'

const path = require('path')

const chai = require('chai')
const expect = chai.expect

const BlastHelper = require('./BlastHelper')

const filePathIn = path.resolve(__dirname, '..', 'data-test', 'flgB.stables.list')
const filePathOut = path.resolve(__dirname, '..', 'data-test', 'testing.txt')

describe.only('BlastHelper', function() {
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
			const blastHelper = new BlastHelper(null, fakeCommands)
			expect(blastHelper.checkThirdParty.bind(blastHelper)).to.throw(`The program ${fakeCommands.engine} is not installed or not in PATH.`)
		})
		it('if db command is NOT there, expect to throw error', function() {
			const fakeCommands = {
				db: 'makddssaeblastdb',
				engine: 'blastp'
			}
			const blastHelper = new BlastHelper(null, fakeCommands)
			expect(blastHelper.checkThirdParty.bind(blastHelper)).to.throw(`The program ${fakeCommands.db} is not installed or not in PATH.`)
		})
	})
	describe('generateCommands', function() {
		it('should generate the right commands for making db and running the search engine', function() {
			const expectedInstructions = {
				db: 'makeblastdb -in geneHood.fa -out gndb -dbtype prot',
				engine: 'blastp -db gndb -query geneHood.fa -out blastp.genehood.dat -num_threads 10 -outfmt "6 qseqid sseqid bitscore evalue qlen length qcovs slen" -evalue 0.01 -max_target_seqs 100000'
			}
			const blastHelper = new BlastHelper()
			blastHelper.generateCommands()
			expect(blastHelper.instructions_).eql(expectedInstructions)
		})
	})
	describe('runCommand', function() {
		it('should run commands', function() {
			process.chdir('./data-test')
			const blastHelper = new BlastHelper()
			blastHelper.generateCommands()
			blastHelper.runCommand('db').then(blastHelper.runCommand('engine').catch((err) => {
				throw new Error(err)
			}))
			.catch((err) => {
				console.log(err)
			})
		})
	})
})
