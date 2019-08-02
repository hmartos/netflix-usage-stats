# Release Notes

This file contains changes

based on [this template](https://github.com/palantir/plottable/wiki/Release-Notes-Template)

Upgrade Steps
List out, as concretely as possible, any steps users have to take when they upgrade beyond just dumping the dependency.
Write pseudocode that highlights what code should change and how.
Call out if users are recommended to upgrade because of known problems with older releases.
Preferably, there's nothing here.
Breaking Changes
A complete list of breaking changes (preferably there are none, unless this is a major version).

New Features
Describe the new feature and when/why to use it. Add some pictures! Call out any caveats/warnings? Is it a beta feature?

Bug Fixes
Call out any existing feature/functionality that now works as intended or expected.

Improvements
Improvements/enhancements to a workflow, performance, logging, error messaging, or user experience

Other Changes
Other miscellaneous changes that don't fit into any of the above categories. Try to leave this empty - ideally, all changes fit into the categories above

## 0.5.0

### Upgrade Steps

### Breaking Changes

### New Features

- Hours, minutes and seconds are now shown on date column of data table
- Changed percentage of total time on Netflix chart by average time on Netflix per day of the week

### Bug Fixes

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

### Other Changes

## 0.4.0

### Upgrade Steps

### Breaking Changes

### New Features

- Added datatable with the whole user viewing activity

### Bug Fixes

- Fixed incorrect count of movies
- Added label to time watching movies vs series chart

### Improvements

### Other Changes

- Reorganized vendor files in folders

## 0.3.1

### Upgrade Steps

### Breaking Changes

### New Features

### Bug Fixes

- Fixed incorrect first use date by sorting fetched activity data

### Improvements

### Other Changes

## 0.3.0

### Upgrade Steps

### Breaking Changes

### New Features

- Added first Netflix use below total watched elements
- Added loading message to warn it can take some time to load the hole activity data

### Bug Fixes

### Improvements

- Fixed annoying screen gap at page loading
- Netflix BUILD_IDENTIFIER is now loaded dinamically instead of using a hardcoded value

### Other Changes

- Internationalization is now done using i18n-chrome service instead of i18next

## 0.2.0

### Upgrade Steps

- Folder name has been renamed to 'netflix-usage-stats' so when upgrading from 0.1.0 version you should remove extension and load again the unpacked extension from this new folder

### Breaking Changes

### New Features

- Formatted numbers adding thousands separator
- Added years to time calculations

### Bug Fixes

### Improvements

- Responsive design
- Popup is now closed when 'Show Stats' button is clicked
- Some code improvements like removing unused code and reviewed extension permissions

### Other Changes

- Added new logo

## 0.1.0

### Upgrade Steps

### Breaking Changes

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

### Bug Fixes

### Improvements

### Other Changes
