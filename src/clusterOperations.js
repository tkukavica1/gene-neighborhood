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
 */
function matchNodesAndClusters(node, leavesArr) {
	let minIndex = 1000000000

	// Find lowest leafIndex
	for (let i = 0; i < leavesArr.length; i++) {
		if (leavesArr[i].property('leafIndex') < minIndex)
			minIndex = leavesArr[i].property('leafIndex')
	}

	minIndex = Number(minIndex)

	leavesArr = node.get_all_leaves()

	for (let i = 0; i < leavesArr.length; i++) {
		try {
			let newIndex = minIndex + i
			let newTranslateY = newIndex * 55 + 5
			leavesArr[i].property('leafIndex', newIndex)
			let currentClusterID = leavesArr[i].property('correspondingClusterID')
			d3.select(currentClusterID).transition()
				.duration(500)
				.attr('transform', 'translate(0, ' + newTranslateY + ')')
			try {
				let xTranslate = d3.select('#clusterLogo' + leavesArr[i].property('_id')).attr('x-translate')
				d3.select('#clusterLogo' + leavesArr[i].property('_id')).transition()
					.duration(500)
					.attr('transform', 'translate(' + xTranslate + ', ' + newTranslateY + ')') // Need to change 0 to the same x translate as before
			}
			catch (err) {
				// Checking if each node in the subtree has a corresponding cluster logo
			}
		}
		catch (err) {
			console.log('Caught an error.')
		}
	}
}

function matchNodesAndClustersCollapsed(tree, node, leavesArr, type) {
	let minIndex = 1000000000

	let nodeLeavesArr = leavesArr
	if (type === 'uncollapsing')
		nodeLeavesArr = node.get_all_leaves()

	let collapsedIDs = []
	// Find lowest leafIndex in collapsed
	for (let i = 0; i < nodeLeavesArr.length; i++) {
		if (nodeLeavesArr[i].property('leafIndex') < minIndex)
			minIndex = nodeLeavesArr[i].property('leafIndex')
		if (type === 'uncollapsing')
			collapsedIDs.push(nodeLeavesArr[i].property('_id'))
	}

	console.log(collapsedIDs)

	let treeLeavesArr = tree.root().get_all_leaves()

	for (let i = 0; i < treeLeavesArr.length; i++) {
		try {
			if (treeLeavesArr[i].property('leafIndex') > minIndex) {
				if (type === 'collapsing')
					treeLeavesArr[i].property('leafIndex', treeLeavesArr[i].property('leafIndex') - (nodeLeavesArr.length - 1))
				else if (type === 'uncollapsing' && (!collapsedIDs.includes(treeLeavesArr[i].property('_id'))))
					treeLeavesArr[i].property('leafIndex', treeLeavesArr[i].property('leafIndex') + (nodeLeavesArr.length - 1))
				let newTranslateY = treeLeavesArr[i].property('leafIndex') * 55 + 5
				let currentClusterID = treeLeavesArr[i].property('correspondingClusterID')
				d3.select(currentClusterID).transition()
					.duration(500)
					.attr('transform', 'translate(0, ' + newTranslateY + ')')
			}
		}
		catch (err) {
			console.log('Caught an error.')
		}
	}
}

/**
 * Rearranges clusters based on current node position. Intended as helper function
 * to be used after re-ordering of nodes due to (e.g.) laderrizing.
 *
 * @param {any} node The root node of the subtree that had leaves re-ordered
 * @param {any} leavesArr The array of leaf order BEFORE leaf reordering (leavesArr = node.get_all_leaves())
 * @param {any} paramDrawGN The drawGN passed in upon initial matching for reference use in this file.
 */
function firstMatchNodesAndClusters(node, leavesArr, paramDrawGN) {
	drawGN = paramDrawGN
	console.log(drawGN)

	matchNodesAndClusters(node, leavesArr)
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
		try {
			let currentClusterID = leavesArr[i].property('correspondingClusterID')
			let currentClusterNum = Number(currentClusterID.substring(3))
			let refNum = drawGN.geneHoodObject.gns[currentClusterNum].ref
			if (drawGN.geneHoodObject.genes[refNum].groups.groups_.length < 2)
				return false
		}
		catch (err) {
			console.log('Caught an error.')
			return false
		}
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
		let currentClusterID = leavesArr[i].property('correspondingClusterID')
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
			let currentClusterID = leavesArr[i].property('correspondingClusterID')
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
		}
		let clusterMatrix = node.property('alignment').clusterMatrix
		// console.log(clusterMatrix)
		// console.log(drawGN.geneHoodObject)
		// console.log(clusterIDs)
		// console.log(homologueIDs)
		for (let i = 0; i < leavesArr.length; i++) {
			let clusterResult = clusterMatrix[i]
			let currentClusterID = leavesArr[i].property('correspondingClusterID')
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
					shiftGenesLeft(currentClusterNum, clusterResult, j, shiftWidth)
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

/**
 * Shifts genes to the right (should be called each time a new gap is created).
 *
 * @param {any} currentClusterNum The current gene cluster number.
 * @param {any} clusterResult The relevant array from MGCA clusterMatrix for this cluster.
 * @param {any} index The index after which all genes should be shifted right.
 * @param {any} shiftWidth The width of the shift.
 */
function shiftGenesRight(currentClusterNum, clusterResult, index, shiftWidth) {
	for (let i = index + 1; i < clusterResult.length; i++) {
		if (clusterResult[i] !== '-') {
			let precedingGene = findPrecedingGene(drawGN.geneHoodObject.gns[currentClusterNum], clusterResult[i])
			let currentTranslate = d3.select('#GN' + currentClusterNum)
				.select('.gene' + precedingGene)
				.attr('shift-x')
			let newX = currentTranslate + shiftWidth
			d3.select('#GN' + currentClusterNum)
				.select('.gene' + precedingGene)
				.attr('shift-x', newX)
			d3.select('#GN' + currentClusterNum)
				.select('.gene' + precedingGene)
				.attr('transform', 'translate(' + newX + ', 0)')
		}
	}
}

/**
 * Shifts genes to the left (should be called each time a new gap is created).
 *
 * @param {any} currentClusterNum The current gene cluster number.
 * @param {any} clusterResult The relevant array from MGCA clusterMatrix for this cluster.
 * @param {any} index The index after which all genes should be shifted left.
 * @param {any} shiftWidth The width of the shift.
 */
function shiftGenesLeft(currentClusterNum, clusterResult, index, shiftWidth) {
	for (let i = index - 1; i >= 0; i--) {
		if (clusterResult[i] !== '-') {
			let precedingGene = findPrecedingGene(drawGN.geneHoodObject.gns[currentClusterNum], clusterResult[i])
			let currentTranslate = d3.select('#GN' + currentClusterNum)
				.select('.gene' + precedingGene)
				.attr('shift-x')
			let newX = currentTranslate - shiftWidth
			d3.select('#GN' + currentClusterNum)
				.select('.gene' + precedingGene)
				.attr('shift-x', newX)
			d3.select('#GN' + currentClusterNum)
				.select('.gene' + precedingGene)
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
		return d3.select('#gap' + (gapCounter - 1)).node()
				.getBBox().width + padding * 2
	}
	else if (direction === 'left') {
		d3.select(currentClusterID)
			.insert('line', precedingGeneClass + ' *')
			.attr('id', 'gap' + gapCounter)
			.attr('x1', d3.select(currentClusterID).select(precedingGeneClass)
							.node().getBBox().x - (padding + 1) - gapOffset)
			.attr('y1', d3.select(currentClusterID).select(precedingGeneClass)
				.node()
				.getBBox().y + d3.select(currentClusterID).select(precedingGeneClass)
				.node()
				.getBBox().height / 2)
			.attr('x2', d3.select(currentClusterID).select(precedingGeneClass)
					.node().getBBox().x - length + (padding - 1) - gapOffset)
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
	console.log('Error: Failed to draw gap because direction is not recognizable.')
	return 0
}

/**
 * Generates gene cluster logo and modifies SVG display accordingly.
 *
 * @param {any} node The node for whose alignment the gene cluster logo is to be created.
 *
 * @returns First element: x-transform of the ref gene in the first leaf of the node to be collapsed. This will be
 * 			the amount by which the logo gets horizontally translated.
 * 			Second element: ID used in the alignment clusterMatrix for the reference gene in the first leaf of the node
 * 			to be collapsed.
 */
function prepareGenerateLogo(node) {
	turnOffAndResetClusters(node)
	let currClusterID = node.get_all_leaves()[0].property('correspondingClusterID')
	let currClusterNum = Number(currClusterID.substring(3))
	let refGene = drawGN.geneHoodObject.gns[currClusterNum].ref
	let xTransform = d3.select('.gene' + refGene).node()
		.getBBox().x
	// Need to remake leaf indices so clusters follow accordingly
	return [xTransform, clusterIDs[String(refGene)]]
}

/**
 * Sets display to hidden, deletes gaps, and resets transforms of all clusters corresponding to leaves of the passed node.
 *
 * @param {any} node The parent node of the affected subtree.
 */
function turnOffAndResetClusters(node) {
	let leavesArr = node.get_all_leaves()
	for (let i = 0; i < leavesArr.length; i++) {
		let currentNodeID = '#tnt_tree_node_treeBox_' + leavesArr[i].property('_id')
		let corrClusterID = d3.select(currentNodeID).attr('correspondingClusterID')
		d3.select(corrClusterID).style('display', 'none') // Hiding collapsed clusters on the SVG for now
		for (let j = 0; j < 100; j++) {
			// Removing all gaps
			d3.select(corrClusterID).select('line')
				.remove()
		}
		// Next, resetting all shift-x to 0 and translates to 0
		let clusterMatrix = node.property('alignment').clusterMatrix
		for (let i = 0; i < clusterMatrix.length; i++) {
			for (let j = 0; j < clusterMatrix[i].length; j++) {
				let currClusterID = leavesArr[i].property('correspondingClusterID')
				let currClusterNum = Number(currClusterID.substring(3))
				if (clusterMatrix[i][j] !== '-') {
					let precedingGene = findPrecedingGene(drawGN.geneHoodObject.gns[currClusterNum], clusterMatrix[i][j])
					d3.select('#GN' + currClusterNum)
						.select('.gene' + precedingGene)
						.attr('shift-x', 0)
					d3.select('#GN' + currClusterNum)
						.select('.gene' + precedingGene)
						.attr('transform', 'translate(0, 0)')
				}
			}
		}
	}
}

/**
 * Unhides the hidden clusters under a given node.
 *
 * @param {any} node The node whose sub-clusters are to be re-displayed.
 */
function unhideClusters(node) {
	let leavesArr = node.get_all_leaves()
	for (let i = 0; i < leavesArr.length; i++) {
		let currClusterID = leavesArr[i].property('correspondingClusterID')
		let currClusterNum = Number(currClusterID.substring(3))
		let currClusterObj = drawGN.geneHoodObject.gns[currClusterNum].cluster
		for (let j = 0; j < currClusterObj.length; j++) {
			d3.select(currClusterID).select('.gene' + currClusterObj[j])
				.style('display', 'block')
		}
		d3.select(currClusterID).style('display', 'block')
	}
}

function getGHObject() {
	return drawGN.geneHoodObject
}

// Exporting functions for use in other files
exports.matchNodesAndClusters = matchNodesAndClusters
exports.matchNodesAndClustersCollapsed = matchNodesAndClustersCollapsed
exports.firstMatchNodesAndClusters = firstMatchNodesAndClusters
exports.canAlign = canAlign
exports.runAlignment = runAlignment
exports.displayAlignmentResult = displayAlignmentResult
exports.prepareGenerateLogo = prepareGenerateLogo
exports.unhideClusters = unhideClusters
exports.getGHObject = getGHObject
exports.getClusterIDs = getClusterIDs
