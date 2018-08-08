'use strict'

module.exports =
class GeneHoodObject {
	constructor(data = {genes: [], gns: [], simLinks: [], phylo: null}) {
		this.genes = data.genes
		this.gns = data.gns
		this.simLinks = data.simLinks
		this.phylo = data.phylo
	}

	getSpan(entry) {
		const span = {
			left: 0,
			right: 0,
			center: 0
		}
		const refGene = entry.gn.filter((items) => {
			return items.stable_id === entry.ref
		})[0]
		span.center = refGene.start
		if (entry.refStrand === '+') {
			span.center = refGene.start
			span.left = refGene.start - entry.gn[0].start
			span.right = entry.gn[entry.gn.length - 1].stop - refGene.start
		}
		else {
			span.center = refGene.stop
			span.left = entry.gn[entry.gn.length - 1].stop - refGene.stop
			span.right = refGene.stop - entry.gn[0].start
		}
		return span
	}

	build(gnData, nodesNlinks, phyloTree) {
		this.phylo = phyloTree
		this.simLinks = nodesNlinks.links
		nodesNlinks.nodes = this.reformatNodes_(nodesNlinks.nodes)
		gnData.forEach((entry) => {
			const cluster = []
			const span = this.getSpan(entry)
			entry.gn.forEach((geneEntry) => {
				if (this.genes.indexOf(geneEntry) === -1)
					this.genes.push(geneEntry)
				if (nodesNlinks.nodes.indexOf(geneEntry.stable_id) === -1)
					nodesNlinks.nodes.push(geneEntry.stable_id)
				cluster.push(nodesNlinks.nodes.indexOf(geneEntry.stable_id))
			})
			const gn = {
				ref: nodesNlinks.nodes.indexOf(entry.ref),
				refStrand: entry.refStrand,
				cluster,
				span
			}
			this.gns.push(gn)
		})
		this.reorderGenes_(nodesNlinks.nodes)
	}

	export() {
		return {
			genes: this.genes,
			gns: this.gns,
			simLinks: this.simLinks,
			phylo: this.phylo
		}
	}

	reorderGenes_(nodesRef) {
		const newGenes = []
		nodesRef.forEach((node) => {
			const gene = this.genes.filter((g) => {
				return g.stable_id === node
			})
			newGenes.push(gene[0])
		})
		this.genes = newGenes
	}

	reformatNodes_(nodes) {
		const newNodes = []
		nodes.forEach((node) => {
			newNodes.push(node.split('|')[1])
		})
		return newNodes
	}

	getGene(i) {
		return this.genes[i]
	}

}
