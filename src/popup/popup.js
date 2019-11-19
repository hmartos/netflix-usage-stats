// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

document.querySelector('#goToStatsBtn span').textContent = chrome.i18n.getMessage("showStats");
let goToStatsBtn = document.getElementById('goToStatsBtn');

goToStatsBtn.onclick = function(element) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: `location.replace('https://www.netflix.com/viewingactivity?stats=true')`}
    );
    window.close();
  });
};