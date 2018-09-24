/* eslint-env browser */
'use strict'

const d3 = require('d3')

function buildLogo(node) {
	setTimeout(function() {
		let nodeID = '#tnt_tree_node_treeBox_' + node.property('_id')
		let nodeYTransform = parseTransform(nodeID)
		console.log(nodeYTransform)
		console.log(node.property('alignment').clusterMatrix)
		let logoID = 'clusterLogo' + node.property('_id')
		d3.select('.geneHoodArea').append('g')
			.attr('class', 'clusterLogo')
			.attr('id', logoID)
			.attr('transform', 'translate(0, ' + nodeYTransform + ')')
			.attr('correspondingNodeID', nodeID)
			.attr('z-index', 100)
		makeArrow('#' + logoID, node)
	}, 500)
}

function makeArrow(logoID, node) {
	let instructions = 'M0,0L100,0'
	d3.select(logoID).append('path')
		.attr('class', 'arrow')
		.attr('d', instructions)
	console.log(node.property('_children')[0])
}

function parseTransform(nodeID) {
	let currTransform = d3.select(nodeID).attr('transform')
	console.log(currTransform)
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
	console.log(YTransform)
	return Number(YTransform)
}

exports.buildLogo = buildLogo
