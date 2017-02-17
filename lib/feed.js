//feed.js
var xml2js = require('xml2js');
var _ = require('lodash');
var request = require('request');
var URL = require('url');

/**
All you need to do is send a feed URL that can be opened via fs
Options are optional, see xml2js for extensive list
And a callback of course

The returned formats will be structually the same, but you should still check the 'format' property
**/
function parseURL(feedURL, options, callback) {
  if (typeof options == 'function' && !callback) {
    callback = options;
    options = {};
  }
  var defaults = {uri: feedURL, jar: false, proxy: false, followRedirect: true, timeout: 1000 * 30};
  options = _.extend(defaults, options);
  //check that the protocall is either http or https
  var u = URL.parse(feedURL);
  if (u.protocol == 'http:' || u.protocol == 'https:') {
    //make sure to have a 30 second timeout
    request(options, function(err, response, xml) {
      if (err || xml === null) {
        if (err) {
          callback(err);
        } else {
          callback(new Error('Failed to retrive source'));
        }
      } else if (response.statusCode && response.statusCode >= 400) {
        callback(new Error('status code ' + response.statusCode));
      } else {
        parseString(xml, callback);
      }
    });
  } else {
    callback(new Error('Only http or https protocalls are accepted'));
  }
}
module.exports.parseURL = parseURL;

function parseString(xml, callback) {
  var parser = new xml2js.Parser();
  parser.parseString(xml, function(err, jsonDOM) {
    if (jsonDOM) {
      jsonDOM = normalize(jsonDOM);
      var output;
      if (isRSS(jsonDOM)) {
        output = formatRSS(jsonDOM);
      } else {
        output = formatATOM(jsonDOM);
      }
      callback(null, output);
    } else if (err instanceof Error) {
      callback(err);
    } else {
      callback(new Error('Failed to parse xml string'));
    }
  });
}
module.exports.parseString = parseString;

//detects if RSS, otherwise assume atom
function isRSS(json) {
  return (json.channel != null);
}

// normalizes input to make feed burner work
function normalize(json) {
  if (json.rss || json['rdf:RDF']) {
    return json.rss || json['rdf:RDF'];
  }
  return json;
}

//xml2js will return commented material in a # tag which can be a pain
//this will remove the # tag and set its child text in it's place
//ment to work on a feed item, so will iterate over json's and check
function flattenComments(json) {
  for (var key in json) {
    if (json[key]['#']) {
      json[key] = json[key]['#'];
    }
  }
  return json;
}

//parse a title from the channel
function getTitle(title) {
  if (_.isArray(title)) {
    title = _.first(title);
  }
  if (_.isObject(title) && _.isString(title._)) {
    title = title._
  }
  return title;
}

//parse a desc from the channel
function getDesc(desc) {
  if (_.isArray(desc)) {
    desc = _.first(desc);
  }
  if (_.isObject(desc) && _.isString(desc._)) {
    desc = desc._;
  }
  return desc;
}

//parse a link from the channel
function getURL(link) {
  var url = '';
  if (link) {
    if (_.isArray(link)) {
      // You'll get the alt link or the last link defined
      _.each(link, function(val, i) {
        if (val.$ && val.$.rel == 'alternate') {
          url = val.$.href;
          return false;
        }
        else if (val.rel == 'alternate') {
          url = val.href;
          return false;
        }
        else {
          url = val;
        }
      });
    } else if (_.isObject(link)) {
      url = link.$ && link.$.href || link.href;
    } else {
      url = link;
    }
  }
  return url;
}

//parse categories from the channel
function getCategories(category) {
  var categories = [];
  if (category) {
    if (_.isArray(category)) {
      _.each(category, function(val, i) {
        if (_.isObject(val) && _.isString(val._)) {
          categories.push(val._);
        } else {
          categories.push(val);
        }
      });
    } else if (_.isObject(category) && _.isString(category._)) {
      categories.push(category._);
    } else {
      categories.push(category);
    }
  }
  return categories;
}

//formats the RSS feed to the needed outpu
//also parses FeedBurner
function formatRSS(json) {
  var output = {'type': 'rss', metadata: {}, items: []};

  //Start with the metadata for the feed
  var metadata = {};
  var channel = json.channel;

  if (_.isArray(json.channel)) {
    channel = json.channel[0];
  }

  //Channel title
  if (channel.title) {
    metadata.title = getTitle(channel.title);
  }

  //Channel description
  if (channel.description) {
    metadata.desc = getDesc(channel.description);
  }

  //Channel URL
  if (channel.link) {
    metadata.url = getURL(channel.link);
  }

  //Channel update date/time
  if (channel.lastBuildDate) {
    metadata.lastBuildDate = channel.lastBuildDate;
    if (_.isArray(metadata.lastBuildDate)) {
      metadata.lastBuildDate = _.first(metadata.lastBuildDate);
    }
  }
  if (channel.pubDate) {
    metadata.update = channel.pubDate;
    if (_.isArray(metadata.update)) {
      metadata.update = _.first(metadata.update);
    }
  }
  if (channel.ttl) {
    metadata.ttl = channel.ttl;
    if (_.isArray(metadata.ttl)) {
      metadata.ttl = _.first(metadata.ttl);
    }
  }

  //Channel image info
  if (channel.image) {
    metadata.image = [];
    channel.image.forEach(function(image, index) {
      metadata.image[index] = {};
      Object.keys(image).forEach(function(attr) {
        metadata.image[index][attr] = _.isArray(image[attr]) ? _.first(image[attr]) : image[attr];
      });
    });
  }

  output.metadata = metadata;

  //ok, now lets get into the meat of the feed
  //just double check that it exists
  var items = json.item || channel.item;
  if (items) {
    if (!_.isArray(items)) {
      items = [items];
    }
    _.each(items, function(val, index) {
      val = flattenComments(val);
      var obj = {};
      //item title/desc/etc.
      obj.title = getTitle(val.title);
      obj.desc = getDesc(val.description);
      obj.link = getURL(val.link);
      obj.category = getCategories(val.category);

      //since we are going to format the date, we want to make sure it exists
      var pubDate = val.pubDate || val['dc:date'];
      if (pubDate) {
        if (_.isArray(pubDate)) {
          pubDate = _.first(pubDate);
        }
        //lets try basic js date parsing for now
        obj.date = Date.parse(pubDate);
      }

      //now lets handel the GUID
      if (val.guid) {
        var link = val.guid;
        var isPermaLink = true;
        if (_.isArray(link)) {
          link = _.first(link);
        }
        if (_.isObject(link) && _.isString(link._)) {
          link = link._;
        }
        obj.guid = {'link': link, isPermaLink: isPermaLink};
      }

      //grab media content if exists
      if (val['media:content']) {
        var content = val['media:content'];
        if (_.isArray(content)) {
          content = _.first(content);
        }
        if (_.isObject(content) && content.$) {
          content = content.$;
        }
        obj.media = val.media || {};
        obj.media.content = content;
      }
      //grab thumbnail if exists
      if (val['media:thumbnail']) {
        var thumbnail = val['media:thumbnail'];
        if (_.isArray(thumbnail)) {
          thumbnail = _.first(thumbnail);
        }
        if (_.isObject(thumbnail) && thumbnail.$) {
          thumbnail = thumbnail.$;
        }
        obj.media = val.media || {};
        obj.media.thumbnail = thumbnail;
      }
      //now push the obj onto the stack
      output.items.push(obj);
    });
  }
  return output;
}

//formats the ATOM feed to the needed output
function formatATOM(json) {
  var output = {'type': 'atom', metadata: {}, items: []};

  //Start with the metadata for the feed
  var metadata = {};
  var channel = json.feed || json;

  //Channel title
  if (channel.title) {
    metadata.title = getTitle(channel.title);
  }

  //Channel description
  if (channel.subtitle) {
    metadata.desc = getDesc(channel.subtitle);
  }

  //Channel URL
  if (channel.link) {
    metadata.url = getURL(channel.link);
  }

  //Channel id
  if (channel.id) {
    metadata.id = channel.id;
    if (_.isArray(metadata.id)) {
      metadata.id = _.first(metadata.id);
    }
  }

  //Channel update date/time
  if (channel.updated) {
    metadata.update = channel.updated;
    if (_.isArray(metadata.update)) {
      metadata.update = _.first(metadata.update);
    }
  }

  //Channel author info
  if (channel.author) {
    metadata.author = channel.author;
    if (_.isArray(metadata.author)) {
      metadata.author = _.first(metadata.author);
    }
    if (_.isObject(metadata.author)) {
      _.each(metadata.author, function(val, prop) {
        if (_.isArray(val)) {
          val = _.first(val);
        }
        if (_.isObject(val) && val.$) {
          val = val.$;
        }
        metadata.author[prop] = val;
      });
    }
  }

  output.metadata = metadata;
  //just double check that it exists and that it is an array
  if (channel.entry) {
    if (!_.isArray(channel.entry)) {
      channel.entry = [channel.entry];
    }
    _.each(channel.entry, function(val, index) {
      val = flattenComments(val);
      var obj = {};
      //item id
      obj.id = val.id;
      if (_.isArray(obj.id)) {
        obj.id = _.first(obj.id);
      }

      //item title/desc/etc.
      if (!val.title) {
        console.log(json);
      }
      obj.title = getTitle(val.title);
      obj.desc = getDesc(val.content || val.summary);
      obj.link = getURL(val.link);
      obj.category = getCategories(val.category);

      //since we are going to format the date, we want to make sure it exists
      var pubDate = val.published || val.pubDate;
      if (pubDate) {
        if (_.isArray(pubDate)) {
          pubDate = _.first(pubDate);
        }
        //lets try basic js date parsing for now
        obj.date = Date.parse(pubDate);
      }
      if (val.updated) {
        if (_.isArray(val.updated)) {
          val.updated = _.first(val.updated);
        }
        //lets try basic js date parsing for now
        obj.updated = Date.parse(val.updated);
      }

      //grab thumbnail if exists
      if (val['media:thumbnail']) {
        var thumbnail = val['media:thumbnail'];
        if (_.isArray(thumbnail)) {
          thumbnail = _.first(thumbnail);
        }
        if (_.isObject(thumbnail) && thumbnail.$) {
          thumbnail = thumbnail.$;
        }
        obj.media = val.media || {};
        obj.media.thumbnail = thumbnail;
      }
      //grab media content if exists
      if (val['media:content']) {
        var content = val['media:content'];
        if (_.isArray(content)) {
          content = _.first(content);
        }
        if (_.isObject(content) && content.$) {
          content = content.$;
        }
        obj.media = val.media || {};
        obj.media.content = content;
      }
      //now push the obj onto the stack
      output.items.push(obj);
    });
  }
  return output;
}