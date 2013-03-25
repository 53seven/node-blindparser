// string test.js
// why does this not work?

var vows = require('vows');
var assert = require('assert');

var parser = require('../lib/feed.js');

vows.describe('bindparser').addBatch({

  'rss tests':{
    topic:function(){
      parser.parseURL('http://rss.cnn.com/rss/cnn_topstories.rss', {}, this.callback);
    },
    'response is not null':function(err, docs){
      assert.isNull(err);
      assert.isNotNull(docs);
    },
    'response is properly formatted':function(err, docs){
      assert.equal(docs.type, 'rss');
      assert.isObject(docs.metadata);
      assert.isArray(docs.items);
    }
  },
  'atom tests':{
    topic:function(){
      parser.parseURL('http://www.blogger.com/feeds/10861780/posts/default', {}, this.callback);
    },
    'response is not null':function(err, docs){
      assert.isNull(err);
      assert.isNotNull(docs);
    },
    'response is properly formatted':function(err, docs){
      assert.equal(docs.type, 'atom');
      assert.isObject(docs.metadata);
      assert.isArray(docs.items);
    },
    'response contains items': function (err, docs) {
      assert.isArray(docs.items);
      assert.ok(docs.items.length > 0);
    },
  },
  'feedburner tests': {
    topic: function() {
      parser.parseURL('http://feeds.feedburner.com/TechCrunch', this.callback);
    },
    'response is not null':function(err, docs){
      assert.isNull(err);
      assert.isNotNull(docs);
    },
    'response is formatted as rss':function(err, docs){
      assert.equal(docs.type, 'rss');
      assert.isObject(docs.metadata);
      assert.isArray(docs.items);
    },
    'response contains items':function(err, docs) {
      assert.isArray(docs.items);
      assert.ok(docs.items.length > 0);
    },
    'response contains images':function(err, docs) {
      assert.ok(docs.metadata.image);
      docs.items.forEach(function(item){
        assert.ok(item.media.thumbnail);
      });
    }
  },
  'oddities':{
    'empty xml':{
      topic:function(){
        parser.parseString('<?xml version="1.0" ecoding="UTF-8"?>', {}, this.callback);
      },
      'returns an error && docs is null':function(err, docs){
        assert.isNotNull(err);
        assert.isNull(docs);
      }
    }
  },
  'craigslist':{
    topic: function () {
      parser.parseURL('http://portland.craigslist.org/sof/index.rss', this.callback);
    },
    'response is formatted as rss': function (err, docs) {
      assert.equal(docs.type, 'rss');
      assert.isObject(docs.metadata);
      assert.isArray(docs.items);
    },
    'response contains items': function (err, docs) {
      assert.isArray(docs.items);
      assert.ok(docs.items.length > 0);
    },
    'response items have titles': function (err, docs) {
      assert.isArray(docs.items);
      assert.ok(docs.items.length > 0);
      assert.isNotNull(docs.items[0].title);
    },
    'response items have links': function (err, docs) {
      assert.isArray(docs.items);
      assert.ok(docs.items.length > 0);
      assert.isNotNull(docs.items[0].link);
    },
    'response items have desc': function (err, docs) {
      assert.isArray(docs.items);
      assert.ok(docs.items.length > 0);
      assert.isNotNull(docs.items[0].desc);
    },
    'response items have date': function (err, docs) {
      assert.isArray(docs.items);
      assert.ok(docs.items.length > 0);
      assert.isNotNull(docs.items[0].date);
    }
  }
}).export(module);
