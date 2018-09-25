/* eslint-env browser */
'use strict'

const d3 = require('d3'),
	clusterOperations = require('./clusterOperations')

/**
 * Build a gene cluster logo for the subtree of the provided node.
 *
 * @param {any} node The node for which the cluster logo will be generated.
 * @param {any} logoXTransformArr 2-element array with translation instructions for the cluster logo to be generated.
 */
function buildLogo(node, logoXTransformArr) {
	setTimeout(function() {
		let nodeID = '#tnt_tree_node_treeBox_' + node.property('_id')
		let nodeYTransform = parseTransform(nodeID)
		let logoID = 'clusterLogo' + node.property('_id')
		let clusterYTransform = nodeYTransform - 22.5
		let clusterMatrix = node.property('alignment').clusterMatrix
		// Building div that will hold the cluster logo.
		d3.select('.geneHoodArea').append('g')
			.attr('class', 'clusterLogo')
			.attr('id', logoID)
			.attr('transform', 'translate(0, ' + clusterYTransform + ')')
			.attr('correspondingNodeID', nodeID)
		let instructionArr = buildInstructionArray(node)
		let xIndex = 0
		let xTranslate = 0 // Will be used to translate the reference gene at the end
		// Drawing the actual logo from the instructions array.
		for (let i = 0; i < instructionArr.length; i++) {
			let yIndex = 35
			let thisLen = instructionArr[i].length
			for (let key in instructionArr[i]) {
				if (key !== 'length') {
					let geneID = 0
					let clusterIDs = clusterOperations.getClusterIDs()
					for (let ID in clusterIDs) {
						if (clusterIDs[ID] === Number(key)) {
							geneID = Number(ID)
							break
						}
					}
					let geneGroups = clusterOperations.getGHObject().genes[geneID].groups.groups_
					let color = '#' + geneGroups[geneGroups.length - 1].groupTag_.color_
					let height = 25 * instructionArr[i][key] / clusterMatrix.length
					makeRightArrow('#' + logoID, xIndex, yIndex - height, height, thisLen, Number(key), color)
					if (Number(key) === logoXTransformArr[1])
						xTranslate = logoXTransformArr[0] - xIndex
					yIndex -= height
				}
			}
			xIndex += thisLen
		}
		d3.select('#' + logoID).attr('transform', 'translate(' + xTranslate + ', ' + clusterYTransform + ')')
	}, 500)
}

/**
 * Makes an arrow in the right direction.
 *
 * @param {any} logoID SVG ID of the cluster logo under which this arrow will be.
 * @param {any} x The x-coordinate of the starting point (upper left).
 * @param {any} y The y-coordinate of the starting point (upper left).
 * @param {any} h The height of the arrow.
 * @param {any} width The width of the arrow.
 * @param {any} geneGroupNum The number of the gene group that this arrow represents.
 * @param {any} color The color of the arrow (hex value).
 */
function makeRightArrow(logoID, x, y, h, width, geneGroupNum, color) {
	let pt1 = x + ',' + (y + h / 5)
	let pt2 = (x + width * 8 / 11) + ',' + (y + h / 5)
	let pt3 = (x + width * 8 / 11) + ',' + y
	let pt4 = (x + width) + ',' + (y + h / 2)
	let pt5 = (x + width * 8 / 11) + ',' + (y + h)
	let pt6 = (x + width * 8 / 11) + ',' + (y + h - h / 5)
	let pt7 = x + ',' + (y + h - h / 5)
	let instructions = 'M' + pt1 + 'L' + pt2 + 'L' + pt3 + 'L' + pt4 + 'L' + pt5 + 'L' + pt6 + 'L' + pt7 + 'L' + pt1
	d3.select(logoID).append('path')
		.attr('class', 'arrow group' + geneGroupNum)
		.attr('stroke', 'black')
		.attr('stroke-width', 1)
		.attr('fill', color)
		.attr('d', instructions)
}

/**
 * Parses the transform of a given node to find its y transform attribute.
 *
 * @param {any} nodeID The ID of the node to be checked.
 *
 * @returns The y transform attribute of the indicated node.
 */
function parseTransform(nodeID) {
	let currTransform = d3.select(nodeID).attr('transform')
	let YTransform = ''
	let isParsing = false
	for (let i = 10; i < currTransform.length; i++) {
		if (currTransform[i] === ',') {
			isParsing = true
			i++
		}
		else if (isParsing && currTransform[i] === ')') {
			isParsing = false
			break
		}
		if (isParsing)
			YTransform += currTransform[i]
	}
	return Number(YTransform)
}

/**
 * Builds and returns a dictionary based on the provided cluster matrix containing relative widths of
 * each value in the matrix.
 *
 * @param {any} clusterMatrix The cluster matrix for which the dictionary is to be generated.
 *
 * @returns Dictionary with cluster matrix IDs as keys (in string form) and relative pixel widths as values.
 */
function buildWidthDictionary(clusterMatrix) {
	let widthDict = {} // Will be built and returned at end of function
	let clusterIDDict = clusterOperations.getClusterIDs()
	let geneID = 0
	for (let i = 0; i < clusterMatrix.length; i++) {
		for (let j = 0; j < clusterMatrix[i].length; j++) {
			let key = String(clusterMatrix[i][j])
			if (!(key in widthDict) && clusterMatrix[i][j] !== '-') {
				for (let k in clusterIDDict) {
					if (clusterIDDict[k] === clusterMatrix[i][j]) {
						geneID = k
						break
					}
				}
				widthDict[key] = d3.select('.gene' + geneID).node()
					.getBBox().width
			}
		}
	}
	return widthDict
}

/**
 * Generates an instruction array so that a logo can be created for the provided node.
 *
 * @param {any} node The node for which the instruction array will be generated.
 *
 * @returns An array where each element is a dictionary consisting of gene IDs and occurrence frequency
 * 			in each column of the MGCA-generated result matrix.
 */
function buildInstructionArray(node) {
	let widthDictionary = buildWidthDictionary(node.property('alignment').clusterMatrix)
	let clusterMatrix = node.property('alignment').clusterMatrix
	let instructionArr = []
	for (let i = 0; i < clusterMatrix[0].length; i++) {
		let dict = {}
		let maxWidth = 0
		for (let j = 0; j < clusterMatrix.length; j++) {
			if (clusterMatrix[j][i] !== '-') {
				let key = String(clusterMatrix[j][i])
				if (!(key in dict)) {
					dict[key] = 1
					if (widthDictionary[key] > maxWidth)
						maxWidth = widthDictionary[key]
				}
				else {
					dict[key]++
				}
			}
		}
		dict['length'] = maxWidth
		// Need to sort the dict
		instructionArr.push(dict)
		maxWidth = 0
	}
	return instructionArr
}

/**
 * Removes the cluster logo associated with the provided node ID.
 *
 * @param {any} nodeID The node whose cluster logo is to be removed.
 */
function removeLogo(nodeID) {
	d3.select('#clusterLogo' + nodeID).remove()
}

exports.buildLogo = buildLogo
exports.removeLogo = removeLogo
