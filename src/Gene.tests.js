'use strict'

const expect = require('chai').expect

const geneHoodPackData = require('../data-test/test.geneHood.pack.json')

const Gene = require('./Gene')

describe('Gene', function() {
	describe('constructor', function() {
		it('should build gene', function() {
			const geneMetadata = geneHoodPackData.genes[0]
			const gene = new Gene(geneMetadata)
			const expectedMetadata = {
				id: 1843007,
				stable_id: 'GCF_000196175.1-BD_RS15515',
				component_id: 13035,
				dseq_id: 'hVYpmSybP8oRpShMD6DnHA',
				aseq_id: 'JV1ajz6qtWCW99QgWGZ8Qg',
				accession: 'WP_011165729',
				version: 'WP_011165729.1',
				locus: 'BD_RS15515',
				old_locus: 'Bd3393',
				location: 'complement(3303805..3305217)',
				strand: '-',
				start: 3303805,
				stop: 3305217,
				length: 1413,
				names: null,
				pseudo: false,
				notes: null,
				product: 'HAMP domain-containing protein',
				codon_start: 1,
				translation_table: 11,
				qualifiers: {},
				cds_location: 'complement(3303805..3305217)',
				cds_qualifiers: {
				 inference: 'COORDINATES: similar to AA sequence:RefSeq:WP_011165729.1'
				},
				ai: {
				 pfam31: [
				  {
				   name: 'HATPase_c',
				   score: 71.3,
				   bias: 0.1,
				   c_evalue: 1e-23,
				   i_evalue: 8.6e-20,
				   hmm_from: 2,
				   hmm_to: 108,
				   hmm_cov: '..',
				   ali_from: 359,
				   ali_to: 467,
				   ali_cov: '..',
				   env_from: 358,
				   env_to: 470,
				   env_cov: '.]',
				   acc: 0.9
				  },
				  {
				   name: 'HAMP',
				   score: 28,
				   bias: 0,
				   c_evalue: 2.4e-10,
				   i_evalue: 0.000002,
				   hmm_from: 2,
				   hmm_to: 48,
				   hmm_cov: '..',
				   ali_from: 194,
				   ali_to: 242,
				   ali_cov: '..',
				   env_from: 193,
				   env_to: 243,
				   env_cov: '..',
				   acc: 0.9
				  }
				 ],
				 agfam2: [
				  {
				   name: 'HK_CA:18',
				   score: 126.5,
				   bias: 0,
				   c_evalue: 1.8e-40,
				   i_evalue: 1.8e-39,
				   hmm_from: 6,
				   hmm_to: 136,
				   hmm_cov: '..',
				   ali_from: 324,
				   ali_to: 451,
				   ali_cov: '..',
				   env_from: 320,
				   env_to: 467,
				   env_cov: '..',
				   acc: 0.94
				  },
				  {
				   name: 'HK_CA:2',
				   score: 120.4,
				   bias: 0,
				   c_evalue: 1.4e-38,
				   i_evalue: 1.3e-37,
				   hmm_from: 6,
				   hmm_to: 159,
				   hmm_cov: '..',
				   ali_from: 318,
				   ali_to: 466,
				   ali_cov: '..',
				   env_from: 314,
				   env_to: 468,
				   env_cov: '..',
				   acc: 0.92
				  },
				  {
				   name: 'HK_CA:1',
				   score: 89.6,
				   bias: 0,
				   c_evalue: 4e-29,
				   i_evalue: 3.9e-28,
				   hmm_from: 8,
				   hmm_to: 173,
				   hmm_cov: '..',
				   ali_from: 320,
				   ali_to: 466,
				   ali_cov: '..',
				   env_from: 314,
				   env_to: 468,
				   env_cov: '..',
				   acc: 0.91
				  },
				  {
				   name: 'HK_CA',
				   score: 88.9,
				   bias: 0,
				   c_evalue: 9.6e-29,
				   i_evalue: 9.3e-28,
				   hmm_from: 1,
				   hmm_to: 129,
				   hmm_cov: '[.',
				   ali_from: 359,
				   ali_to: 466,
				   ali_cov: '..',
				   env_from: 359,
				   env_to: 468,
				   env_cov: '..',
				   acc: 0.91
				  },
				  {
				   name: 'HK_CA:10',
				   score: 86.3,
				   bias: 0,
				   c_evalue: 4.1e-28,
				   i_evalue: 3.9e-27,
				   hmm_from: 6,
				   hmm_to: 154,
				   hmm_cov: '..',
				   ali_from: 318,
				   ali_to: 465,
				   ali_cov: '..',
				   env_from: 314,
				   env_to: 468,
				   env_cov: '..',
				   acc: 0.89
				  },
				  {
				   name: 'HK_CA:5',
				   score: 75.5,
				   bias: 0,
				   c_evalue: 9.4e-25,
				   i_evalue: 9.1e-24,
				   hmm_from: 6,
				   hmm_to: 142,
				   hmm_cov: '..',
				   ali_from: 325,
				   ali_to: 466,
				   ali_cov: '..',
				   env_from: 322,
				   env_to: 468,
				   env_cov: '..',
				   acc: 0.86
				  }
				 ],
				 ecf1: [],
				 id: 'JV1ajz6qtWCW99QgWGZ8Qg',
				 length: 470,
				 sequence: 'MSSSRLKPTLFRISTKLTLAYSLVLILSSTVIFSFLYFQISHGLQEQERGVLSSKLEEYRNRIEVRGLGEFKDYFLYIPNYDRDAALLVSVFSPKGEETYHHEPFPSFKLNMEKLKEEMNRHRGQIFEFAMREMHGGDTIIILGTTLKDGSRLVVGKSTESLSLQLRNLQKIFWWLLLPVALIGFLGGLFLSNRTLSPVRELITSMKKIEGGSLSTRVPIGGSDDELEELKVLFNKMLDKIEGLVSGLKEAFDHLAHDIRTPVTRLRGRAELALTSEGDVESYREALQSCFENSDKILNFLQVLTDITEAENRSKKLKIEKKFISDLVKEIMSLYEMAFEEKDIRVVQKLDSHDWAMVDAKLISRVIANLLDNAHKYTPPGGEVTIETINHTENVIIRVTDSGPGISADEHGMIWQKLYRSDKSRSEYGMGLGLTFVKAVVEAHDGKVSVRIPVKDGHGTEFEVLLQKMS',
				 segs: [],
				 coils: [],
				 tmhmm2: null
				}
			}
			expect(expectedMetadata).eql(gene.metadata)
		})
	})
})
