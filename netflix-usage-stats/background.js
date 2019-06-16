// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.runtime.onInstalled.addListener(function() {
  chrome.cookies.getAll({ url: 'https://www.netflix.com' },
    function (cookies) {
      if (cookies) {
        console.log(cookies);
      }
      else {
        console.log('Can\'t get cookie! Check the name!');
      }
  });
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log('The color is green.');
  });

  fetch(`https://www.netflix.com/api/shakti/v0a906ca6/viewingactivity?pg=0&pgSize=20`, {credentials: 'same-origin'})
    .then(response => response.json())
    .then(data => {
      console.log(data);
      window.activity = data;
      console.log('activity', activity);
    })
    .catch(error => console.error(error))

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'www.netflix.com'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});
