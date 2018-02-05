'use strict'

const path = require('path')
const fs = require('fs')

const expect = require('chai').expect
const gh = require('./GeneHoodFromStableList')

const filePathIn = path.resolve(__dirname, '..', 'data-test', 'flgB.stables.list')
const filePathOut = path.resolve(__dirname, '..', 'data-test', 'testing.fa')

describe('Fetching sequences', function() {
	it('should fetch sequences in put in file', function() {
		this.timeout(10000)
		return gh.fetch(filePathIn, filePathOut).then(() => {
			const data = fs.readFileSync(filePathOut).toString()
			expect(data).to.not.eql('')
		})
	})
	it('should fetch sequences in put in file twice in a row', function() {
		this.timeout(10000)
		return gh.fetch(filePathIn, filePathOut).then(() => {
			const data = fs.readFileSync(filePathOut).toString()
			expect(data).to.not.eql('')
		})
	})
	afterEach(function() {
		let files = []
		fs.unlinkSync(filePathOut)
	})
})
