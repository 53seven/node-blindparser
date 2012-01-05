//feed.js
var xml2js = require('xml2js');
var request = require('request');
var $ = require('jquery');

/**
All you need to do is send a feed URL that can be opened via fs
Options are optional, see xml2js for extensive list
And a callback of course

The returned formats will be structually the same, but you should still check the 'format' property
**/
exports.parseURL = function(feedURL, options, callback){


	var parser = new xml2js.Parser();
	var obj = request.get({uri:feedURL, jar:false, proxy:false, followRedirect:false}, function (err, response, xml) {
		console.log(feedURL);
		if(err){
			callback(err,null);
		}else{
			parser.parseString(xml, function(err, jsonDOM){
				if(err){
					callback(err, null);
				}else{
					//do not have error catching right now, need to build
					var err, output;
					if(isRSS(jsonDOM)){
						output = formatRSS(jsonDOM);
					}else{
						output = formatATOM(jsonDOM);
					}
					callback(null, output);
				}
			});
		}
	});

	//detects if RSS, otherwise assume atom
	function isRSS(json){
		return (json.channel != null);
	}

	//formats the RSS feed to the needed output
	function formatRSS(json){
		var output = {'type':'rss', metadata:{}, items:[]};
		//Start with the metadata for the feed
		var metadata = {};
		var channel = json.channel;
		if(channel.title){
			metadata.title = channel.title;
		}	
		if(channel.description){
			metadata.desc = channel.description;
		}
		if(channel.link){
			metadata.url = channel.link;
		}
		if(channel.lastBuildDate){
			metadata.lastBuildDate = channel.lastBuildDate;
		}
		if(channel.pubDate){
			metadata.update = channel.pubDate;
		}
		if(channel.ttl){
			metadata.ttl = channel.ttl;
		}
		output.metadata = metadata;
		//ok, now lets get into the meat of the feed
		//just double check that it exists
		if(channel.item){
			$.each(channel.item, function(index, val){
				var obj = {};
				obj.title = val.title;
				obj.desc = val.description;
				obj.link = val.link;
				if(val.category){
					obj.category = val.category;
				}
				//since we are going to format the date, we want to make sure it exists
				if(val.pubDate){
					//lets try basis js date parsing for now
					obj.date = Date.parse(val.pubDate);
				}
				//now lets handel the GUID
				if(val.guid){
					//xml2js parses this kina odd...
					var link = val.guid['#'];
					var param = val.guid['@'];
					var isPermaLink = 'true';
					if(param){
						isPermaLink = param.isPermaLink;
					}
					obj.guid = {'link':link, isPermaLink:isPermaLink};
				}
				//now push the obj onto the stack
				output.items.push(obj);
			});	
		}
		return output;
	}

	//formats the ATOM feed to the needed output
	//yes, this is a shamless copy-pasta of the RSS code (its all the same structure!)
	function formatATOM(json){
		var output = {'type':'atom', metadata:{}, items:[]};
		//Start with the metadata for the feed
		var metadata = {};
		var channel = json;
		if(channel.title){
			metadata.title = channel.title;
		}	
		if(channel.subtitle){
			metadata.desc = channel.subtitle;
		}
		if(channel.link){
			metadata.url = channel.link;
		}
		if(channel.id){
			metadata.id = channel.id;
		}
		if(channel.update){
			metadata.update = channel.update;
		}
		if(channel.author){
			metadata.author = channel.author;
		}
		
		output.metadata = metadata;
		//ok, now lets get into the meat of the feed
		//just double check that it exists
		if(channel.entry){
			$.each(channel.entry, function(index, val){
				var obj = {};
				obj.id = val.id;
				obj.title = val.title['#'];
				obj.desc = val.content['#'];
				var categories = [];
				//just grab the category text
				if(val.category){
					if($.isArray(val.category)){
						$.each(val.category, function(i, val){
							categories.push(val['@']['term']);
						});
					}else{
						categories.push(val.category);
					}
				}
				obj.category = categories;
				var link = '';
				//just get the alternate link
				$.each(val.link, function(i, val){
					if(val['@'].rel == 'alternate'){
						link = val['@'].href;
					}
				});
				obj.link = link;
				//since we are going to format the date, we want to make sure it exists
				if(val.published){
					//lets try basis js date parsing for now
					obj.date = Date.parse(val.published);
				}
				if(val.updated){
					//lets try basis js date parsing for now
					obj.updated = Date.parse(val.updated);
				}
				//now push the obj onto the stack
				output.items.push(obj);
			});	
		}
		return output;
	}

}


