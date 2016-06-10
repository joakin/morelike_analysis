morelike_analysis
=================

Node scripts to analyze wikipedia api search results with cirrussearch's
morelike with different scoring algorithms.

See https://phabricator.wikimedia.org/T135430

## Requirements

Needs node.js > 6.x

## Usage

No arguments will fetch 10 random ones
```
node index.js #
```

With an argument it will use that file as the list of titles to fetch. Useful
for repeatable fetches or manual lists of titles
```
node index.js 10random.json
```

The script will then fetch related pages using morelike for those articles and
then produce wikitext with the comparison of the different scoring parameters.

Example output: https://www.mediawiki.org/wiki/Extension:RelatedArticles/CirrusSearchComparison

Paste the wikitext on a wiki page to see the results formatted.




