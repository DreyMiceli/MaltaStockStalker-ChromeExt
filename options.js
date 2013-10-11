var defaultColor = "blue";

//Events to occur once page is loaded
window.addEventListener('load', 
function() 
	{
		populateIframes('');
		setPollingIcon();
		getListedStock();

		refreshTally.onclick = function() { populateIframes('tally');};
		refreshChart.onclick = function() { populateIframes('chart');};
		refreshNews.onclick = function() { populateIframes('news');};
		refreshNewsArchive.onclick = function() { populateIframes('newsArchive');};
		
		options.stockOption.onchange = function() { saveOptions(); };
		  
		options.enableNotifications.onchange = function() 
		{
			if (document.getElementById("enableNotifications").checked) 
			{
				localStorage["enableNotifications"] = "1";
				
				document.getElementById("notificationSection").removeAttribute("hidden");
			}
			else 
			{ 
				localStorage["enableNotifications"] = "0";
				
				document.getElementById("notificationSection").setAttribute("hidden","");
			}
		};
		
		document.getElementById("lowLevel").onchange = function()
		{
			localStorage["lowLevelNotification"] = document.getElementById("lowLevel").value;
			_gaq.push(['_trackEvent', 'SetLowLevelNotification', localStorage["favStock"], document.getElementById("lowLevel").value]);
		};
		
		
		document.getElementById("highLevel").onchange = function()
		{
			localStorage["highLevelNotification"] = document.getElementById("highLevel").value;
			_gaq.push(['_trackEvent', 'SetHighLevelNotification', localStorage["favStock"], document.getElementById("highLevel").value]);
		};
		  
		// setup ul.tabs to work as tabs for each div directly under div.panes
		$(function() { $("ul.tabs").tabs("div.panes > div");});
	}
);