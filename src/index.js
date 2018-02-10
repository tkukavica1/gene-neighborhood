'use strict'

const GeneHoodViewer = require('./GeneHoodViewer')
const gnhv = new GeneHoodViewer('#GN', '#error')

window.uploadData = (data) => {
	const fileData = data.files[0]
	const reader = new FileReader()
	reader.onloadend = (event) => {
		if (event.target.readyState === FileReader.DONE) {
			gnhv.draw(event.target.result)
		}
	}
	reader.readAsText(fileData)
}

window.changeColor = (value) => {
	gnhv.changeColor(value)
}
