'use strict'

const crypto = require('crypto')

const kDefault = {
	bytesInHash: 7
}

module.exports =
class HomologGroupTag {
	constructor(color) {
		this.hash_ = crypto.randomBytes(kDefault.bytesInHash).toString('hex')
		this.color_ = color
	}

	getHash() {
		return this.hash_
	}

	getColor() {
		return this.color_
	}

	updateColor(color) {
		this.color_ = color
	}
}
