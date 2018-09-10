/* eslint-env browser */
'use strict'

const d3 = require('d3')

/**
 * Rearranges clusters based on current node position. Intended as helper function
 * to be used after re-ordering of nodes due to (e.g.) laderrizing.
 *
 * @param {any} node The root node of the subtree that had leaves re-ordered
 * @param {any} leavesArr The array of leaf order BEFORE leaf reordering (leavesArr = node.get_all_leaves())
 */
function matchNodesAndClusters(node, leavesArr) {
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

exports.matchNodesAndClusters = matchNodesAndClusters
