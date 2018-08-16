'use strict'

const ListOfHomologGroups = require('./ListOfHomologGroups')
const HomologGroupTag = require('./HomologGroupTag')
const HomologGroupEntry = require('./HomologGroupEntry')

module.exports =
class HomologLogic {
	constructor(geneHoodObject, params) {
		this.geneHoodObject = geneHoodObject
		this.params = params || {
			colorValue: '006EBD',
			currentEvalue: 100,
			colorOfGroupZero: '#FFFFFF'
		}
	}

	init() {
		const tagGroupZero = new HomologGroupTag(this.params.colorOfGroupZero)
		const entryGroupZero = new HomologGroupEntry(tagGroupZero)
		const t0 = performance.now()
		this.geneHoodObject.genes.forEach((gene, geneIndex) => {
			const groupList = new ListOfHomologGroups()
			gene.groups = groupList
			gene.groups.addGroup(entryGroupZero)
			const t = performance.now()
			gene.blastHits = {}
		})
		this.addBlastHits()
		console.log(`Done in: ${performance.now() - t0}`)
		return {
			tagGroupZero,
			entryGroupZero
		}
	}

	addBlastHits() {
		for (let i = 0, N = this.geneHoodObject.simLinks.length; i < N; i++) {
			const link = this.geneHoodObject.simLinks[i]
			this.geneHoodObject.genes[link.s].blastHits[link.t] = link.e
			this.geneHoodObject.genes[link.t].blastHits[link.s] = link.e
		}
	}

}
