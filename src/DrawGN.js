'use strict'

const d3 = require('d3')
const mist3 = require('node-mist3')

const arrow2line = d3.line()
	.x(function(d) {
		return d.x
	})
	.y(function(d) {
		return d.y
	})

module.exports =
class DrawGN {
	constructor(geneHoodObject, geneHoodArea, width) {
		this.geneHoodObject = geneHoodObject
		this.maxLenGeneCluster = 0
		this.svg = geneHoodArea
		this.width = width
		this.geneNameFontSize = 12
		this.geneNameInclination = -45
		this.params = {
			padding: 5,
			paddingBetweenArrows: 30,
			arrowThickness: 25,
			arrowBorderWidth: 1,
			refArrowBorderWidth: 3
		}
		this.httpsDefaultOptions = {
			method: 'GET',
			hostname: 'api.mistdb.caltech.edu',
			headers: {},
			agent: false
		}
	}

	init() {
		this.leftMost = 0
		this.rightMost = 0
		this.geneHoodObject.gns.forEach((gn) => {
			if (gn.span.left > this.leftMost)
				this.leftMost = gn.span.left
			if (gn.span.right > this.rightMost)
				this.rightMost = gn.span.right
		})
		console.log(this.leftMost)
		console.log(this.rightMost)
		this.xDom = d3.scaleLinear().domain([0, this.leftMost + this.rightMost])
	}

	drawAllClusters() {
		this.geneHoodObject.gns.forEach((geneCluster, i) => {
			console.log('--')
			this.drawClusters(geneCluster, i)
		})
	}

	drawClusters(geneCluster, i) {
		const self = this

		if (geneCluster.refStrand === '+')
			self.xDom.range([0, this.width])
		else
			self.xDom.range([this.width, 0])

		const genes = self.svg.append('g')
			.attr('class', 'geneCluster')
			.attr('id', `GN${i}`)
			.attr('transform', `translate (0, ${self.params.padding + i * (self.params.arrowThickness + self.params.paddingBetweenArrows)})`)
			.selectAll('.geneCluster')
			.data(geneCluster.cluster)

		genes.enter()
			.append('path')
			.attr('class', 'arrow')
			.attr('d', (geneIndex) => {
				const arrows = self.makeArrows(geneIndex, geneCluster.span.center, geneCluster.refStrand)
				return arrows
			})
			.attr('stroke', (geneIndex) => {
				const gene = self.geneHoodObject.getGene(geneIndex)
				if (gene.aseq_id)
					return 'black'
				return 'lightgrey'
			})
			.attr('stroke-width', (geneIndex) => {
				const gene = self.geneHoodObject.getGene(geneIndex)
				return (geneIndex === geneCluster.ref) ? self.params.refArrowBorderWidth : self.params.arrowBorderWidth
			})
			.attr('fill', (geneIndex) => {
				return 'white'
				// const gene = self.geneHoodObject.getGene(geneIndex)
				// return gene.groups.getLastGroupColor()
			})
/* 				.on('click', (gene) => {
				toggleGeneSelection_(svg, gene)
			})
			*/
			.on('mouseover', (geneIndex) => {
				this.displayGeneInfo_(geneIndex, '#divTip')
			})

		genes.enter()
			.append('text')
			.attr('class', 'arrowText')
			.attr('font-size', this.geneNameFontSize)
			.text((geneIndex) => {
				const gene = self.geneHoodObject.getGene(geneIndex)
				let names = ''
				if (gene.names)
					names = gene.names.join(', ')
				return names
			})
			.attr('transform', function(geneIndex) {
				const gene = self.geneHoodObject.getGene(geneIndex)
				let names = ''
				if (gene.names)
					names = gene.names.join(', ')
				const dx = this.getComputedTextLength(names)
				// console.log(dx)
				const y = self.geneNameFontSize + self.params.arrowThickness + dx * Math.cos(self.geneNameInclination) + self.geneNameFontSize / 2
				let x = self.xDom(gene.start - geneCluster.span.center) + (self.xDom(gene.stop) - self.xDom(gene.start)) / 2 - dx / 2
				if (geneCluster.refStrand === '+')
					x += self.width / 2
				else
					x -= self.width / 2 
				// console.log(self.xDom(gene.start - geneCluster.span.center))
				gene.textPos = {
					x,
					y
				}
				return `translate(${x}, ${y}) rotate(${self.geneNameInclination}) `
			})
	}

	displayGeneInfo_(geneIndex, tipId) {
		const gene = this.geneHoodObject.getGene(geneIndex)
		const divtip = d3.select(tipId)
		const genomes = new mist3.Genomes(this.httpsDefaultOptions, 'error')
		let organismName = ''
		// const DA = "" // `<img src="httpss://api.mistdb.caltech.edu/v1/aseqs/${gene.aseq_id}.png">`
		genomes.getGenomeInfoByVersion(gene.stable_id.split('-')[0]).then((info) => {
			organismName = info.name
			divtip.transition()
			const names = gene.names ? gene.names.join(',') : ''
			divtip.html(`<h>Organism: ${organismName}<br/>Stable ID: ${gene.stable_id}<br/>locus: ${gene.locus}<br/>Old locus: ${gene.old_locus}<br/>Description: ${gene.product}</h>`)
		})
	}

	makeArrows(geneIndex, refStart, refStrand) {
		const gene = this.geneHoodObject.getGene(geneIndex)
		let begin = this.xDom(gene.start - refStart)
		if (refStrand === '+')
			begin += this.width / 2
		else
			begin -= this.width / 2
		const length = this.xDom(gene.stop - refStart) - this.xDom(gene.start - refStart)
		const path = this.makePathOfOneGene_(
			begin,
			length,
			gene.strand,
			this.params.arrowThickness,
			this.params.arrowBorderWidth
		)
		// console.log(path)
		return arrow2line(path)
	}

	makePathOfOneGene_(startX, len, strand, H, arrowBorderWidth) {
		let arrow = []
		const h = H / 5
		if (strand !== '-') {
			arrow = [
				{x: startX, y: (H/2)},
				{x: startX + len * 8/11, y: (H/2)},
				{x: startX + len * 8/11, y: (H/2) - h},
				{x: startX + len, y: (H/2) + h*1.5},
				{x: startX + len * 8/11, y: (H/2) + h * 4},
				{x: startX + len * 8/11, y: (H/2) + h * 3},
				{x: startX, y: (H/2) + h * 3},
				{x: startX, y: (H/2) - arrowBorderWidth/2}
			]
		}
		else {
			arrow = [
				{x: startX, y: (H/2) + h * 1.5},
				{x: startX + len * 3/11, y: (H/2) - h},
				{x: startX + len * 3/11, y: (H/2)},
				{x: startX + len, y: (H/2)},
				{x: startX + len, y: (H/2) + h * 3},
				{x: startX + len * 3/11, y: (H/2) + h * 3},
				{x: startX + len * 3/11, y: (H/2) + h * 4},
				{x: startX, y: (H/2) + h * 1.5}
			]
		}
		return arrow
	}

}
