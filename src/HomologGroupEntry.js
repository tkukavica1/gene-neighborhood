'use strict'

const crypto = require('crypto')

const kDefault = {
	bytesInHash: 7
}

module.exports =
class HomologGroupEntry {
	constructor(groupTag, logEvalue = null) {
		this.groupTag_ = groupTag
		this.logEvalue_ = logEvalue
	}

	getHash() {
		return this.groupTag_.getHash()
	}

	getLogEvalue() {
		return this.logEvalue_
	}

	getColor() {
		return this.groupTag_.getColor()
	}

	getTag() {
		return this.groupTag_
	}

	updateColor(newColor) {
		this.groupTag_.updateColor(newColor)
	}

	updateLogEvalue(newLogEvalue) {
		this.logEvalue_ = newLogEvalue
	}
}
