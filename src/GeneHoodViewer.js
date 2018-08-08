'use strict'

const d3 = require('d3')
//const drawGN = require('./drawGN')
const DrawGN = require('./DrawGN')
require('d3-selection')
const zoom = d3.zoom()

const GeneHoodObject = require('./GeneHoodObject')
const HomologLogic = require('./HomologLogic')

module.exports =
class GeneHoodViewer {
	constructor(domGNid, domErrorId) {
		this.date = Date.now()
		this.domGNid_ = domGNid
		this.domErrorId_ = domErrorId
	}

	changeColor(value) {
		const svg = d3.select(this.domGNid_).select('svg')
		this.drawGN.changeSelectionColor(value)
	}

	draw(dataString) {
		if (this.upload_(dataString)) {
			const drawSpace = d3.select(this.domGNid_)
			const dimensions = drawSpace.node().getBoundingClientRect()
			const svg = drawSpace.append('svg')
				.attr('width', dimensions.width)
				.attr('height', dimensions.height * 10)
				.style('border', '1px solid black')

			const geneHoodArea = svg.append('g')
				.attr('class', 'geneHoodArea')
				.attr('width', dimensions.width)
				.attr('height', dimensions.height * 10)
				.attr('transform', `translate (${1/3 * dimensions.width}, 0)`)
				//.style('fill', 'white')

			const zoomActions = () => {
				geneHoodArea.attr('transform', (d) => {
					let currentTranslate = geneHoodArea.attr('transform') ? parseInt(geneHoodArea.attr('transform').match('( | -)[0-9]{1,10}')) : 0
					currentTranslate = isNaN(currentTranslate) ? 0 : currentTranslate
					return `translate(${1/3 * dimensions.width}, ${d3.event.sourceEvent.wheelDeltaY + currentTranslate})`
				})
			}
			const zoomHandler = zoom.on('zoom', zoomActions)
			zoomHandler(svg)

			const widthGN = 2/3 * dimensions.width

			const homologLogic = new HomologLogic(this.geneHoodObject)
			const groupInit = homologLogic.init()

			this.drawGN = new DrawGN(this.geneHoodObject, geneHoodArea, widthGN)
			this.drawGN.init(groupInit)
			this.drawGN.drawAllClusters()

			this.drawGN.drawTree()
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
			this.geneHoodObject = new GeneHoodObject(data)
			console.log(`hey there, there are ${this.geneHoodObject.gns.length} neighborhoods and ${this.geneHoodObject.genes.length}`)
			return true
		}
		return false
	}

	checkData_(data) {
		if (!data.hasOwnProperty('genes') || !data.hasOwnProperty('gns') || !data.hasOwnProperty('phylo') || !data.hasOwnProperty('simLinks')) {
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
