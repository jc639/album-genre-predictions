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
            el('genre1').checked = true;
            el('genre2').checked = false;
            el('genre3').checked = false;
            el('genre1-label').innerHTML = `${response['genre_1']}`;
			el('genre2-label').innerHTML = `${response['genre_2']}`;
            el('genre3-label').innerHTML = `${response['genre_3']}`;
			el('danceability').value = `${response['target_danceability']}`;
			el('energy').value = `${response['target_energy']}`;
			el('loudness').value = `${response['target_loudness']}`;
            el('speechiness').value = `${response['target_speechiness']}`;
            el('acousticness').value = `${response['target_acousticness']}`;
            el('instrumentalness').value = `${response['target_instrumentalness']}`;
            el('liveness').value = `${response['target_liveness']}`;
            el('valence').value = `${response['target_valence']}`;
            el('tempo').value = `${response['target_tempo']}`;
            el('popularity').value = '50';
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
    xhr.onerror = function() {
		alert (xhr.responseText);
		};
    xhr.onload = function(e) {
        if (this.readyState === 4) {
            var response = JSON.parse(e.target.responseText);
            el('genre1').checked = true;
            el('genre2').checked = false;
            el('genre3').checked = false;
            el('genre1-label').innerHTML = `${response['genre_1']}`;
			el('genre2-label').innerHTML = `${response['genre_2']}`;
            el('genre3-label').innerHTML = `${response['genre_3']}`;
			el('danceability').value = `${response['target_danceability']}`;
			el('energy').value = `${response['target_energy']}`;
			el('loudness').value = `${response['target_loudness']}`;
            el('speechiness').value = `${response['target_speechiness']}`;
            el('acousticness').value = `${response['target_acousticness']}`;
            el('instrumentalness').value = `${response['target_instrumentalness']}`;
            el('liveness').value = `${response['target_liveness']}`;
            el('valence').value = `${response['target_valence']}`;
            el('tempo').value = `${response['target_tempo']}`;
            el('popularity').value = '50';
        }
        el('analyze-button').innerHTML = 'Analyze';
    }

    var fileData = new FormData();
	fileData.append('file', uploadFiles[0]);
    xhr.send(fileData);
}

function createPlaylist() {
	
	el('playlist-button').innerHTML = 'Creating...';
    var xhr = new XMLHttpRequest();
    var loc = window.location
    xhr.open('POST', `${loc.protocol}//${loc.hostname}:${loc.port}/create-playlist`, true);
    xhr.onerror = function() {
		alert (xhr.responseText);
		};
    xhr.onload = function(e) {
        if (this.readyState === 4) {
            var response = JSON.parse(e.target.responseText);
            el('playlist').src = `${response['playlist']}`;
        }
        el('playlist-button').innerHTML = 'Create Playlist';
    }
	
	var genreList = [];
	
	if (el('genre1').checked) {
		genreList.push(el('genre1-label').innerHTML.split("(")[0].trimRight());
	}
	
	if (el('genre2').checked) {
		genreList.push(el('genre2-label').innerHTML.split("(")[0].trimRight());
	}
	
	if (el('genre3').checked) {
		genreList.push(el('genre3-label').innerHTML.split("(")[0].trimRight());
	}
	
	if (genreList.length == 0){
		alert ("Please choose a genre");
	}

    var playlistData = new FormData();
	playlistData.append('danceability', el('danceability').value);
	playlistData.append('danceability-on', el('danceability-check').checked);
	playlistData.append('energy', el('energy').value);
	playlistData.append('energy-on', el('energy-check').checked);
	playlistData.append('loudness', el('loudness').value);
	playlistData.append('loudness-on', el('loudness-check').checked);
	playlistData.append('speechiness', el('speechiness').value);
	playlistData.append('speechiness-on', el('speechiness-check').checked);
	playlistData.append('acousticness', el('acousticness').value);
	playlistData.append('acousticness-on', el('acousticness-check').checked);
	playlistData.append('instrumentalness', el('instrumentalness').value);
	playlistData.append('instrumentalness-on', el('instrumentalness-check').checked);
	playlistData.append('liveness', el('liveness').value);
	playlistData.append('liveness-on', el('liveness-check').checked);
	playlistData.append('valence', el('valence').value);
	playlistData.append('valence-on', el('valence-check').checked);
	playlistData.append('tempo', el('tempo').value);
	playlistData.append('tempo-on', el('tempo-check').checked);
	playlistData.append('popularity', el('popularity').value);
	playlistData.append('popularity-on', el('popularity-check').checked);
	playlistData.append('genres', genreList);
	
    xhr.send(playlistData);
}

function copyPlaylist() {
	var text = el('playlist').src;
	text = text.split("/");
	text = Array("https://open.spotify.com", text[6], text[7]).join("/");
	copyTextToClipboard(text);
	var tooltip = el("myTooltip");
	tooltip.innerHTML = "Copied";
}

function outFunc() {
  var tooltip = document.getElementById("myTooltip");
  tooltip.innerHTML = "Copy to clipboard";
}

function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

  //
  // *** This styling is an extra step which is likely not required. ***
  //
  // Why is it here? To ensure:
  // 1. the element is able to have focus and selection.
  // 2. if element was to flash render it has minimal visual impact.
  // 3. less flakyness with selection and copying which **might** occur if
  //    the textarea element is not visible.
  //
  // The likelihood is the element won't even render, not even a
  // flash, so some of these are just precautions. However in
  // Internet Explorer the element is visible whilst the popup
  // box asking the user for permission for the web page to
  // copy to the clipboard.
  //

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}


