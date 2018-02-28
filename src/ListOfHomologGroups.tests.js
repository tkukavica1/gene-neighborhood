'use strict'

const expect = require('chai').expect
const HomologGroupTag = require('./HomologGroupTag')
const HomologGroupEntry = require('./HomologGroupEntry')
const ListOfHomologGroups = require('./ListOfHomologGroups')


describe('ListOfHomologGroups', function() {
	it('should return empty if nothing is added', function() {
		const emptyGroupList = new ListOfHomologGroups()
		expect(emptyGroupList.getGroups()).eql([])
	})
	it('should be able to add a group', function() {
		const color = 'white'
		const groupTag = new HomologGroupTag(color)
		const logEvalue = 100
		const groupEntry = new HomologGroupEntry(groupTag, logEvalue)
		const groupList = new ListOfHomologGroups()
		groupList.addGroup(groupEntry)
		expect(groupList.getGroups().length).eql(1)
	})
	it('should throw error if not adding a HomologGroupEntry object', function() {
		const color = 'white'
		const groupTag = new HomologGroupTag(color)
		const groupList = new ListOfHomologGroups()
		expect(() => {
			groupList.addGroup(groupTag)
		}).throw('Not an instance of HomologGroupEntry')
	})
	it('should be able to more than one group', function() {
		const logEvalue = 100
		const color = 'white'
		const numberOfGroups = 10
		const groupList = new ListOfHomologGroups()
		for (let i = 0; i < numberOfGroups; i++) {
			const groupTag = new HomologGroupTag(color)
			const groupEntry = new HomologGroupEntry(groupTag, logEvalue)
			groupList.addGroup(groupEntry)
		}
		expect(groupList.getGroups().length).eql(numberOfGroups)
	})
	describe('have methods avaliable to manipulate the last group', function() {
		const logEvalue = 100
		const color = 'white'
		const numberOfGroups = 10
		const groupList = new ListOfHomologGroups()
		beforeEach(function() {
			for (let i = 0; i < numberOfGroups; i++) {
				const groupTag = new HomologGroupTag(color)
				const groupEntry = new HomologGroupEntry(groupTag, logEvalue)
				groupList.addGroup(groupEntry)
			}
		})
		it('should be able to pop a group', function() {
			groupList.popGroup()
			expect(groupList.getGroups().length).eql(numberOfGroups - 1)
		})
		it('should be able to get the hash of the last group', function() {
			const listOfGroups = groupList.getGroups()
			const lastGroup = listOfGroups[listOfGroups.length - 1]
			const hashOfLastGroup = lastGroup.getHash()
			expect(groupList.getLastGroupHash()).eql(hashOfLastGroup)
			groupList.popGroup()
			expect(groupList.getLastGroupHash()).not.eql(hashOfLastGroup)
		})
		it('should be able to get the tag of the last group', function() {
			const listOfGroups = groupList.getGroups()
			const lastGroup = listOfGroups[listOfGroups.length - 1]
			const tagLastGroup = lastGroup.getTag()
			expect(groupList.getLastGroupTag()).eql(tagLastGroup)
		})
		it('should be able to get the logEvalue of the last group', function() {
			const listOfGroups = groupList.getGroups()
			const lastGroup = listOfGroups[listOfGroups.length - 1]
			const logEvalueOfLastGroup = lastGroup.getLogEvalue()
			expect(groupList.getLastGroupLogEvalue()).eql(logEvalueOfLastGroup)
		})
		it('should be able to get the entire last group', function() {
			const listOfGroups = groupList.getGroups()
			const lastGroup = listOfGroups[listOfGroups.length - 1]
			expect(groupList.getLastGroup()).eql(lastGroup)
			groupList.popGroup()
			expect(groupList.getLastGroup()).not.eql(lastGroup)
		})
		it('should be able to change the color of the last group', function() {
			const listOfGroups = groupList.getGroups()
			const lastGroup = listOfGroups[listOfGroups.length - 1]
			const colorOfLastGroup = lastGroup.getColor()
			const newColor = 'black'
			groupList.updateColorOfLastGroup(newColor)
			expect(groupList.getLastGroupColor()).eql(newColor)
			expect(groupList.getLastGroupColor()).not.eql(colorOfLastGroup)
		})
	})
})
