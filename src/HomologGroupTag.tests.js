'use strict'

const expect = require('chai').expect
const HomologGroupTag = require('./HomologGroupTag')

describe('HomologGroupTag', function() {
	it('initiate different groups every time', function() {
		const group1 = new HomologGroupTag('white')
		const group2 = new HomologGroupTag('white')
		expect(group1.getHash()).not.eql(group2.getHash())
	})
	it('should be able to get the color', function() {
		const color = 'white'
		const group1 = new HomologGroupTag(color)
		expect(group1.getColor()).eql(color)
	})
	it('should be able to get Hash', function() {
		const color = 'white'
		const group1 = new HomologGroupTag(color)
		expect(group1.getHash()).eql(group1.hash_)
	})
	it('should be able to change the color', function() {
		const colorOriginal = 'white'
		const colorNew = 'black'
		const group1 = new HomologGroupTag(colorOriginal)
		group1.updateColor(colorNew)
		expect(group1.getColor()).eql(colorNew)
	})
})
