/* eslint-env browser */
'use strict'

const d3 = require('d3'),
	phylogician = require('phylogician'),
	treeOperations = phylogician.treeOperations,
	clusterOperations = require('./clusterOperations.js'),
	tntTooltip = phylogician.tntTooltip,
	tooltipWidth = 120,
	colSpan = 2,
	aligned = [] // Array containing IDs of nodes whose subtrees are aligned

function generateTooltip(tree, node, thisSelf) {
	tntTooltip.table(tree, node)
					.width(tooltipWidth)
					.call(thisSelf, {
						header: 'Node: ' + node.property('_id')
					})
	addTooltipButtons(tree, node)
}

function addTooltipButtons(tree, node) {
	let tooltip = d3.select('#tnt_tooltip_1')
	let id = '#tnt_tree_node_treeBox_' + node.id()

	// Adding align button
	let alignButton = appendButton(tooltip, true, 'Align Subtree', null, '#3287d7', 'black')
	// Create node property aligned that is active unless it is uncollapsed in the future?
	if (node.is_collapsed() || !clusterOperations.canAlign(node)) {
		alignButton.style('color', 'gray')
		alignButton.on('mouseover', function() {
			alignButton.style('color', 'gray')
		})
		alignButton.on('mouseout', function() {
			alignButton.style('color', 'gray')
		})
		alignButton.on('click', function() {
			alignButton.style('color', 'red')
		})
	}
	else {
		alignButton.on('click', function() {
			node.property('alignment', clusterOperations.runAlignment(node))
			console.log(node.property('alignment'))
			aligned.push(node.id())
			clusterOperations.displayAlignmentResult(node)
			d3.select(id)
				.select('.tnt_node_display_elem')
				.attr('fill', 'black')
			closeTooltip()
		})
	}

	// Adding collapsed node button
	let collapseButton = appendButton(tooltip, node.is_collapsed(), 'Uncollapse Node', 'Collapse Node', '#3287d7', 'black')
	if (!aligned.includes(node.id())) {
		collapseButton.style('color', 'gray')
		collapseButton.on('mouseover', function() {
			collapseButton.style('color', 'gray')
		})
		collapseButton.on('mouseout', function() {
			collapseButton.style('color', 'gray')
		})
		collapseButton.on('click', function() {
			collapseButton.style('color', 'red')
		})
	}
	else {
		collapseButton.on('click', function() {
			treeOperations.toggleNodeProperty(node)
			if (!node.is_collapsed()) {
				for (let i = 0; i < aligned.length; i++) {
					if (aligned[i] === node.id())
						aligned.splice(i, 1) // Removes from aligned nodes, since no longer aligned and modifications may be made
				}
			}
			treeOperations.updateUserChanges(tree)
			d3.select(id)
				.select('.tnt_node_display_elem')
				.attr('fill', 'black')
				.attr('x', -10)
				.attr('y', -9)
			closeTooltip()
		})
	}

	// Adding ladderize subtree button
	let ladderizeButton = appendButton(tooltip, true, 'Ladderize Subtree', null, '#3287d7', 'black')
	let leavesArr = node.get_all_leaves()
	ladderizeButton.on('click', function() {
		treeOperations.ladderizeSubtree(node)
		treeOperations.updateUserChanges(tree)
		clusterOperations.matchNodesAndClusters(node, leavesArr)
		d3.select(id)
			.select('.tnt_node_display_elem')
			.attr('fill', 'black')
		closeTooltip()
	})

	// Adding rerooting button
	let rerootButton = appendButton(tooltip, true, 'Set As Root', null, '#3287d7', 'black')
	rerootButton.on('click', function() {
		treeOperations.rerootTree(tree, node)
		treeOperations.updateUserChanges(tree)
		clusterOperations.matchNodesAndClusters(tree.root(), tree.root().get_all_leaves())
		d3.select(id)
			.select('.tnt_node_display_elem')
			.attr('fill', 'black')
		closeTooltip()
	})

	// Adding close button
	let closeButton = appendButton(tooltip, true, 'Close', null, '#3287d7', 'black')
	closeButton.on('click', function() {
		d3.select(id)
			.select('.tnt_node_display_elem')
			.attr('fill', 'black')
		closeTooltip()
	})
}

function appendButton(tooltipDiv, boolean, activeText, inactiveText, mouseoverColor, mouseoutColor) {
	let text = activeText
	if (!boolean)
		text = inactiveText
	let newButton = tooltipDiv.select('table')
		.append('tr')
		.attr('class', 'tnt_zmenu_clickable')
		.append('td')
		.attr('colspan', colSpan)
		.text(text)
		.style('text-align', 'center')
		.style('color', mouseoutColor)
	newButton.on('mouseover', function() {
		newButton.style('color', mouseoverColor)
	})
	newButton.on('mouseout', function() {
		newButton.style('color', mouseoutColor)
	})
	return newButton
}

function closeTooltip() {
	if (d3.select('#tnt_tooltip_1')) {
		d3.select('#tnt_tooltip_1').remove()
		d3.selectAll('.tnt_tree_node').selectAll('.tnt_node_display_elem')
			.attr('opacity', 0)
		treeOperations.setNodeClicked(false)
		treeOperations.setPrevNodeID(0)
	}
}

exports.generateTooltip = generateTooltip
