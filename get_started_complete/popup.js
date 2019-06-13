// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

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

chrome.tabs.executeScript({
    code: '(' + function() {
        return {language: document.querySelector('html').getAttribute('lang') || 'en'};
    } + ')();'
}, function(results) {
    console.log("Language: " + results[0].language);
    initializeLanguage(results[0].language);
});

/**
 * Initialize i18n with given language
 * @param {*} language 
 */
function initializeLanguage(language) {
    i18next.init({
      lng: language,
      debug: true,
      resources: {
        en: {
          translation: {
            "goToStats": "SHOW STATS",
          }
        },
        es: {
          translation: {
            "goToStats": "VER ESTADÍSTICAS",
          }
        }
      }
    }, function(error, t) {
      if (error) {
        console.error(error);
      }
      translatePage();
    });
  }

  /**
 * Translate texts in page
 */
function translatePage() {
    document.querySelector('#goToStatsBtn span').innerHTML = i18next.t('goToStats');
}  