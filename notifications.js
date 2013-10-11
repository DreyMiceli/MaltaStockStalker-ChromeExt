document.addEventListener('DOMContentLoaded', 
function(){
    var data = window.location.hash.substr(1);
    data = JSON.parse(decodeURIComponent(data));
    
	
	document.getElementById('Title').innerHTML = 'News ' + data.stockName;
	document.getElementById('URLDetails').href = data.url;
	document.getElementById('URLDetails').innerHTML = data.name;

});