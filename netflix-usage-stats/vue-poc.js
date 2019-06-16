console.log("Loaded!");

var iFrame  = document.createElement ("iframe");
iFrame.src  = chrome.extension.getURL("vue.html");

// Get Netflix activity table
let activityTable = document.querySelector('.retable');
console.log(activityTable);

// Show loader
activityTable.replaceWith(iFrame);

var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
})