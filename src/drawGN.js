'use strict'

const d3 = require('d3')
const mist3 = require('node-mist3')
const $ = require('jquery/dist/jquery.slim')
const crypto = require('crypto')

let mouseover = true
let selected = false
let colorValue = '006EBD'
let currentEvalue = 100
let groupZero = `${crypto.randomBytes(7).toString('hex')}#white`
let currentGroup = groupZero
let ultimatelyMostRight = 0
let ultimatelyMostLeft = 10^6

const geneNameFontSize = 12
const geneNameInclination = -45

const maxLogEvalue = 200

const arrow2line = d3.line()
	.x(function(d) {
		return d.x
	})
	.y(function(d) {
		return d.y
	})

function makePathOfOneGene_(startX, len, index, strand, H, arrowBorderWidth) {
	let arrow = []
	const h = H/5
	if (strand !== '-') {
		arrow = [
			{x: startX, y: index},
			{x: startX + len * 8/11, y: index},
			{x: startX + len * 8/11, y: index - h},
			{x: startX + len, y: index + h*1.5},
			{x: startX + len * 8/11, y: index + h * 4},
			{x: startX + len * 8/11, y: index + h * 3},
			{x: startX, y: index + h * 3},
			{x: startX, y: index - arrowBorderWidth/2}
		]
	}
	else {
		arrow = [
			{x: startX, y: index + h * 1.5},
			{x: startX + len * 3/11, y: index - h},
			{x: startX + len * 3/11, y: index},
			{x: startX + len, y: index},
			{x: startX + len, y: index + h * 3},
			{x: startX + len * 3/11, y: index + h * 3},
			{x: startX + len * 3/11, y: index + h * 4},
			{x: startX, y: index + h * 1.5}
		]
	}
	return arrow
}

function drawGeneCluster(svg, op, i, maxLenGeneCluster, width) {
	const padding = 5
	const paddingBetweenArrows = 30

	const H = 25
	const arrowBorderWidth = 1
	const refArrowBorderWidth = 3

	const splitScreen = 2
	const boxSize = svg.node().getBoundingClientRect()
	const GNboxRight = boxSize.width - padding
	const GNboxLeft = boxSize.width - width

	const refStart = op.gn[0].start

	console.log(`refStart *** ${maxLenGeneCluster}`)
	console.log(`${GNboxLeft} +++ ${GNboxRight}`)

	const xDomRange = (op.refStrand === '+') ? [GNboxLeft, GNboxRight] : [GNboxRight, GNboxLeft]
	
	const xDom = d3
		.scaleLinear()
		.domain([0, maxLenGeneCluster])
		.range(xDomRange)

	for (let i = 0, N = op.gn.length; i < N; i++)
		op.gn[i] = buildGroupCapabilities(op.gn[i])

	const gs = svg.append('g')
		.attr('class', 'geneCluster')
		.attr('id', `GN${i}`)
		.selectAll('.geneCluster')
		.data(op.gn)
	
	gs.enter()
		.append('path')
		.attr('class', 'arrow')
		.attr('d', function(gene) {
			gene.y = (padding + H / 2) + i * (H + paddingBetweenArrows)
			return makeArrows(gene, H, refStart, xDom, arrowBorderWidth)
		})
		.attr('stroke', (gene) => {
			if (gene.aseq_id)
				return 'black'
			return 'lightgrey'
		})
		.attr('stroke-width', function(gene) {
			return (gene.stable_id === op.ref) ? refArrowBorderWidth : arrowBorderWidth
		})
		.attr('fill', (gene) => {
			return gene.getColorFill()
		})
		.on('click', (gene) => {
			toggleGeneSelection_(svg, gene)
		})
		.on('mouseover', (gene) => {
			displayGeneInfo_(gene, '#divTip')
		})

	gs.enter()
		.append('text')
		.attr('class', 'arrowText')
		.attr('font-size', geneNameFontSize)
		.text((gene) => {
			let names = ''
			if (gene.names)
				names = gene.names.join(', ')
			return names
		})
		.attr('transform', function(gene) {
			const dx = this.getComputedTextLength()
			const y = gene.y + geneNameFontSize / 2 + H + dx/2 * Math.cos(geneNameInclination) + geneNameFontSize / 2
			const x = xDom(gene.start - refStart) + (xDom(gene.stop) - xDom(gene.start)) / 2 - dx / 2
			gene.textPos = {
				x,
				y
			}
			return `translate(${x} ${y}) rotate(${geneNameInclination}) `
		})

	d3.select('#evalueCutOff')
		.on('input', function() {
			currentEvalue = this.value
			findHomologs(null, svg, currentEvalue)
		})
}


function makeArrows(gene, H, refStart, xDom, arrowBorderWidth) {
	return arrow2line(
		makePathOfOneGene_(
			xDom(gene.start - refStart),
			xDom(gene.stop) - xDom(gene.start),
			gene.y,
			gene.strand,
			H,
			arrowBorderWidth
		)
	)
}

function makeNewGroup(color) {
	return `${crypto.randomBytes(7).toString('hex')}#${color}`
}

function changeSelectionColor(svg, color) {
	colorValue = color
	const newCurrentGroup = `${currentGroup.split('#')[0]}#${color}`
	if (selected) {
		svg.selectAll('.arrow')
			.filter((gene) => {
				return gene.stable_id === selected.stable_id
			})
			.style('fill', color)
		svg.selectAll('.arrow')
		.filter((gene) => {
			return gene.getLastGroup() === selected.getLastGroup() && gene.getLastGroup() !== groupZero
		})
		.style('fill', (gene) => {
			gene.popGroup()
			gene.addGroup(newCurrentGroup)
			return color
		})
		currentGroup = newCurrentGroup
		console.log(selected.groups)
	}
}

function buildGroupCapabilities(gene) {
	gene.groups = []
	gene.addGroup = function(group) {
		return this.groups.push(group)
	}

	gene.getLastGroup = function() {
		return this.groups[this.groups.length - 1]
	}

	gene.popGroup = function() {
		if (this.groups.length > 1)
			this.groups.pop()
		return
	}

	gene.getColorFill = function() {
		return this.groups[this.groups.length - 1].split('#')[1]
	}
	gene.addGroup(currentGroup)

	return gene
}

let listOfSelected = []
let allBlastHitsThatMatter = []

function findHomologs(queryGene, svg, value) {
	console.log(listOfSelected)
	if (selected) {
		let selGene = queryGene || selected

		for (let i = 0, M = listOfSelected.length; i < M; i++) {
			if (listOfSelected[i].stable_id === selGene.stable_id)
				listOfSelected.push(selGene)
		}

		for (let i = 0, M = listOfSelected.length; i < M; i++) {
			for (let j = 0, N = listOfSelected[i].blast.length; j < N; j++) {
				const evalue = listOfSelected.blast[j].hsps[0].evalue
				const logEvalue = (evalue === 0) ? maxLogEvalue : -Math.log10(evalue)
				const candidateStableId = listOfSelected.blast[j].def.split('|')[1]
				if (logEvalue > value && allBlastHitsThatMatter.indexOf(candidateStableId) === -1)
					allBlastHitsThatMatter.push(candidateStableId)
				else if (logEvalue < value && allBlastHitsThatMatter.indexOf(candidateStableId) !== -1)
					allBlastHitsThatMatter = allBlastHitsThatMatter.splice(allBlastHitsThatMatter.indexOf(candidateStableId), 1)
			}
		}

		svg.selectAll('.arrow')
			.filter((gene) => {
				if (allBlastHitsThatMatter.indexOf(gene.stable_id) !== -1 &&
						gene.getLastGroup() !== currentGroup &&
						listOfSelected.indexOf(gene.stable_id) === -1
					)
					return true
			})
			.style('fill', (gene) => {
				gene.addGroup(currentGroup)
				listOfSelected.push(gene.stable_id)
				findHomologs(gene, svg, value)
				console.log(`turning on: ${gene.stable_id}`)
				return gene.getColorFill()
			})

		svg.selectAll('.arrow')
			.filter((gene) => {
				return gene.getLastGroup() === currentGroup
			})
			.filter((gene) => {
				return allBlastHitsThatMatter.indexOf(gene.stable_id) === -1
			})
			.style('fill', (gene) => {
				console.log(`turning off: ${gene.stable_id}`)
				console.log(gene)
				gene.popGroup()
				return gene.getColorFill()
			})
	}
	else {
		listOfSelected = []
		allBlastHitsThatMatter = []
	}
}

function toggleGeneSelection_(svg, gene) {
	console.log('before')
	console.log(gene)
	if (mouseover) {
		selected = gene
		if (gene.getLastGroup() === groupZero) {
			currentGroup = makeNewGroup(colorValue)
			selected.addGroup(currentGroup)
		}
		else {
			currentGroup = gene.getLastGroup()
		}
		svg.selectAll('.arrow')
			.filter((arrow) => {
				return arrow.stable_id === gene.stable_id
			})
			.style('stroke', 'red')
			.style('fill', selected.getColorFill())
		svg.selectAll('.arrow')
			.filter((arrow) => {
				return arrow.stable_id !== gene.stable_id
			})
			.on('click', () => {
				return false
			})
		svg.selectAll('.arrow').on('mouseover', (g) => {
			d3.select('#compTip').style('display', 'table-cell')
			displayGeneInfo_(g, '#compTip')
		})
		mouseover = false
		findHomologs(gene, svg, currentEvalue)
	}
	else {
		selected = false
		svg.selectAll('.arrow')
			.filter((arrow) => {
				return arrow.stable_id === gene.stable_id
			})
			.style('stroke', 'black')
		svg.selectAll('.arrow')
			.filter((arrow) => {
				return arrow.stable_id !== gene.stable_id
			})
			.on('click', (arrow) => {
				toggleGeneSelection_(svg, arrow)
			})
		svg.selectAll('.arrow').on('mouseover', (gene) => {
			d3.select('#compTip').style('display', 'none')
			displayGeneInfo_(gene, '#divTip')
		})
		mouseover = true
		currentGroup = groupZero
	}
	console.log('after')
	console.log(gene)
}

function displayGeneInfo_(gene, tipId) {
	const divtip = d3.select(tipId)
	let httpDefaultOptions = {
		method: 'GET',
		hostname: 'api.mistdb.com',
		headers: {},
		agent: false
	}
	const genomes = new mist3.Genomes(httpDefaultOptions, 'error')
	let organismName = ''
	const DA = `<img src="http://seqdepot.net/api/v1/aseqs/${gene.aseq_id}.png">`
	genomes.getGenomeInfoByVersion(gene.stable_id.split('-')[0]).then((info) => {
		organismName = info.name
		divtip.transition()
		const names = gene.names ? gene.names.join(',') : ''
		divtip.html(`<h>Organism: ${organismName}<br/>Stable ID: ${gene.stable_id}<br/>locus: ${gene.locus}<br/>Old locus: ${gene.old_locus}<br/>Description: ${gene.product}</br>${DA}</br>${gene.groups}</h>`)
	})
}

function alignClusters(svg, gns, x0, widthGN) {
	let mostLeft = 10^6 //a large number
	gns.forEach((gn) => {
		const box = svg.selectAll('.arrow')
		.filter((gene) => {
			return gene.stable_id === gn.ref
		})
		.node()
		.getBBox()

		if (box.x < mostLeft)
			mostLeft = box.x
	})

	gns.forEach((gn, i) => {
		const box = svg.selectAll('.arrow')
		.filter((gene) => {
			return gene.stable_id === gn.ref
		})
		.node()
		.getBBox()

		const dx = -1 * (box.x - mostLeft - x0 - widthGN/2)
		svg.select(`#GN${i}`).selectAll('.arrow')
			.attr('transform', `translate(${dx}, 0)`)
		svg.select(`#GN${i}`).selectAll('.arrowText')
			.attr('transform', function(gene) {
				const y = gene.textPos.y
				const x = gene.textPos.x + dx
				return `translate(${x} ${y}) rotate(${geneNameInclination}) `
			})
	})
}

function reScaleClusters(svg, widthGN) {
	svg.selectAll('.arrow')
	.each(function(gene) {
		const thisBox = svg.selectAll('.arrow')
			.filter((gene2) => {
				return gene === gene2
			})
			.node()
			.getBBox()

		const rightBound = thisBox.x + thisBox.width
		const leftBound = thisBox.x
		if (ultimatelyMostRight < rightBound)
			ultimatelyMostRight = rightBound
		if (ultimatelyMostLeft > leftBound)
			ultimatelyMostLeft = leftBound
	})

	const reScaleFactor = widthGN / (ultimatelyMostRight - ultimatelyMostLeft)
	console.log(reScaleFactor)
	svg.selectAll('.arrow')
		.attr('transform', `scale(${reScaleFactor} 0)`)
}

module.exports = {
	drawGeneCluster,
	changeSelectionColor,
	alignClusters,
	reScaleClusters
}
