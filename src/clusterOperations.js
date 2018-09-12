/* eslint-env browser */
'use strict'

const d3 = require('d3'),
	mgca = require('mgca')
let drawGN = null,
	clusterIDs = {},
	homologueIDs = {}

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
	// Future: Need to account for alignment of alignments.
	let leavesArr = node.get_all_leaves()
	for (let i = 0; i < leavesArr.length; i++) {
		let currentNodeID = '#tnt_tree_node_treeBox_' + leavesArr[i].property('_id')
		let currentClusterID = d3.select(currentNodeID).attr('correspondingClusterID')
		let currentClusterNum = Number(currentClusterID.substring(3))
		let refNum = drawGN.geneHoodObject.gns[currentClusterNum].ref
		if (drawGN.geneHoodObject.genes[refNum].groups.groups_.length < 2)
			return false
	}
	return true
}

/**
 * Runs MGCA on the leaves of the passed node.
 *
 * @param {any} node The node whose subtree's leaves are to be aligned.
 *
 * @returns The result of the alignment
 */
function runAlignment(node) {
	let counter = 1
	let clusterMatrix = []
	clusterIDs = {} // Holds gene number as key (string!), program assigned number used in MGCA alignment as value
	let homologueIDs = {} // Holds homologue group has as key (string), program assigned number used in MGCA alignment as value
	let leavesArr = node.get_all_leaves()
	for (let i = 0; i < leavesArr.length; i++) {
		let currentRow = [] // Row to be added to clusterMatrix representing this gene cluster
		let currentNodeID = '#tnt_tree_node_treeBox_' + leavesArr[i].property('_id')
		let currentClusterID = d3.select(currentNodeID).attr('correspondingClusterID')
		let currentClusterNum = Number(currentClusterID.substring(3))
		let currentClusterObj = drawGN.geneHoodObject.gns[currentClusterNum]
		let refGene = currentClusterObj.ref
		let key = String(refGene)
		let currentGeneGroups = drawGN.geneHoodObject.genes[refGene].groups.groups_
		let hash = currentGeneGroups[currentGeneGroups.length - 1].groupTag_.hash_
		if (key in clusterIDs) {
			currentRow.push(clusterIDs[key])
		}
		else if (hash in homologueIDs) {
			currentRow.push(homologueIDs[hash])
			clusterIDs[key] = homologueIDs[hash]
		}
		else {
			currentRow.push(counter)
			clusterIDs[key] = counter
			homologueIDs[hash] = counter
			counter++
		}
		// drawGN.geneHoodObject.genes[refGene].groups.groups_.length
		let index = currentClusterObj.cluster.indexOf(refGene)
		let temp = index
		let success = true
		while (success) {
			try {
				temp--
				let tryingGene = currentClusterObj.cluster[temp]
				key = String(tryingGene)
				currentGeneGroups = drawGN.geneHoodObject.genes[tryingGene].groups.groups_
				if (currentGeneGroups.length < 2) {
					success = false
					break
				}
				hash = currentGeneGroups[currentGeneGroups.length - 1].groupTag_.hash_
				if (key in clusterIDs) {
					currentRow.push(clusterIDs[key])
				}
				else if (hash in homologueIDs) {
					currentRow.push(homologueIDs[hash])
					clusterIDs[key] = homologueIDs[hash]
				}
				else {
					currentRow.push(counter)
					clusterIDs[key] = counter
					homologueIDs[hash] = counter
					counter++
				}
			}
			catch (error) {
				success = false
			}
		}
		success = true
		temp = index
		while (success) {
			try {
				temp++
				let tryingGene = currentClusterObj.cluster[temp]
				key = String(tryingGene)
				currentGeneGroups = drawGN.geneHoodObject.genes[tryingGene].groups.groups_
				if (currentGeneGroups.length < 2) {
					success = false
					break
				}
				hash = currentGeneGroups[currentGeneGroups.length - 1].groupTag_.hash_
				if (key in clusterIDs) {
					currentRow.unshift(clusterIDs[key])
				}
				else if (hash in homologueIDs) {
					currentRow.unshift(homologueIDs[hash])
					clusterIDs[key] = homologueIDs[hash]
				}
				else {
					currentRow.unshift(counter)
					clusterIDs[key] = counter
					homologueIDs[hash] = counter
					counter++
				}
			}
			catch (error) {
				success = false
			}
		}
		clusterMatrix.push(currentRow)
	}
	console.log(mgca.runMGCA(clusterMatrix))
	return mgca.runMGCA(clusterMatrix)
	// Need to store clusterIDs somehow!
}

/**
 * Get function for the clusterIDs dictionary.
 * 
 * @returns The clusterIDs dictionary generated during most recent alignment
 */
function getClusterIDs() {
	return clusterIDs
}

/**
 * Get function for the homologueIDs dictionary
 * 
 * @returns The homologueIDs dictionary generated during most recent alignment
 */
function getHomologueIDs() {
	return homologueIDs
}

exports.matchNodesAndClusters = matchNodesAndClusters
exports.canAlign = canAlign
exports.runAlignment = runAlignment
