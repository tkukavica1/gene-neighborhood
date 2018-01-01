'use strict'

window.uploadData = (data) => {
	const fileData = data.files[0]
	const reader = new FileReader()
	reader.onloadend = (event) => {
		if (event.target.readyState === FileReader.DONE) {
			console.log('this')
			console.log(event.target.result)
		}
	}
	reader.readAsText(fileData)
}
