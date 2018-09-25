/* eslint-env browser */
'use strict'

const d3 = require('d3'),
	clusterOperations = require('./clusterOperations')

function buildLogo(node) {
	setTimeout(function() {
		let nodeID = '#tnt_tree_node_treeBox_' + node.property('_id')
		let nodeYTransform = parseTransform(nodeID)
		let logoID = 'clusterLogo' + node.property('_id')
		let clusterYTransform = nodeYTransform - 22.5
		// Building div that will hold the cluster logo.
		d3.select('.geneHoodArea').append('g')
			.attr('class', 'clusterLogo')
			.attr('id', logoID)
			.attr('transform', 'translate(0, ' + clusterYTransform + ')')
			.attr('correspondingNodeID', nodeID)
		let widthDictionary = buildWidthDictionary(node.property('alignment').clusterMatrix)
		console.log(widthDictionary)
		makeArrow('#' + logoID, node, 1)
	}, 500)
}

function makeArrow(logoID, node, geneGroupNumber) {
	let instructions = 'M0,0L100,0'
	d3.select(logoID).append('path')
		.attr('class', 'arrow group' + geneGroupNumber)
		.attr('d', instructions)
		.attr('stroke', 'black')
		.attr('stroke-width', 1)
		.attr('fill', 'red')
	console.log(node.property('_children')[0])
	console.log(clusterOperations.getGHObject())
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

exports.buildLogo = buildLogo
