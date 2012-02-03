var xml2js = require('xml2js');
var fs = require('fs');

function testHTML(){
	var parser = new xml2js.Parser({trim:false, normalize:true, mergeAttrs:true});
	var string = fs.readFileSync('./html_test.txt', 'utf-8');
	parser.addListener('error', function(err){console.log('hi')});
	parser.addListener('err', function(err){console.log(err)});
	try{
	parser.parseString(string, function(err, jsonDOM){console.log(jsonDOM);});
	}catch(err){console.log('1');}

}

testHTML();
