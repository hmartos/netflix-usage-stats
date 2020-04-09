<p style="text-align:center" align="center">
  <img src="./src/images/logo48.png" alt="logo">

  <h1 align="center">Netflix Viewing Stats</h1>

  <h4 align="center">Shows Netflix viewing stats dashboard to know more about how you spend your time on Netflix</h4>

  <p align="center">
    <a href="https://chrome.google.com/webstore/detail/bckfpnenhimfckndcceonmkhheinmkob?utm_source=github"><strong>Install for Google Chrome &raquo;</strong></a>
  </p>
</p>

<p align="center">
  <a href="https://github.com/hmartos/netflix-usage-stats/actions"><img alt="GitHub Actions status" src="https://github.com/hmartos/netflix-usage-stats/workflows/Node%20CI/badge.svg"></a>
  <a href="https://chrome.google.com/webstore/detail/bckfpnenhimfckndcceonmkhheinmkob?utm_source=github_badge"><img alt="Chrome Web Store" src="https://img.shields.io/chrome-web-store/v/bckfpnenhimfckndcceonmkhheinmkob"></a>
  <a href="https://github.com/hmartos/netflix-usage-stats/blob/master/LICENSE"><img alt="License" src="https://img.shields.io/github/license/hmartos/netflix-usage-stats"></a>
</p>

This Chrome extension allows you to access to a viewing stats dashboard fully integrated on Netflix site which loads viewing activity from Netflix Shakti API and calculate a set of statistics about how you use your Netflix account.

![Screenshot](./screenshots/screenshot-full-summary.png)
![Screenshot](./screenshots/screenshot-full-achievements.png)

In the **Summary** section you can see the following statistics:

- Total watched titles (movies, series, documentaries) and first use date
- Total time watching Netflix
- Netlix Marathon (maximum time watching Netflix in a single day)
- Number of devices you have used to watch Netflix
- Number of movies watched
- Time watching movies
- Number of series and episodes watched
- Time watching series
- Comparison between time watching movies vs time watching series
- Average time watching Netflix per day of the week

In the **Achievements** sections you can earn badges based on some goals:

- **Once Upon a Time in... Hollywood**: Watch your first movie on Netflix
- **Series and Other Drugs**: Watch your first episode of a series on Netflix
- **Cinephile**: Watch 1000 movies or more on Netflix
- **Series Killer**: Watch 100 series or more on Netflix
- **Marathoner**: Watch Netflix for 6 hours or more in a day
- **Iron Man**: Watch Netflix for 12 hours or more in a day
- **Matrix**: Watch Netflix on 5 or more different devices
- **One of Ours**: Being suscribed to Netflix for 24 months or more
- **I Am Legend**: Watch 5000 titles on Netflix
- **Mission: Impossible**: Get all the achievements

In the **Viewing activity** section you can see, sort and filter the whole user's viewing activity.

## Screenshots

- [Screenshots for Chrome Web Store](https://www.figma.com/file/hsSDfY3nw06MhwJnvCKyxc/screenshot-1280x800?node-id=5%3A2)

## Requirements

- [Git](https://git-scm.com/)
- [NodeJS](https://nodejs.org/)

## Getting Started

1. Clone the repository `git clone https://github.com/hmartos/netflix-usage-stats.git`.
2. Open Google Chrome Extension Management page navigating to [chrome://extensions](chrome://extensions).
   The Extension Management page can also be opened by clicking on the Chrome menu, hovering over `More Tools` then selecting `Extensions`.
3. Enable `Developer Mode` by clicking the toggle switch next to Developer mode in the top right corner.
4. Click the `Load Unpacked` button and select the folder `src` inside the cloned repository.

## Running Tests

Execute `npm test` to run unit tests.

## Build

You can generate a zip file with the extension ready to be uploaded to [Google Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)

Just execute `npm run build` and a zip called `netflix-usage-stats.zip` will be generated.

## License

Copyright 2019 Héctor Martos. Code released under the [MIT License](./LICENSE).
