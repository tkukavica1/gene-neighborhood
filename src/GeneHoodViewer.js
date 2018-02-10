'use strict'

const d3 = require('d3')
const drawGN = require('./drawGN')




module.exports =
class GeneHoodViewer {
	constructor(domGNid, domErrorId) {
		this.date = Date.now()
		this.domGNid_ = domGNid
		this.domErrorId_ = domErrorId
	}

	changeColor(value) {
		const svg = d3.select(this.domGNid_).select('svg')
		drawGN.changeSelectionColor(svg, value)
	}

	draw(dataString) {
		if (this.upload_(dataString)) {
			const drawSpace = d3.select(this.domGNid_)
			const dimensions = drawSpace.node().getBoundingClientRect()
			const svg = drawSpace.append('svg')
				.attr('width', dimensions.width)
				.attr('height', dimensions.height)
				.style('border', '1px solid black')

			const widthGN = 2/3 * dimensions.width

			let maxLenGeneCluster = 0
			this.data.forEach((geneCluster) => {
				const opLen = geneCluster.gn[geneCluster.gn.length - 1].stop - geneCluster.gn[0].start
				if (maxLenGeneCluster < opLen)
					maxLenGeneCluster = opLen
			})
			this.data.forEach((geneCluster, i) => {
				drawGN.drawGeneCluster(svg, geneCluster, i, maxLenGeneCluster, widthGN)
			})
		}
		else {
			console.log('Error')
		}
	}

	upload_(dataString) {
		this.hideError_()
		return this.parseData_(dataString)
	}

	parseData_(dataString) {
		let data = {}
		try {
			data = JSON.parse(dataString)
		}
		catch (err) {
			this.emitError_()
			return false
		}
		if (this.checkData_(data)) {
			this.data = data.data
			this.phylo = data.phylo
			console.log(`hey there, there are ${this.data.length} main entries`)
			return true
		}
		return false
	}

	checkData_(data) {
		if (!data.hasOwnProperty('data') || !data.hasOwnProperty('phylo')) {
			this.emitError_()
			return false
		}
		return true
	}

	emitError_() {
		const errorDiv = d3.select(this.domErrorId_)
		errorDiv.transition()
			.style('display', 'table')
	}

	hideError_() {
		const errorDiv = d3.select(this.domErrorId_)
		errorDiv.transition().style('display', 'none')
	}

}
