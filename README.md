node-blindparser
----------------
[![build status](https://secure.travis-ci.org/dropdownmenu/node-blindparser.png)](http://travis-ci.org/dropdownmenu/node-blindparser)

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

// with no options
parser.parseURL('http://rss.cnn.com/rss/cnn_topstories.rss', function(err, out){
	console.log(out);
});

var options = {
	followRedirect: false,
	timeout: 1000
};
//rss feeds
parser.parseURL('http://rss.cnn.com/rss/cnn_topstories.rss', options, function(err, out){
	console.log(out);
});
//atom feeds
parser.parseURL('http://www.blogger.com/feeds/10861780/posts/default', options, function(err, out){
	console.log(out);
});
```

Options
-------

The options hash is passed through to [request](https://github.com/mikeal/request) for fetching a given url.

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

Tests
-----

Tests for blindparser can be run using the command:

```
npm test
```

Make sure that you machine has an internet connection before running the
tests.

License
-------
Copyright (c) 2012 Tim McGowan (dropdownmenu)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
