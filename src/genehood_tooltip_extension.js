/* eslint-env browser */
'use strict'

const d3 = require('d3'),
	phylogician = require('phylogician'),
	treeOperations = phylogician.treeOperations,
	clusterOperations = require('./clusterOperations.js'),
	tntTooltip = phylogician.tntTooltip,
	tooltipWidth = 120,
	colSpan = 2

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

	// Adding collapsed node button
	let collapseButton = appendButton(tooltip, node.is_collapsed(), 'Uncollapse Node', 'Collapse Node', '#3287d7', 'black')
	collapseButton.on('click', function() {
		treeOperations.toggleNodeProperty(node)
		treeOperations.updateUserChanges(tree)
		d3.select(id)
			.select('.tnt_node_display_elem')
			.attr('fill', 'black')
			.attr('x', -10)
			.attr('y', -9)
		closeTooltip()
	})

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

	// Adding test button
	let testButton = appendButton(tooltip, true, 'Test Button', null, '#3287d7', 'black')
	testButton.on('click', function() {
		console.log('testing button')
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
