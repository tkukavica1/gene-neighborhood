/* eslint-env browser */
'use strict'

const d3 = require('d3')
let drawGN = null

/**
 * Rearranges clusters based on current node position. Intended as helper function
 * to be used after re-ordering of nodes due to (e.g.) laderrizing.
 *
 * @param {any} node The root node of the subtree that had leaves re-ordered
 * @param {any} leavesArr The array of leaf order BEFORE leaf reordering (leavesArr = node.get_all_leaves())
 * @param {any} paramDrawGN The drawGN passed in upon initial matching for reference use in this file.
 */
function matchNodesAndClusters(node, leavesArr, paramDrawGN) {
	drawGN = paramDrawGN

	let minIndex = 1000000000

	// Find lowest leafIndex
	for (let i = 0; i < leavesArr.length; i++) {
		let currentNodeID = '#tnt_tree_node_treeBox_' + leavesArr[i].property('_id')
		if (d3.select(currentNodeID).attr('leafIndex') < minIndex)
			minIndex = d3.select(currentNodeID).attr('leafIndex')
	}

	minIndex = Number(minIndex)

	leavesArr = node.get_all_leaves()

	for (let i = 0; i < leavesArr.length; i++) {
		let currentNodeID = '#tnt_tree_node_treeBox_' + leavesArr[i].property('_id')
		let newIndex = minIndex + i
		let newTranslateY = newIndex * 55 + 5
		d3.select(currentNodeID).attr('leafIndex', newIndex)
		let currentClusterID = d3.select(currentNodeID).attr('correspondingClusterID')
		d3.select(currentClusterID).transition()
			.duration(500)
			.attr('transform', 'translate(0, ' + newTranslateY + ')')
	}
}

/**
 * Checks if the clusters underneath the selected node can be aligned by checking if the reference gene
 * of each cluster is a member of at least one homologue group.
 * 
 * @param {any} node The node whose sub-nodes' clusters are to be checked for possibility of alignment.
 * 
 * @returns True if alignment is possible, false if it is not.
 */
function canAlign(node) {
	let leavesArr = node.get_all_leaves()
	for (let i = 0; i < leavesArr.length; i++) {
		let currentNodeID = '#tnt_tree_node_treeBox_' + leavesArr[i].property('_id')
		let currentClusterID = d3.select(currentNodeID).attr('correspondingClusterID')
		let currentClusterNum = Number(currentClusterID.substring(3))
		let refIndex = drawGN.geneHoodObject.gns[currentClusterNum].ref
		if (drawGN.geneHoodObject.genes[refIndex].groups.groups_.length < 2)
			return false
	}
	console.log(drawGN.geneHoodObject)
	return true
}

exports.matchNodesAndClusters = matchNodesAndClusters
exports.canAlign = canAlign
