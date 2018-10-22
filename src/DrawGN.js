'use strict'

const d3 = require('d3')
const mist3 = require('node-mist3')
const phylogician = require('phylogician')

const HomologGroupTag = require('./HomologGroupTag')
const HomologGroupEntry = require('./HomologGroupEntry')
let currentNodeIndex = 1

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
		this.interactiveParams = {
			mouseover: true,
			selected: false,
			currentEvalue: 100,
			maxLogEvalue: 200,
			colorValue: '006EBD',
			searched: new Set([])
		}
	}

	init(groupInit) {
		this.leftMost = 0
		this.rightMost = 0
		this.geneHoodObject.gns.forEach((gn) => {
			if (gn.span.left > this.leftMost)
				this.leftMost = gn.span.left
			if (gn.span.right > this.rightMost)
				this.rightMost = gn.span.right
		})
		this.xDom = d3.scaleLinear().domain([0, this.leftMost + this.rightMost])
		this.interactiveParams.tagGroupZero = groupInit.tagGroupZero
		this.interactiveParams.entryGroupZero = groupInit.entryGroupZero
		this.interactiveParams.currentGroupTag = this.interactiveParams.tagGroupZero

		const self = this
		d3.select('#evalueCutOff')
		.on('input', function() {
			if (self.interactiveParams.selected && self.interactiveParams.currentEvalue > this.value) {
				self.svg.selectAll('.arrow')
					.filter((geneIndex) => {
						const gene = self.geneHoodObject.getGene(geneIndex)
						return gene.groups.getLastGroupTag() === self.interactiveParams.currentGroupTag
					})
					.each((geneIndex) => {
						const gene = self.geneHoodObject.getGene(geneIndex)
						gene.groups.popGroup()
					})
			}
			self.interactiveParams.currentEvalue = this.value
			self.interactiveParams.searched.clear()
			const t0 = performance.now()
			self.markHomologs(null)
			// console.log(`markHomologs took ${performance.now() - t0} ms`)
			self.unMarkHomologs()
			self.changeCutOff(this.value)
			d3.select('#evalueCutOffText')
				.attr('value', this.value)
		})
		d3.select('#evalueCutOffText')
			.on('change', function() {
				self.changeCutOff(this.value)
				d3.select('#evalueCutOff')
					.attr('value', this.value)
			})
	}

	changeCutOff(newValue) {
		if (this.interactiveParams.selected && this.interactiveParams.currentEvalue > newValue) {
			this.svg.selectAll('.arrow')
				.filter((geneIndex) => {
					const gene = this.geneHoodObject.getGene(geneIndex)
					return gene.groups.getLastGroupTag() === this.interactiveParams.currentGroupTag
				})
				.each((geneIndex) => {
					const gene = this.geneHoodObject.getGene(geneIndex)
					gene.groups.popGroup()
				})
		}
		this.interactiveParams.currentEvalue = newValue
		this.interactiveParams.searched.clear()
		const t0 = performance.now()
		this.markHomologs(null)
		// console.log(`markHomologs took ${performance.now() - t0} ms`)
		this.unMarkHomologs()
	}


	/**
	 * Initialization function that draws all gene clusters described in this.geneHoodObject.
	 */
	drawAllClusters() {
		this.geneHoodObject.gns.forEach((geneCluster, i) => {
			// console.log(this.geneHoodObject.getGene(geneCluster.ref))
			this.drawClusters(geneCluster, i)
		})
	}

	/**
	 * Draws a single gene cluster with ID attribute of the current index.
	 * 
	 * @param {any} geneCluster The current geneCluster.
	 * @param {any} i The index of the current geneCluster.
	 */
	drawClusters(geneCluster, i) {
		const self = this

		if (geneCluster.refStrand === '+')
			self.xDom.range([0, this.width])
		else
			self.xDom.range([this.width, 0])

		let corrNodeID = '#tnt_tree_node_treeBox_' + currentNodeIndex

		const genes = self.svg.append('g')
			.attr('class', 'geneCluster')
			.attr('id', `GN${i}`)
			.attr('transform', `translate (0, ${self.params.padding + i * (self.params.arrowThickness + self.params.paddingBetweenArrows)})`)
			.selectAll('.geneCluster')
			.data(geneCluster.cluster)

		genes.enter()
			.append('path')
			.attr('class', (geneIndex) => {
				return 'arrow ' + 'gene' + geneIndex
			})
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
				return (geneIndex === geneCluster.ref) ? self.params.refArrowBorderWidth : self.params.arrowBorderWidth
			})
			.attr('fill', (geneIndex) => {
				return 'white'
				// const gene = self.geneHoodObject.getGene(geneIndex)
				// return gene.groups.getLastGroupColor()
			})
			.attr('alignID', 'none')
			.attr('shift-x', 0)
			.on('click', (geneIndex) => {
				const t0 = performance.now()
				self.interactiveParams.searched.clear()
				this.toggleGeneSelection_(geneIndex)
				// console.log(`Toggle took ${performance.now() - t0} ms`)

			})
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
				const y = self.geneNameFontSize + self.params.arrowThickness + dx * Math.cos(self.geneNameInclination) + self.geneNameFontSize / 2
				let x = self.xDom(gene.start - geneCluster.span.center) + (self.xDom(gene.stop) - self.xDom(gene.start)) / 2 - dx / 2
				if (geneCluster.refStrand === '+')
					x += self.width / 2
				else
					x -= self.width / 2 
				gene.textPos = {
					x,
					y
				}
				return `translate(${x}, ${y}) rotate(${self.geneNameInclination}) `
			})
	}

	/**
	 * Helper function that assigns HTML properties to link nodes and clusters one-to-one based on matching loci.
	 */
	assignClusterAndNodeIDS(root) {
		let locus = ''
		for (let i = 0; i < this.geneHoodObject.gns.length; i++) {
			locus = this.geneHoodObject.genes[this.geneHoodObject.gns[i].ref].locus
			currentNodeIndex = 0
			for (let k = currentNodeIndex + 1; k <= 1000000000; k++) {
				if (d3.select('#tnt_tree_node_treeBox_' + k).attr('class') === 'leaf tnt_tree_node' &&
					d3.select('#tnt_tree_node_treeBox_' + k).select('text')
						.text() === locus) {
					currentNodeIndex = k
					break
				}
			}
			let corrNodeID = '#tnt_tree_node_treeBox_' + currentNodeIndex
			d3.select(`#GN${i}`).attr('correspondingNodeID', corrNodeID)
			d3.select(corrNodeID).attr('correspondingClusterID', '#GN' + i)
			// Setting internal attributes
			let leavesArr = root.get_all_leaves()
			for (let j = 0; j < leavesArr.length; j++) {
				// Need a new for loop here because leavesArr is not in the same order as seen in the visualization.
				if (leavesArr[j].property('_id') === currentNodeIndex) {
					leavesArr[j].property('leafIndex', j)
					leavesArr[j].property('correspondingClusterID', '#GN' + i)
				}
			}
		}
	}

	/**
	 * Uses Phylogician to create a tree with desired node spacing using the Newick provided in this.geneHoodObject.
	 *
	 * @param {any} drawSpace The space in which to draw the SVG tree object (currently not used).
	 *
	 * @returns The root node of the tree.
	 */
	drawTree(drawSpace) {
		const nodeYSpacing = 55
		const newick = buildLocusNewick(this.geneHoodObject.phylo)
		let tree = phylogician.makeCustomTree(newick, nodeYSpacing)
		return tree
	}

	toggleGeneSelection_(geneIndex) {
		const t0 = performance.now()
		const gene = this.geneHoodObject.getGene(geneIndex)
		const t1 = performance.now()
		// console.log(`ToggleGene :: It took ${t1 - t0} ms to find a gene`)
		if (this.interactiveParams.mouseover) {
			this.interactiveParams.selected = geneIndex
			// console.log(`group ${gene.groups.getLastGroupHash()}`)

			if (gene.groups.getLastGroupHash() === this.interactiveParams.tagGroupZero.getHash()) {
				// console.log('making new group')
				const newGroup = new HomologGroupTag(this.interactiveParams.colorValue)
				// console.log(newGroup)
				this.interactiveParams.currentGroupTag = newGroup
				const newGroupEntry = new HomologGroupEntry(newGroup)
				gene.groups.addGroup(newGroupEntry)
			}
			else {
				this.interactiveParams.currentGroupTag = gene.groups.getLastGroupTag()
			}
			const t2 = performance.now()
			// console.log(`ToggleGene :: It took ${t2 - t1} ms to create a group`)
			this.svg.selectAll('.arrow')
				.filter((arrowIndex) => {
					const arrow = this.geneHoodObject.getGene(arrowIndex)
					return arrow.stable_id === gene.stable_id
				})
				.style('stroke', 'red')
				.style('fill', () => {
					// console.log(gene.groups.getLastGroupColor())
					return gene.groups.getLastGroupColor()
				})
			const t3 = performance.now()
			// console.log(`ToggleGene :: It took ${t3 - t2} ms to color red border of selected gene`)
			this.svg.selectAll('.arrow')
				.filter((arrowIndex) => {
					const arrow = this.geneHoodObject.getGene(arrowIndex)
					return arrow.stable_id !== gene.stable_id
				})
				.on('click', () => {
					return false
				})
			const t4 = performance.now()
			// console.log(`ToggleGene :: It took ${t4 - t3} ms to mute click of other genes`)
			this.svg.selectAll('.arrow').on('mouseover', (g) => {
				d3.select('#compTip').style('display', 'table-cell')
				this.displayGeneInfo_(g, '#compTip')
			})
			const t5 = performance.now()
			// console.log(`ToggleGene :: It took ${t5 - t4} ms to make new mouse over in all genes`)
			this.interactiveParams.mouseover = false
			this.markHomologs(geneIndex)
			const t6 = performance.now()
			// console.log(`ToggleGene :: It took ${t6 - t5} ms to run markHomologs`)
			this.displayGeneInfo_(geneIndex, '#divTip')
			// console.log(`ToggleGene :: total time - ${t6 - t0} ms`)
		}
		else {
			this.interactiveParams.selected = false
			this.svg.selectAll('.arrow')
				.filter((arrowIndex) => {
					const arrow = this.geneHoodObject.getGene(arrowIndex)
					return arrow.stable_id === gene.stable_id
				})
				.style('stroke', 'black')
			this.svg.selectAll('.arrow')
				.filter((arrowIndex) => {
					const arrow = this.geneHoodObject.getGene(arrowIndex)
					return arrow.stable_id !== gene.stable_id
				})
				.on('click', (arrowIndex) => {
					this.toggleGeneSelection_(arrowIndex)
				})
			this.svg.selectAll('.arrow').on('mouseover', (arrowIndex) => {
				d3.select('#compTip').style('display', 'none')
				this.displayGeneInfo_(arrowIndex, '#divTip')
			})
			this.interactiveParams.mouseover = true
			this.interactiveParams.currentGroupTag = this.interactiveParams.tagGroupZero
		}
	}

	/**
	 * Marks homologs based on the user-inputted threshold on the front-end slider. 
	 *
	 * @param {any} queryGeneIndex The query gene index for the homolog group (?)
	 */
	markHomologs(queryGeneIndex) {
		if (this.interactiveParams.selected) {
			this.interactiveParams.searched.add(queryGeneIndex)
			const t0 = performance.now()
			const geneIndex = queryGeneIndex || this.interactiveParams.selected
			const self = this
			this.svg.selectAll('.arrow')
				.filter((arrowIndex) => {
					const arrow = self.geneHoodObject.getGene(arrowIndex)
					if (arrow.blastHits.hasOwnProperty(arrowIndex))
						return arrow.blastHits[geneIndex] >= self.interactiveParams.currentEvalue && arrow.groups.getLastGroupTag() !== self.interactiveParams.currentGroupTag
					return false
				})
				.each((arrowIndex) => {
					const arrow = self.geneHoodObject.getGene(arrowIndex)
					const selGene = self.geneHoodObject.getGene(geneIndex)
					let logEvalue = arrow.blastHits[arrowIndex]
					if (selGene.groups.getLastGroupLogEvalue()) {
						if (selGene.groups.getLastGroupLogEvalue() < logEvalue)
							logEvalue = selGene.groups.getLastGroupLogEvalue()
					}
					// console.log(logEvalue)
					const newGroupEntry = new HomologGroupEntry(self.interactiveParams.currentGroupTag, logEvalue)
					newGroupEntry.parent = geneIndex
					arrow.groups.addGroup(newGroupEntry)
				})
				.style('fill', (arrowIndex) => {
					const arrow = self.geneHoodObject.getGene(arrowIndex)
					return arrow.groups.getLastGroupColor()
				})
				.each((arrowIndex) => {
					if (!self.interactiveParams.searched.has(arrowIndex)) {
						this.markHomologs(arrowIndex)
					}
				})
		}
		// console.log(this.interactiveParams.selected)
	}

	/**
	 * Unmarks homologs based the user-inputted threshold on the front-end slider.
	 */
	unMarkHomologs() {
		const self = this
		if (self.interactiveParams.selected) {
			self.svg.selectAll('.arrow')
				.filter((arrowIndex) => {
					const arrow = self.geneHoodObject.getGene(arrowIndex)
					return arrow.groups.getLastGroupHash() === self.interactiveParams.currentGroupTag.getHash()
				})
				.filter((arrowIndex) => {
					const arrow = self.geneHoodObject.getGene(arrowIndex)
					// console.log(`part of the group ${self.interactiveParams.currentGroupTag.getHash()}: ${arrowIndex} - ${arrow.groups.getLastGroupLogEvalue()} vs. ${self.interactiveParams.currentEvalue}`)
					return arrow.groups.getLastGroupLogEvalue() < self.interactiveParams.currentEvalue || self.interactiveParams.currentEvalue === self.interactiveParams.maxLogEvalue
				})
				.each((arrowIndex) => {
					const arrow = self.geneHoodObject.getGene(arrowIndex)
					arrow.groups.popGroup()
				})
				.style('fill', (arrowIndex) => {
					const arrow = self.geneHoodObject.getGene(arrowIndex)
					// console.log(`turning off: ${arrowIndex}`)
					return arrow.groups.getLastGroupColor()
				})
		}
	}

	/**
	 * Changesd the color of the currently selected gene homolog group.
	 *
	 * @param {any} color The desired color.
	 */
	changeSelectionColor(color) {
		this.interactiveParams.colorValue = color
		if (this.interactiveParams.selected) {
			const gene = this.geneHoodObject.getGene(this.interactiveParams.selected)
			const selectedHash = gene.groups.getLastGroupHash()
			this.svg.selectAll('.arrow')
				.filter((geneIndex) => {
					const arrow = this.geneHoodObject.getGene(geneIndex)
					return arrow.groups.getLastGroupHash() === selectedHash
				})
				.style('fill', color)
				.each((geneIndex) => {
					const arrow = this.geneHoodObject.getGene(geneIndex)
					arrow.groups.updateColorOfLastGroup(color)
				})
		}
	}

	/**
	 * Displays the gene information of the currently selected gene.
	 *
	 * @param {any} geneIndex The index of the current gene.
	 * @param {any} tipId The ID of the gene's tooltip in the HTML.
	 */
	displayGeneInfo_(geneIndex, tipId) {
		let prod = ''
		const gene = this.geneHoodObject.getGene(geneIndex)
		const divtip = d3.select(tipId)
		const genomes = new mist3.Genomes(this.httpsDefaultOptions, 'error')
		let organismName = ''
		const DA = `<img src="http://seqdepot.net/api/v1/aseqs/${gene.aseq_id}.png">`
		genomes.getGenomeInfoByVersion(gene.stable_id.split('-')[0]).then((info) => {
			organismName = info.name
			divtip.transition()
			const names = gene.names ? gene.names.join(',') : ''
			if (gene.product.length > 64)
				prod = gene.product.substr(0, 65) // Keeps the length of gene description appropriate.
			else
				prod = gene.product
			divtip.html(`<h>Organism: ${organismName}<br/>Stable ID: ${gene.stable_id}<br/>locus: ${gene.locus}<br/>Old locus: ${gene.old_locus}<br/>Description: ${prod}<br>${DA}</br></h>`)
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
		// // console.log(path)
		return arrow2line(path)
	}

	makePathOfOneGene_(startX, len, strand, H, arrowBorderWidth) {
		let arrow = []
		const h = H / 5
		if (strand !== '-') {
			arrow = [
				{x: startX, y: (H / 2)},
				{x: startX + len * 8 / 11, y: (H / 2)},
				{x: startX + len * 8 / 11, y: (H / 2) - h},
				{x: startX + len, y: (H / 2) + h*1.5},
				{x: startX + len * 8 / 11, y: (H / 2) + h * 4},
				{x: startX + len * 8 / 11, y: (H / 2) + h * 3},
				{x: startX, y: (H / 2) + h * 3},
				{x: startX, y: (H / 2) - arrowBorderWidth / 2}
			]
		}
		else {
			arrow = [
				{x: startX, y: (H/2) + h * 1.5},
				{x: startX + len * 3 / 11, y: (H / 2) - h},
				{x: startX + len * 3 / 11, y: (H / 2)},
				{x: startX + len, y: (H / 2)},
				{x: startX + len, y: (H / 2) + h * 3},
				{x: startX + len * 3 / 11, y: (H / 2) + h * 3},
				{x: startX + len * 3 / 11, y: (H / 2) + h * 4},
				{x: startX, y: (H / 2) + h * 1.5}
			]
		}
		return arrow
	}

}

/**
 * Helper function that builds a Newick that only has locus as each node's text.
 *
 * @param {any} newick The unparsed Newick string generated by GeneHood.
 *
 * @returns The newly built Newick string that only has locus as node text.
 */
function buildLocusNewick(newick) {
	let newNewick = ''
	let reachedHyphen = false
	for (let i = 0; i < newick.length; i++) {
		if (newick[i] === '-' && !reachedHyphen) {
			reachedHyphen = true
			i++
		}
		if (reachedHyphen) {
			if (newick[i] === ',')
				reachedHyphen = false
			newNewick += newick[i]
		}
		else if (newick[i] === '(' || newick[i] === ')') {
			newNewick += newick[i]
		}
	}
	return newNewick
}
