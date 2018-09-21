/* eslint-env browser */
'use strict'

const d3 = require('d3'),
	mgca = require('mgca')
let drawGN = null,
	clusterIDs = {},
	homologueIDs = {},
	gapCounter = 0

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
	homologueIDs = {} // Holds homologue group has as key (string), program assigned number used in MGCA alignment as value
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
		d3.select('#GN' + currentClusterNum).selectAll('.gene' + key)
			.attr('alignID', clusterIDs[key])
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
				d3.select('#GN' + currentClusterNum).selectAll('.gene' + key)
					.attr('alignID', clusterIDs[key])
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
				d3.select('#GN' + currentClusterNum).selectAll('.gene' + key)
					.attr('alignID', clusterIDs[key])
			}
			catch (error) {
				success = false
			}
		}
		if (currentClusterObj.refStrand === '+')
			currentRow.reverse()
		clusterMatrix.push(currentRow)
	}
	console.log('Reached here')
	console.log(clusterMatrix)
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

function displayAlignmentResult(node) {
	let leavesArr = node.get_all_leaves()
	try {
		for (let i = 0; i < leavesArr.length; i++) {
			let currentNodeID = '#tnt_tree_node_treeBox_' + leavesArr[i].property('_id')
			let currentClusterID = d3.select(currentNodeID).attr('correspondingClusterID')
			let currentClusterNum = Number(currentClusterID.substring(3))
			let currentClusterObj = drawGN.geneHoodObject.gns[currentClusterNum]
			for (let j = 0; j < currentClusterObj.cluster.length; j++) {
				let selection = d3.select(currentClusterID).select('.gene' + currentClusterObj.cluster[j])
				if (selection.attr('alignID') === 'none')
					selection.style('display', 'none')
				selection.attr('xTranslate', 0) // Easy access to x-component of translation
				d3.select(currentClusterID).selectAll('text')
					.style('display', 'none')
				// Hiding the display of genes in the relevant cluster that are not involved in the alignment.
			}
			// drawGap(currentClusterID, '.gene258', 100)
		}
		let clusterMatrix = node.property('alignment').clusterMatrix
		console.log(clusterMatrix)
		console.log(drawGN.geneHoodObject)
		console.log(clusterIDs)
		console.log(homologueIDs)
		for (let i = 0; i < leavesArr.length; i++) {
			let clusterResult = clusterMatrix[i]
			let currentNodeID = '#tnt_tree_node_treeBox_' + leavesArr[i].property('_id')
			let currentClusterID = d3.select(currentNodeID).attr('correspondingClusterID')
			let currentClusterNum = Number(currentClusterID.substring(3))
			let currentClusterObj = drawGN.geneHoodObject.gns[currentClusterNum]
			let currentClusterRefID = clusterIDs[currentClusterObj.ref]
			let index = 0
			for (let j = 0; j < clusterResult.length; j++) {
				if (clusterResult[j] === currentClusterRefID) {
					index = j
					break
				}
			}
			for (let j = index + 1; j < clusterResult.length; j++) {
				if (clusterResult[j] === '-') {
					let addition = ''
					if (clusterResult[j - 1] === '-')
						addition = 'GAP'
					else
						addition = findPrecedingGene(currentClusterObj, clusterResult[j - 1])
					let shiftWidth = drawGap(currentClusterID, '.gene' + addition, findLongestWidthInColumn(currentClusterID, leavesArr, clusterMatrix, j), 'right')
					// NEED TO SHIFT OVER GENES
					shiftGenesRight(currentClusterNum, clusterResult, j, shiftWidth)
				}
			}
			for (let j = index - 1; j >= 0; j--) {
				if (clusterResult[j] === '-') {
					let addition = ''
					if (clusterResult[j + 1] === '-')
						addition = 'GAP'
					else
						addition = findPrecedingGene(currentClusterObj, clusterResult[j + 1])
					let shiftWidth = drawGap(currentClusterID, '.gene' + addition, findLongestWidthInColumn(currentClusterID, leavesArr, clusterMatrix, j), 'left')
					// NEED TO SHIFT OVER GENES
				}
			}
		}
	}
	catch (err) {
		console.log('Failed to display alignment result.')
	}
}

/**
 * Finds the true ID of the gene in a given cluster using the clusterIDs dictionary.
 *
 * @param {any} clusterObject The cluster object to be searched.
 * @param {any} prevID The ID used in the alignment for the desired gene.
 *
 * @returns The true ID of the specified gene.
 */
function findPrecedingGene(clusterObject, prevID) {
	for (let key in clusterIDs) {
		if (clusterIDs[key] === prevID) {
			for (let i = 0; i < clusterObject.cluster.length; i++) {
				if (clusterObject.cluster[i] === Number(key))
					return Number(key)
			}
		}
	}
	console.log('Error: Could not find previous gene.')
	return ''
}

/**
 * Helper function that uses the MGCA result to find the width of the widest (longest) gene in a given column (helps in deciding gap width)
 *
 * @param {any} clusterID ID of the current cluster
 * @param {any} leavesArr Ordered array of all leaves from the aligned node's subtree.
 * @param {any} clusterMatrix Resulting matrix generated by MGCA.
 * @param {any} index The column to be searched.
 * 
 * @returns The width of the widest gene in the given column.
 */
function findLongestWidthInColumn(clusterID, leavesArr, clusterMatrix, index) {
	let longestWidth = 0
	for (let i = 0; i < clusterMatrix.length; i++) {
		let currentNodeID = '#tnt_tree_node_treeBox_' + leavesArr[i].property('_id')
		let currentClusterID = d3.select(currentNodeID).attr('correspondingClusterID')
		let currentClusterNum = Number(currentClusterID.substring(3))
		let currentClusterObj = drawGN.geneHoodObject.gns[currentClusterNum]
		if (clusterMatrix[i][index] !== '-') {
			let addition = findPrecedingGene(currentClusterObj, clusterMatrix[i][index])
			if (d3.select(currentClusterID).select('.gene' + addition).node().getBBox().width > longestWidth)
				longestWidth = d3.select(currentClusterID).select('.gene' + addition).node().getBBox().width
		}
	}
	return longestWidth
}

function shiftGenesRight(currentClusterNum, clusterResult, index, shiftWidth) {
	for (let i = index + 1; i < clusterResult.length; i++) {
		if (clusterResult[i] !== '-') {
			let currentTranslate = d3.select('#GN' + currentClusterNum)
				.select('.gene' + findPrecedingGene(drawGN.geneHoodObject.gns[currentClusterNum], clusterResult[i]))
				.attr('shift-x')
			let newX = d3.select('#GN' + currentClusterNum)
				.select('.gene' + findPrecedingGene(drawGN.geneHoodObject.gns[currentClusterNum], clusterResult[i]))
				.attr('shift-x', currentTranslate + shiftWidth)
			d3.select('#GN' + currentClusterNum)
				.select('.gene' + findPrecedingGene(drawGN.geneHoodObject.gns[currentClusterNum], clusterResult[i]))
				.attr('transform', 'translate(' + newX + ', 0)')
		}
	}
}

/**
 * Draws a gap of desired width and location in the SVG.
 *
 * @param {any} currentClusterID The ID of the current cluster.
 * @param {any} precedingGeneClass The class of the preceding gene. (Gaps have the class .geneGAP)
 * @param {any} length The desired length of the gap.
 * @param {any} direction The side of the preceding gene to place the gap on ('left' or 'right' accepted).
 *
 * @returns Width of the created gap.
 */
function drawGap(currentClusterID, precedingGeneClass, length, direction) {
	let padding = 2 // Padding so gaps don't visually touch arrows
	let gapOffset = 0
	if (precedingGeneClass === '.geneGAP')
		gapOffset += 2
	if (direction === 'right') {
		d3.select(currentClusterID)
			.insert('line', precedingGeneClass + ' *')
			.attr('id', 'gap' + gapCounter)
			.attr('x1', d3.select(currentClusterID).select(precedingGeneClass)
							.node().getBBox().x + d3.select(currentClusterID).select(precedingGeneClass)
							.node().getBBox().width + padding + gapOffset)
			.attr('y1', d3.select(currentClusterID).select(precedingGeneClass)
				.node()
				.getBBox().y + d3.select(currentClusterID).select(precedingGeneClass)
				.node()
				.getBBox().height / 2)
			.attr('x2', d3.select(currentClusterID).select(precedingGeneClass)
					.node().getBBox().x + d3.select(currentClusterID).select(precedingGeneClass)
					.node().getBBox().width + length - padding + gapOffset)
			.attr('y2', d3.select(currentClusterID).select(precedingGeneClass)
				.node()
				.getBBox().y + d3.select(currentClusterID).select(precedingGeneClass)
				.node()
				.getBBox().height / 2)
			.attr('stroke', 'black')
			.attr('stroke-width', 3)
			.attr('class', 'geneGAP')
		gapCounter++
		console.log(d3.select('#gap' + (gapCounter - 1)).node()
		.getBBox().width)
		return d3.select('#gap' + (gapCounter - 1)).node()
				.getBBox().width + padding * 2
	}
	else if (direction === 'left') {
		d3.select(currentClusterID)
			.insert('line', precedingGeneClass + ' *')
			.attr('id', 'gap' + gapCounter)
			.attr('x1', d3.select(currentClusterID).select(precedingGeneClass)
							.node().getBBox().x - padding - gapOffset)
			.attr('y1', d3.select(currentClusterID).select(precedingGeneClass)
				.node()
				.getBBox().y + d3.select(currentClusterID).select(precedingGeneClass)
				.node()
				.getBBox().height / 2)
			.attr('x2', d3.select(currentClusterID).select(precedingGeneClass)
					.node().getBBox().x - length + padding - gapOffset)
			.attr('y2', d3.select(currentClusterID).select(precedingGeneClass)
				.node()
				.getBBox().y + d3.select(currentClusterID).select(precedingGeneClass)
				.node()
				.getBBox().height / 2)
			.attr('stroke', 'black')
			.attr('stroke-width', 3)
		gapCounter++
		return d3.select('#gap' + (gapCounter - 1)).node()
				.getBBox().width + padding * 2
	}
	else {
		console.log('Error: Failed to draw gap because direction is not recognizable.')
		return 0
	}
}

function buildLogo(node) {
	// To be completed
	// REMEMBER: Can access clusterMatrix using node.property
	// IDEA: Use drawGN.makeArrows to make completely new arrows taking in the aligned clusterMatrix.
}

// Exporting functions for use in other files
exports.matchNodesAndClusters = matchNodesAndClusters
exports.canAlign = canAlign
exports.runAlignment = runAlignment
exports.displayAlignmentResult = displayAlignmentResult
