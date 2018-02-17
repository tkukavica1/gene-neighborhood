'use strict'

const HomologEntry = require('./HomologGroupEntry')

module.exports =
class ListOfHomologGroups {
	constructor() {
		this.groups_ = []
	}

	getGroups() {
		return this.groups_
	}

	addGroup(groupEntry) {
		if (this.verifyNewEntry(groupEntry))
			this.groups_.push(groupEntry)
		else
			throw new Error('Not an instance of HomologGroupEntry')
	}

	popGroup() {
		this.groups_.pop()
	}

	getLastGroupHash() {
		const lastGroupTag = this.getLastGroup()
		return lastGroupTag.getHash()
	}

	updateColorOfLastGroup(newColor) {
		this.getLastGroup().updateColor(newColor)
	}

	getLastGroupLogEvalue() {
		return this.getLastGroup().getLogEvalue()
	}

	getLastGroupColor() {
		return this.getLastGroup().getColor()
	}

	getLastGroupTag() {
		return this.groups_[this.groups_.length - 1].getTag()
	}

	getLastGroup() {
		return this.groups_[this.groups_.length - 1]
	}

	verifyNewEntry(newEntry) {
		return newEntry instanceof HomologEntry
	}

}
