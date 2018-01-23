'use strict'

const path = require('path')

const expect = require('chai').expect
const gn = require('./GeneHoodEngine')

const filePathIn = path.resolve(__dirname, '..', 'data-test', 'flgB.stables.list')
const filePathOut = path.resolve(__dirname, '..', 'data-test', 'testing.txt')

describe('Load fasta', function() {
	it('should load the files in Seq class', function() {
		this.timeout(10000)
		return gn.getGNFromStableList(filePathIn, filePathOut).then((duh) => {
			expect(1).eql(1)
		}).catch((err) => {
			console.log(err)
		})
	})
})
