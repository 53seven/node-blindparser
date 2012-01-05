node-blindparser
----------------

blindparser is a RSS/ATOM feed parser that returns the requested feed urls in a json object that is formatted so that you will not have to worry (much) about the format of the requested feed.

Motivation
----------

RSS and ATOM feeds are both trying to deliver similar content, but are different enough with their structure to be aggravating. The purpose of blindparser is to allow for the important parts of the feeds (article titles, links, etc) to be returned in a standard format, but to also return the rest of the feed in a reasonable way.

Installing
----------

Like all node.js modules, just use npm!

```
npm install blindparser
```

Usage
-----

Using blind parser is easy, just call:

```
var parser = require('blindparser');
var options = {};
//rss feeds
parser.parseURL('http://rss.cnn.com/rss/cnn_topstories.rss', options, function(err, out){
	console.log(out);
});
//atom feeds
parser.parseURL('http://www.blogger.com/feeds/10861780/posts/default', options, function(err, out){
	console.log(out);
});
```

Output
------

The point of `blindparser` is to try and hide the format of the originally requested feed. Thus RSS and ATOM feeds are returned in a common format. Similar fields (pubDate vs update) will be mapped to the same field in the output.

The 'minimal' output format is:

```
{
	type:"rss" or "atom"
	metadata:{
		title: Title of the feed
		desc: description or subtitle
		url: url of the feed
		update: pubDate or update time of the feed
	},
	items:[
		{
			title: Title of article
			desc:	Description or content of article
			link: Link to article
			date: Time article was published
		}...
	]
```

TODO
-----

* Tests (lots of tests)
* Add error handling for bad urls / poorly formatted xml & feeds
* Remove jQuery, as it is only used for interation right now


Changelog
---------

* 0.0.1 - Initial Commit


