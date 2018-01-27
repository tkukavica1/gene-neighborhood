'use strict'

const commandExistsSync = require('command-exists').sync
const childProcess = require('child_process')
const bunyan = require('bunyan')

const kDefault = {
	steps: {
		db: 'makeblastdb',
		engine: 'blastp'
	},
	params: {
		db: {
			dbtype: 'prot'
		},
		engine: {
			num_threads: 10,
			outfmt: '\"6 qseqid sseqid bitscore evalue qlen length qcovs slen\"',
			evalue: 0.01,
			max_target_seqs: 100000
		}
	},
	fileNames: {
		fasta: 'geneHood.fa',
		dbname: 'gndb',
		output: 'blastp.genehood.dat'
	}
}

module.exports =
class BlastHelper {
	constructor(fileNames = kDefault.fileNames, steps = kDefault.steps, params = kDefault.params) {
		this.checkCommands_ = false
		this.steps_ = steps
		this.params_ = params
		this.fileNames_ = fileNames
		this.instructions_ = {}
		this.log = bunyan.createLogger({name: 'genehood-blast'})
	}

	checkThirdParty() {
		for (let key in this.steps_) {
			const command = this.steps_[key]
			if (!commandExistsSync(command)) {
				this.log.error(`${command} does not exist.`)
				throw new Error(`The program ${command} is not installed or not in PATH.`)
			}
		}
		this.checkCommands_ = true
		this.log.info('All commands needed exist, moving on')
		return this.checkCommands_
	}

	generateCommands(fastaFileName = this.fileNames_.fasta, dbFileName = this.fileNames_.dbname, outputFileName = this.fileNames_.output, steps = this.steps_, params = this.params_) {
		this.log.info('Generating Homolog search steps')
		for (let cKey in steps) {
			let commandLine = steps[cKey]
			if (cKey === 'db')
				commandLine += ` -in ${fastaFileName} -out ${dbFileName}`
			else
				commandLine += ` -db ${dbFileName} -query ${fastaFileName} -out ${outputFileName}`
			for (let pKey in params[cKey])
				commandLine += ` -${pKey} ${params[cKey][pKey]}`
			this.instructions_[cKey] = commandLine
		}
	}

	runCommand(type) {
		return new Promise((resolve, reject) => {
			this.log.info(`Running command: ${this.instructions_[type]}`)
			const dbproc = childProcess.exec(this.instructions_[type])
			let message = ''
			dbproc.stdout.on('data', (data) => {
				message = data.toString()
			})
			dbproc.stderr.on('data', (data) => {
				message = data.toString()
			})
			dbproc.on('error', reject)
			dbproc.on('close', (code) => {
				if (code === 0)
					resolve(message)
				else
					reject(message)
			})
		})
	}

	runCommands() {
		this.instructions_.forEach((command) => {
			this.log.info(`Running command: ${command}`)
			const proc = childProcess.spawn(command)
			
		})
	}

}
