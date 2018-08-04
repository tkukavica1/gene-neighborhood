'use strict'

module.exports =
class GeneHoodObject {
	constructor(data = {genes: [], gns: [], simLinks: [], phylo: null}) {
		this.genes = data.genes
		this.gns = data.gns
		this.simLinks = data.simLinks
		this.phylo = data.phylo
	}

	build(gnData, nodesNlinks, phyloTree) {
		this.phylo = phyloTree
		this.simLinks = nodesNlinks.links
		nodesNlinks.nodes = this.reformatNodes_(nodesNlinks.nodes)
		gnData.forEach((entry) => {
			const gn = {
				ref: nodesNlinks.nodes.indexOf(entry.ref),
				refStrand: gnData.refStrand,
				cluster: []
			}
			entry.gn.forEach((geneEntry) => {
				if (this.genes.indexOf(geneEntry) === -1)
					this.genes.push(geneEntry)
				gn.cluster.push(nodesNlinks.nodes.indexOf(geneEntry.stable_id))
			})
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
}
