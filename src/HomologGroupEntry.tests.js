'use strict'

const expect = require('chai').expect
const HomologGroupTag = require('./HomologGroupTag')
const HomologGroupEntry = require('./HomologGroupEntry')

describe('HomologGroupEntry', function() {
	it('should be able to get the group hash', function() {
		const groupTag = new HomologGroupTag('white')
		const groupHash = groupTag.getHash()
		const logEvalue = 100
		const groupEntry = new HomologGroupEntry(groupTag, logEvalue)
		expect(groupEntry.getHash()).eql(groupHash)
	})
	it('should be able to get the logEvalue', function() {
		const groupTag = new HomologGroupTag('white')
		const logEvalue = 100
		const groupEntry = new HomologGroupEntry(groupTag, logEvalue)
		expect(groupEntry.getLogEvalue()).eql(logEvalue)
	})
	it('should be able to change logEvalue', function() {
		const groupTag = new HomologGroupTag('white')
		const logEvalue = 100
		const groupEntry = new HomologGroupEntry(groupTag, logEvalue)
		const logEvalueNew = 50
		groupEntry.updateLogEvalue(logEvalueNew)
		expect(groupEntry.getLogEvalue()).eql(logEvalueNew)
	})
	it('should be able to get the color', function() {
		const color = 'white'
		const groupTag = new HomologGroupTag(color)
		const logEvalue = 100
		const groupEntry = new HomologGroupEntry(groupTag, logEvalue)
		expect(groupEntry.getColor()).eql(color)
	})
	it('should be able to change color', function() {
		const color = 'white'
		const groupTag = new HomologGroupTag(color)
		const logEvalue = 100
		const groupEntry = new HomologGroupEntry(groupTag, logEvalue)
		const colorNew = 'black'
		groupEntry.updateColor(colorNew)
		expect(groupEntry.getColor()).eql(colorNew)
	})
	it('should be able to get the tag', function() {
		const color = 'white'
		const groupTag = new HomologGroupTag(color)
		const logEvalue = 100
		const groupEntry = new HomologGroupEntry(groupTag, logEvalue)
		expect(groupEntry.getTag()).eql(groupTag)
	})
})
