# Release Notes

This file contains changes based on [this template](https://github.com/palantir/plottable/wiki/Release-Notes-Template)

## 2.3.0

### Improvements

- Added loading progress of the viewing activity

## 2.2.1

### Improvements

- Added formatted duration and duration in seconds for each title in the exported viewing activity CSV

## 2.2.0

### New Features

- Now you can donwload your full viewing activity in a CSV file using the link 'Download all' at the bottom of the viewing activity section

### Improvements

- Now the loaded viewing activity will be stored in indexedDb. The next time you visit your viewing stats dashboard the viewing activity will be retrieved from the indexedDb and completed with the most recent viewing activity

### Bug Fixes

- Fixed bug in the search of viewing activity for latin words with special characters

## 2.1.0

### New Features

- Added an achievements section where you can earn some badges based on goals over your viewing activity

### Improvements

- New icons for movies and series in the viewing activity section
- New logo
- New popup design

## 2.0.2

### Other Changes

- Fixed broken link to screenshot in README
- Added automatic formatting tool on pre-commit hook

## 2.0.1

### Bug Fixes

- Fixed bug in pagination start range starting at 0

### Improvements

- Removed broad host for Netflix host match

### Other Changes

- Reorganized screenshots and sketch files

## 2.0.0

### Improvements

- Amazing UI redesign by [@josemendezlara](https://github.com/josemendezlara) and [@babelarr](https://github.com/babelarr)

## 1.2.0

### Upgrade Steps

- When upgrading from 1.1.0 or previous version you should remove extension from [Chrome Extensions](chrome://extensions/) and load again the unpacked extension from the new `src` folder

### Breaking changes

- Reorganised code in folders. Now manifest.json is located at `src` folder. See Upgrade Steps to reload Chrome extension

### Bug Fixes

- Fixed bug in function that calculates watching times
- Fixed bug in function that calculates title's duration

### Other Changes

- Added unit tests

## 1.1.0

### Bug Fixes

- Fixed error when Netflix viewing activity was empty
- Added redirection to a new screen when viewing activity is empty

## 1.0.0

### Improvements

- Changed some translations

### Other Changes

- First release available on [Chrome Web Store](https://chrome.google.com/webstore/devconsole/g09324318338317648806/bckfpnenhimfckndcceonmkhheinmkob)
- Added screenshots

## 0.5.1

### Improvements

- Improved logo icon size
- Updated Spanish screenshots

## 0.5.0

### New Features

- Hours, minutes and seconds are now shown on date column of data table
- Changed percentage of total time on Netflix chart by average time on Netflix per day of the week

### Improvements

- Improved error handling. Added an error page and log traces just in case something goes wrong
- Added Prettier formatter and build script to generate zip file with extension code
- Added protection against XSS atacks
- Added separator between series title and season in data table
- Added debug function to log to console only if DEBUG_MODE flag is enabled
- Formatted dates depending on language. Added titles to avoid confussions
- Changed some labels
- Improved responsiveness of page
- Added MIT license and improved README

## 0.4.0

### New Features

- Added datatable with the whole user viewing activity

### Bug Fixes

- Fixed incorrect count of movies
- Added label to time watching movies vs series chart

### Other Changes

- Reorganized vendor files in folders

## 0.3.1

### Bug Fixes

- Fixed incorrect first use date by sorting fetched activity data

## 0.3.0

### New Features

- Added first Netflix use below total watched elements
- Added loading message to warn it can take some time to load the hole activity data

### Improvements

- Fixed annoying screen gap at page loading
- Netflix BUILD_IDENTIFIER is now loaded dinamically instead of using a hardcoded value

### Other Changes

- Internationalization is now done using i18n-chrome service instead of i18next

## 0.2.0

### Upgrade Steps

- Folder name has been renamed to 'netflix-usage-stats' so when upgrading from 0.1.0 version you should remove extension and load again the unpacked extension from this new folder

### New Features

- Formatted numbers adding thousands separator
- Added years to time calculations

### Improvements

- Responsive design
- Popup is now closed when 'Show Stats' button is clicked
- Some code improvements like removing unused code and reviewed extension permissions

### Other Changes

- Added new logo

## 0.1.0

### New Features

- First fully functional version (not responsive yet) with a set of usage statistics:
  - Total watched elements
  - Total time on Netflix
  - Netlix marathon (maximum time watching Netflix in a day)
  - Used devices
  - Watched movies
  - Time watching movies
  - Watched series
  - Time watching series
  - Time watching movies vs time watching series (in a pie chart)
  - Percentage of time watching Netflix by day of the week (in a bar chart)
