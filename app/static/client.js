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
		el('analyze-button').innerHTML = 'Analyzing...';
	} else {
		alert('Please select an image url')
	}
	var loc = window.location;
	var xhr = new XMLHttpRequest();
	var classify_url = `${loc.protocol}//${loc.hostname}:${loc.port}/classify-url?url=` + url;
	xhr.open('GET', classify_url, true);
    xhr.onerror = function() {alert (xhr.responseText);}
    xhr.onload = function(e) {
        if (this.readyState === 4) {
            var response = JSON.parse(e.target.responseText);
            el('result-label').innerHTML = `Genre #1 = ${response['genre_1']}<br/>
            Genre #2 = ${response['genre_2']}<br/>
            Genre #3 = ${response['genre_3']}`;
            el('playlist').src = response.playlist
        }
        el('analyze-button').innerHTML = 'Analyze';
    }
	
	xhr.send();
	
	
}

function analyze() {
    var uploadFiles = el('file-input').files;
    if (uploadFiles.length == 0) alert('Please select 1 file to analyze!');

    el('analyze-button').innerHTML = 'Analyzing...';
    var xhr = new XMLHttpRequest();
    var loc = window.location
    xhr.open('POST', `${loc.protocol}//${loc.hostname}:${loc.port}/analyze`, true);
    xhr.onerror = function() {alert (xhr.responseText);}
    xhr.onload = function(e) {
        if (this.readyState === 4) {
            var response = JSON.parse(e.target.responseText);
            el('result-label').innerHTML = `Genre #1 = ${response['genre_1']}<br/>
            Genre #2 = ${response['genre_2']}<br/>
            Genre #3 = ${response['genre_3']}`;
            el('playlist').src = response.playlist
        }
        el('analyze-button').innerHTML = 'Analyze';
    }

    var fileData = new FormData();
	fileData.append('file', uploadFiles[0]);
    xhr.send(fileData);
}

