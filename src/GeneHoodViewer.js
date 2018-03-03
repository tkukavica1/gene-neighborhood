'use strict'

const d3 = require('d3')
const drawGN = require('./drawGN')
require('d3-selection')
const zoom = d3.zoom()

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
<<<<<<< HEAD
				.attr('height', dimensions.height * 2)
=======
				.attr('height', dimensions.height * 10)
>>>>>>> dev
				.style('border', '1px solid black')

			const drawHere = svg.append('g')
				.attr('class', 'drawHere')
				.attr('width', dimensions.width)
				.attr('height', dimensions.height * 10)
				.style('fill', 'white')

			const zoomActions = () => {
				drawHere.attr('transform', (d) => {
					console.log(d3.event)
					console.log(drawHere.attr('transform'))
					let currentTranslate = drawHere.attr('transform') ? parseInt(drawHere.attr('transform').match('( | -)[0-9]{1,10}')) : 0
					currentTranslate = currentTranslate === NaN ? 0 : currentTranslate
					console.log(currentTranslate)
					return `translate(0, ${d3.event.sourceEvent.wheelDeltaY + currentTranslate})`
				})
			}
			const zoomHandler = zoom.on('zoom', zoomActions)

			zoomHandler(svg)

/* 			const zoomHandler = d3.zoom()
				.on('zoom', drawHere.attr('transform', d3.currentEvent.transform))

			zoomHandler(drawHere) */

			const widthGN = 2/3 * dimensions.width

			let maxLenGeneCluster = 0
			this.data.forEach((geneCluster) => {
				const opLen = geneCluster.gn[geneCluster.gn.length - 1].stop - geneCluster.gn[0].start
				if (maxLenGeneCluster < opLen)
					maxLenGeneCluster = opLen
			})
			this.data.forEach((geneCluster, i) => {
				drawGN.drawGeneCluster(drawHere, geneCluster, i, maxLenGeneCluster, widthGN)
			})
			drawGN.alignClusters(drawHere, this.data, dimensions.width - widthGN, widthGN)
			// drawGN.reScaleClusters(svg, widthGN)
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
