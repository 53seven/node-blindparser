//feed.js testing
//Right now this is just to make sure that it runs
var parser = require('../lib/feed');

parser.parseURL('http://rss.cnn.com/rss/cnn_topstories.rss', {}, function(err, out){
//	console.log(JSON.stringify(out));
});

parser.parseURL('http://www.blogger.com/feeds/10861780/posts/default', {}, function(err, out){
//	console.log(JSON.stringify(out));
});
