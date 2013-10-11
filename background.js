//set App Update Tracker
//http://developer.chrome.com/extensions/runtime.html#event-onInstalled
chrome.runtime.onInstalled.addListener(trackAppChange);

//Track App Starting
trackStartUpEvent();


startRequest(true);