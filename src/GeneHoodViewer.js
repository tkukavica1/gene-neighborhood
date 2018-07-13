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


	/**
	 * Creates the front-end display of the gene clusters and its corresponding
	 * phylogenetic tree.
	 * 
	 * @param {any} dataString String of gene cluster data to be displayed.
	 * 
	 * @returns Translation of geneHoodArea if upload was successful, otherwise nothing.
	 */
	draw(dataString) {
		if (this.upload_(dataString)) {
			const drawSpace = d3.select(this.domGNid_)
			const dimensions = drawSpace.node().getBoundingClientRect()
		
			// Create div for the phylogenetic tree.
			const treeSpace = drawSpace.append('div')
				.attr('id', 'treeBox')
				.attr('class', 'phyloTree')
				.attr('width', dimensions.width * 0.25)
				.attr('height', dimensions.height * 10)
				.style('overflowY', 'hidden')

			// Create svg for the gene clusters (should overlap with treeSpace div).
			const svg = drawSpace.append('svg')
				.attr('id', 'geneClusterBox')
				.attr('width', dimensions.width)
				.attr('height', dimensions.height * 10)
				.style('border', '1px solid black')

			// Create g within svg that allows for transforms of the gene clusters.
			const geneHoodArea = svg.append('g')
				.attr('id', 'geneHoodArea')
				.attr('class', 'geneHoodArea')
				.attr('width', dimensions.width)
				.attr('height', dimensions.height * 10)
				.attr('transform', `translate (${1/3 * dimensions.width}, 20)`) // Prevent overlap of tree and gene clusters.

			// Allow for scrolling up/down of gene clusters (occurs within geneHoodArea 'g', not 'svg').
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

			let maxLenGeneCluster = 0 // Will determine the maximum gene cluster length
			let numClusters = 0 // Counts the number of gene clusters
			this.data.forEach((geneCluster) => {
				const opLen = geneCluster.gn[geneCluster.gn.length - 1].stop - geneCluster.gn[0].start
				numClusters++ // Counting total number of gene clusters so that Newick for phylogenetic tree can be created.
				if (maxLenGeneCluster < opLen)
					maxLenGeneCluster = opLen
			})
			this.data.forEach((geneCluster, i) => {
				drawGN.drawGeneCluster(geneHoodArea, geneCluster, i, maxLenGeneCluster, widthGN)
			})
			drawGN.alignClusters(geneHoodArea, this.data, dimensions.width - widthGN, widthGN)
			// drawGN.reScaleClusters(svg, widthGN)
			drawGN.makeTree(drawGN.buildNewickForClusters(numClusters), 55)
			drawGN.changeNodeSize(4)
		}
		else {
			console.log('Error: Unable to display uploaded data.')
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
			console.log(`There are ${this.data.length} main entries.`)
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
