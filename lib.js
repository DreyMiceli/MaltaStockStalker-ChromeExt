//Variables

var forcePolling = false;
var allowConsoleLogging = false;
var pollInterval = 300; //Seconds

var timeoutHolder;


function trackAppChange(obj) {
	var manifest = chrome.runtime.getManifest();
	localVersion = manifest.version;
	if (obj.reason == 'update')
	{
		_gaq.push(['_trackEvent', 'ClientExtensionVersion', obj.previousVersion + ' >> ' + localVersion, obj.reason]);
	}
	else
	{
		_gaq.push(['_trackEvent', 'ClientExtensionVersion', localVersion, obj.reason]);
	}
}

function trackStartUpEvent() {
	var manifest = chrome.runtime.getManifest();
	localVersion = manifest.version;
	_gaq.push(['_trackEvent', 'ClientExtensionVersion', localVersion, 'started']);
}

function updateApp() {
	chrome.runtime.onUpdateAvailable.addListener(function() { chrome.runtime.reload(); });
}

function getNewsQty() {

//On stock Selected get count of released News and save it in local store.

//Scan if the amount of news have been updated

//if new items display notification

	var url = 'http://www.borzamalta.com.mt/uploads/graphical/amstock/data/events_' + localStorage["favStock"] + '.xml';
	
    var jax = new XMLHttpRequest();
	
	jax.open("GET",url, true);
	
	jax.setRequestHeader("Pragma","no-cache");
	jax.setRequestHeader("cache-Control","no-cache, must-revalidate");
	jax.setRequestHeader("Expires","Mon, 12 Jul 2010 03:00:00 GMT");
	
	jax.onreadystatechange = function() 
	{ 
		if(jax.readyState==4 && jax.status==200) 
		{ 
			//logInfo("getStockCurrentPrice() - Got Response from Prices.XML");
			var xmlText = jax.responseXML;  
			
			var txt;
			var x;
			x=xmlText.getElementsByTagName("event");
			
			
				var newsName;
				var newsURL;
			
				
						$(xmlText).find( "event" ).each
						(
							function()
							{
								var item = $(this);
								
									if (item.find('bullet').text() == "sign")
									{
										newsName = item.find('description').text()
										newsURL = item.find('url').text()
									}
								}
						);
				
					if (localStorage["newsLatest"] == null || localStorage["newsLatest"] == "")
					{
						localStorage["newsLatest"] = "";
					}
				
					if (getHash(newsName) == localStorage["newsLatest"])
					{
						return;
					}
					
					localStorage["newsLatest"] = getHash(newsName);
					
					//Show Notification
														
					var data = { stockName: localStorage["favStock"], name: newsName, url: newsURL };
					
					var notification = webkitNotifications.createHTMLNotification('notification.html#' + encodeURIComponent(JSON.stringify(data)) );
					notification.show();


			
			/*
			
			<event>
			<graph_id>none</graph_id>
			<date>2013-04-05</date>
			<bullet>sign</bullet>
			<border_color>#CD131A</border_color>
			<axis>true</axis>
			<size>12</size>
			<description>
			<![CDATA[GO300 AGM Agenda 2013 ]]>
			</description>
			<url>http://www.borzamalta.com.mt/download/announcements/GO300.pdf</url>
			</event>
			  */
		}
	}

	try
	{	
		jax.send();
	}
	catch(err)
	{
		setBadgeStatus(3);
		logInfo("getStockCurrentPrice() - Error Occured\n\n" + err.message );
	}

}

function isStockSet() {
	if (localStorage["favStock"] != null && localStorage["favStock"] != "")
	{
		return true;
	}
	
	return false;
}

function startRequest(isFirstTime) {

	logInfo("Start - startRequest("+isFirstTime + ")");
	
	//Check for new version and update localStorage Variable
	updateApp();
	
		//Make Requests run only Mon-Fri 9am - 14
		
		if (isStockSet())
		{
			if (canIPoll('marketPoll') || isFirstTime)
			{
				getStockCurrentPrice();
			}
			
			if (canIPoll('newsPoll') || isFirstTime)
			{
				getNewsQty();
			}
		}
		
		timeoutHolder = window.setTimeout(function () {startRequest(false, pollInterval);} , pollInterval * 1000);	
	
	
	logInfo("End - startRequest("+isFirstTime + ")");
}

function getStockCurrentPrice() {
	stockName = localStorage["favStock"];

    var jax = new XMLHttpRequest();

	jax.open("GET","http://www.borzamalta.com.mt/uploads/tickerprices/prices.xml", true);
	//jax.open("GET","http://localhost/stock/prices.xml", true);
	
	jax.setRequestHeader("pragma", "no-cache");
	jax.setRequestHeader("cache-Control","no-cache, must-revalidate");
	jax.setRequestHeader("Expires","Mon, 12 Jul 2010 03:00:00 GMT");
	
	jax.onreadystatechange = function() 
	{ 
		if(jax.readyState==4 && jax.status==200) 
		{ 
			logInfo("getStockCurrentPrice() - Got Response from Prices.XML");
			var xmlText = jax.responseXML;  
			
			var txt;
			var x;
		
			try
			{	
				x=xmlText.getElementsByTagName("item");

				for (i=0;i<x.length;i++)
				  {
					  if (x[i].childNodes[0].nodeValue.indexOf(stockName) > -1)
					  {
								logInfo("getStockCurrentPrice() - Found Matching Stock Info - " + x[i].childNodes[0].nodeValue);
								var stockLastPrice = x[i].childNodes[0].nodeValue.replace(" ","").replace(stockName.toUpperCase(),"");
								var stockLastChange = x[i+1].childNodes[0].nodeValue.replace("(NC)", "0.00").trim();
							
								processPrice(stockLastPrice, stockLastChange);
								
								return;
					  }
					}
			}
			catch(err)
			{
				setBadgeStatus(3);
				logInfo("getStockCurrentPrice() - Error Occured\n\n" + err.message );
			}
			
		}
	}

	try
	{	
		jax.send();
	}
	catch(err)
	{
		setBadgeStatus(3);
		logInfo("getStockCurrentPrice() - Error Occured\n\n" + err.message );
	}
}

function processPrice(currentPrice, priceChange) {
	logInfo("parseHTML() - Start");
	
	setBadgeStatus(0);
	chrome.browserAction.setTitle({ title: "Malta Stock Stalker\n\n" + localStorage["favStock"] + "\n" + currentPrice });

			
		//Checks for badge
		logInfo("parseHTML() - Set Badge");
		setBadgeStatus(0);

		if (priceChange > 0) {setBadgeStatus(2);}
		if (priceChange < 0) {setBadgeStatus(1);}

		
		if (localStorage["stockLastPrice"] > currentPrice || localStorage["stockLastPrice"] < currentPrice)
		{
		
		//Alter Title
		logInfo("parseHTML() - Set Title");
		chrome.browserAction.setTitle({ title: "Malta Stock Stalker\n\n" + localStorage["favStock"] + "\n" + currentPrice + " (" + priceChange + ") ( " + Math.round(((100 / currentPrice) *  priceChange) * 1000) / 1000 + "% )" }); 
		
			//Increase In Stock
			if (priceChange > 0) { constructNotification("UP",currentPrice, priceChange);}

			//Decrease In Stock
			if (priceChange < 0) { constructNotification("DOWN",currentPrice, priceChange);}

		}
		
		localStorage["stockLastPrice"] = currentPrice;
		localStorage["stockLastChange"] = priceChange;

		logInfo("parseHTML() - End");
}

function canIPoll(functionName) {
if (forcePolling == true) {return true;}

//Made the Polling time UTC based so if run in a different country it will 
//still poll during the actual time of the Malta Stock Exchange
var d = new Date();

	logInfo("canIPoll() - Current Date/Time " + d.getUTCDay() + " " + d.getUTCHours());

	switch(functionName)
	{
		case 'marketPoll':
		
			if (d.getUTCDay() > 0 && d.getUTCDay() < 6)
			{
				if (d.getUTCHours() > 6 && d.getUTCHours() < 12)
				{
					logInfo("canIPoll(marketPoll) - Can Poll");
					return true;
				}
			}
		
		break;
		
		case 'newsPoll':
		
			if (d.getUTCDay() > 0 && d.getUTCDay() < 6)
			{
				if (d.getUTCHours() > 6 && d.getUTCHours() < 16)
				{
					logInfo("canIPoll(newsPoll) - Can Poll");
					return true;
				}
			}
			
		break;
	}
	
	
	

	
	logInfo("canIPoll() - Can NOT Poll");
	return false;
}

function getListedStock() {
    var jax = new XMLHttpRequest();
 	jax.open("GET","http://www.borzamalta.com.mt/uploads/graphical/amstock/charts/equities_settings.xml");
    jax.send();
    jax.onreadystatechange = function() 
	{ 
		if(jax.readyState==4) 
		{ 
			var xml = jax.responseText;

			//var stockList = new Array($(xml).find( "data_set" ).length);

			var loopNo = 0;
			var opt = document.createElement("option");
			
			if (localStorage["favStock"] == null || localStorage["favStock"] == "")
			{
					   opt = document.createElement("option");
					   opt.text = "Select One";
					   opt.value = "";
					   document.getElementById("stockOption").options.add(opt);
			}
			else
			{
					   opt = document.createElement("option");
					   opt.text = "*** Follow None ***";
					   opt.value = "Remove";
					   document.getElementById("stockOption").options.add(opt);
			}
			
			$(xml).find( "data_set" ).each
			(
				function()
				{
					var item = $(this);
					
					   opt = document.createElement("option");
					   opt.text = item.find('short').text();
					   opt.value = item.find('title').text();
					   document.getElementById("stockOption").options.add(opt);
					}
			);
			
			loadOptions();

		}
	}
}

function loadOptions() {

	//Select the selected company being followed
	var favStock = localStorage["favStock"];
	
	var select = document.getElementById("stockOption");
	
	for (var i = 0; i < select.children.length; i++) {
		var child = select.children[i];
	
			if (child.value == favStock) {
			child.selected = "true";
			break;
		}
	}
	
	//Enable Notifications
	if (localStorage["enableNotifications"] == null) 
		{ 
			localStorage["enableNotifications"] = "1";
			
			localStorage["lowLevelNotification"] = "0";
			localStorage["highLevelNotification"] = "0";
		}
	
	//UI Notifications Show/Hide
	if (localStorage["enableNotifications"] == "1")
	{
		document.getElementById("enableNotifications").setAttribute("checked",true);
		
		document.getElementById("notificationSection").removeAttribute("hidden");
	}
	else
	{
		document.getElementById("enableNotifications").removeAttribute("checked");
		
		document.getElementById("notificationSection").setAttribute("hidden","");
	}
	
	document.getElementById("lowLevel").setAttribute("value",localStorage["lowLevelNotification"]);
	document.getElementById("highLevel").setAttribute("value",localStorage["highLevelNotification"]);

	
}

function saveOptions() {
	var select = document.getElementById("stockOption");
	var stock = select.children[select.selectedIndex].value;
	
	_gaq.push(['_trackEvent', 'StockSelected', stock]);
	
	if ( stock == "Remove")
	{
		localStorage.removeItem("favStock");
	    localStorage.removeItem("stockLastPrice");
		setBadgeStatus(4);
		clearTimeout(timeoutHolder);
		return;
	}
	
	localStorage["favStock"] = stock;
	localStorage["stockLastPrice"] = 0;
	localStorage["stockLastChange"] = 0;
	
	startRequest(true);
}

//End Logic

//Start UI Updates

function populateIframes(frameToRefresh) {
	var now = new Date();
    var ticks = now.getTime();
	
	if (frameToRefresh == 'tally' || frameToRefresh == '')
	{
		document.getElementById("tallyFrame").setAttribute("src","http://www.borzamalta.com.mt/aspx/regular3.aspx?r=" + ticks);
	}
	
	if (frameToRefresh == 'chart' || frameToRefresh == '')
	{
		document.getElementById("chartFrame").setAttribute("src","http://www.borzamalta.com.mt/uploads/graphical/equities.html?r=" + ticks);
	}
	
	if (frameToRefresh == 'news' || frameToRefresh == '')
	{
		document.getElementById("newsFrame").setAttribute("src","http://194.158.42.14/announcements/?r=" + ticks);
	}
	
	if (frameToRefresh == 'newsArchive' || frameToRefresh == '')
	{
		document.getElementById("newsArchiveFrame").setAttribute("src","http://194.158.42.14/announcements/search.aspx?r=" + ticks);
	}
}

function setPollingIcon() {
	document.getElementById("pollingStatus").setAttribute("src","images/no.png");
		
	if (canIPoll('marketPoll'))
	{
		document.getElementById("pollingStatus").setAttribute("src","images/yes.png");
	}
}

function setBadgeStatus(stateID) {

	switch (stateID)
	{
		case 0:
		//No Change Price
		chrome.browserAction.setBadgeText({text: localStorage["favStock"].replace(/^\s+|\s+$/g,'')});
		chrome.browserAction.setBadgeBackgroundColor({ color: [145, 145, 145, 255] });
		break;

		case 1:
		//Price Decrease
		chrome.browserAction.setBadgeText({text: localStorage["favStock"].replace(/^\s+|\s+$/g,'')});
		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
		break;

		case 2:
		//Price Increase
		chrome.browserAction.setBadgeText({text: localStorage["favStock"].replace(/^\s+|\s+$/g,'')});
		chrome.browserAction.setBadgeBackgroundColor({ color: [66, 227, 71, 255] });
		break;
		
		case 3:
		//Internet Down
		chrome.browserAction.setBadgeText({text: "!"});
		chrome.browserAction.setBadgeBackgroundColor({ color: [232, 232, 16, 255] });
		break;		
		
		case 4:
		//Clearing Badge
		chrome.browserAction.setBadgeText({text: ""});
		break;
	}
}

//End UI Updates

// Start Notifications
function notificationStateChange(image, text, title) {
	//If notifications are disabled do not show.
	if (localStorage["enableNotifications"] != "1") {return;}

	var notification = webkitNotifications.createNotification(
	  image,  // icon url - can be relative
	  title,  // notification title
	  text  // notification body text
	);

	// Then show the notification.
	notification.show();
}

function constructLevelNotification(stockPrice) {
	var strTmp = "";
	
	if (parseFloat(localStorage["lowLevelNotification"],10) > parseFloat(0,10)
			&& parseFloat(localStorage["lowLevelNotification"],10) >= parseFloat(stockPrice,10))
			{
			strTmp = strTmp + " (Alert Low Price)";
			}
			
	if (parseFloat(localStorage["highLevelNotification"],10) > parseFloat(0,10)
			&& parseFloat(localStorage["highLevelNotification"],10) <= parseFloat(stockPrice,10))
			{
			strTmp = strTmp + " (Alert High Price)";
			}
			
	return strTmp;
			
}

function constructNotification(stockDirection, currentPrice, priceChange) {
	switch(stockDirection)
	{
		case "UP":
			notificationStateChange("up.png",currentPrice + " (+" + priceChange +") (" + Math.round(((100 / currentPrice) *  priceChange) * 1000) / 1000 + "%)", localStorage["favStock"] + constructLevelNotification(currentPrice));
		break;
		
		case "DOWN":
			notificationStateChange("down.png", currentPrice + " (" + priceChange +") (" + Math.round(((100 / currentPrice) *  priceChange) * 1000) / 1000 + "%)", localStorage["favStock"]  + constructLevelNotification(currentPrice));
		break;
	}
}

// End Notifications

//Start Logging

function displayTime() {
    var str = "";

    var currentTime = new Date()
    var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()
    var seconds = currentTime.getSeconds()

    if (minutes < 10) {
        minutes = "0" + minutes
    }
    if (seconds < 10) {
        seconds = "0" + seconds
    }
    str += hours + ":" + minutes + ":" + seconds + " ";
    if(hours > 11){
        str += "PM"
    } else {
        str += "AM"
    }
    return str;
}

function logInfo(text) {
	if (allowConsoleLogging)
	{
		console.log(displayTime() + " - " + text);
	}
}

function getHash(var1){
	var hash = 0;
	if (var1.length == 0) return hash;
	for (i = 0; i < var1.length; i++) {
		char = var1.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}
