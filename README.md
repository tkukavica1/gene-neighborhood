# gene-neighborhood
Make gene neighborhood figures

There are 2 parts of this software: the engine and the viewer.

The engine runs as a command line application and depends on NCBI's tool `blastp`. The viewer is an `express` server using `phylogician` and `d3.js` to draw the gene clusters.

## The Engine

`cli-geneHood fasta.fa`

This is all you need. The fasta file does not need to be aligned but it is better if it uses `biowonks` system of sequence headers.

This is what the engine does:

1. Read the fasta file
2. For each sequence, ask MiST3 to bring the neighboring genes
3. For each gene, bring up the sequences.
4. BLAST all vs. all
5. Cluster by BLAST results
6. Output the results in `.json`
