var el = x => document.getElementById(x);

function showPicker(inputId) { el('file-input').click(); }

function showPicked(input) {
    el('upload-label').innerHTML = input.files[0].name;
    var reader = new FileReader();
    reader.onload = function (e) {
        el('image-picked').src = e.target.result;
        el('image-picked').className = '';
    }
    reader.readAsDataURL(input.files[0]);
}

function urlPicker() {
	
	var url = el('image-url').value;
	var res = url.split(".");
	if  (res[res.length - 1].toLowerCase() == 'jpg' || res[res.length - 1].toLowerCase() == 'png') {
		el('image-picked').src = el('image-url').value;
		el('image-picked').className = '';
		el('image-picked').height = '100';
		el('image-picked').width = '100';
		el('upload-label').innerHTML = '';
	} else {
		alert('Please select an image url')
	}
	
}

function analyze() {
    var uploadFiles = el('file-input').files;
	var urlUpload = el('image-url').value;
    if (uploadFiles.length == 0 && urlUpload.length == 0) alert('Please select 1 file to analyze!');

    el('analyze-button').innerHTML = 'Analyzing...';
    var xhr = new XMLHttpRequest();
    var loc = window.location
    xhr.open('POST', `${loc.protocol}//${loc.hostname}:${loc.port}/analyze`, true);
    xhr.onerror = function() {alert (xhr.responseText);}
    xhr.onload = function(e) {
        if (this.readyState === 4) {
            var response = JSON.parse(e.target.responseText);
            el('result-label').innerHTML = `Result = ${response['result']}`;
        }
        el('analyze-button').innerHTML = 'Analyze';
    }

    var fileData = new FormData();
	if (uploadFiles.length == 1 && urlUpload.length == 0){
		fileData.append('file', uploadFiles[0]);
		fileData.append('type', 'file');
	} else if (uploadFiles.length == 0 && urlUpload.length == 1){
		fileData.append('file', urlUpload[0]);
		fileData.append('type', 'url');
	}
	
    ;
    xhr.send(fileData);
}

