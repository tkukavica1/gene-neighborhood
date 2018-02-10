'use strict'

const path = require('path')
const fs = require('fs')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

const expect = chai.expect
const should = chai.should()

const gh = require('./GeneHoodFromStableList')

const fileTestPath = path.resolve(__dirname, '..', 'data-test')

const filePathIn = path.resolve(fileTestPath, 'flgB.stables.list')
const filePathInWrongStableId = path.resolve(fileTestPath, 'flgB.stables.wrong.stableId.list')
const filePathInWrongEmptyLine = path.resolve(fileTestPath, 'flgB.stables.wrong.emptyLine.list')
const filePathOut = path.resolve(fileTestPath, 'testing.fa')
const filePathGNOut = path.resolve(fileTestPath, 'testing.genes.json')

describe('Fetching sequences', function() {
	it('should fetch sequences in put in file', function() {
		this.timeout(10000)
		return gh.fetch(filePathIn, filePathOut, filePathGNOut).then(() => {
			const data = fs.readFileSync(filePathOut).toString()
			expect(data).to.not.eql('')
		})
	})
	it('should fetch sequences in put in file twice in a row', function() {
		this.timeout(10000)
		return gh.fetch(filePathIn, filePathOut, filePathGNOut).then(() => {
			const data = fs.readFileSync(filePathOut).toString()
			expect(data).to.not.eql('')
		})
	})
	it('should fail nicely if passed wrong stable id', function() {
		return gh.fetch(filePathInWrongStableId, filePathOut, filePathGNOut).should.be.rejectedWith('Not Found')
	})
	it('should ignore if passed empty line in stable id', function() {
		this.timeout(10000)
		return gh.fetch(filePathInWrongEmptyLine, filePathOut, filePathGNOut).then(() => {
			const data = fs.readFileSync(filePathOut).toString()
			expect(data).to.not.eql('')
		})
	})
	afterEach(function() {
		fs.unlinkSync(filePathOut)
		fs.unlinkSync(filePathGNOut)
	})
})
