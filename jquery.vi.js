// moving toward an implementation of vi for jQuery
// (http://pubs.opengroup.org/onlinepubs/9699919799/utilities/vi.html)

// depends:  bililiteRange.ex.js and all its depends,  jquery.keymap.js, jquery.savemonitor.js, jquery.status.js, jquery.livesearch.js
// documentation: to be created
// Version 0.91

// Copyright (c) 2014 Daniel Wachsstock
// MIT license:
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

(function($){

$.fn.vi = function(status, toolbar, exrc){
	this.exInit(status, toolbar);
	this.ex(defaultvicommands);
	var self = this;
	if (exrc) $.get(exrc).then(function(commands){
		self.ex(commands); // note that this is done asynchronously, so the user may be editing before this gets executed
	});
	return this;
}


// TODO: simplify this
function executeCommand (rng, command, defaultAddress){
	// returns a function that will run command (if not defined, then will run whatever command is passed in when executed)
	return function (text){
		var data = rng.data();
		rng.bounds('selection').ex(command || text, defaultAddress).select().scrollIntoView();
		if (data.motionCommand && !rng.is(data.motionStart)){
			rng.union(data.motionStart).ex(data.motionCommand);
			data.motionCommand = undefined;
			data.motionStart = undefined;
		}
		data.count = 0; // reset
		data.register = undefined;
		return rng.exMessage;
	};
}

var body = $('body');

/*------------ Set up default options ------------ */
// RE's for searching
bililiteRange.ex.createOption('word', /^|$|\W+|\w+/);
bililiteRange.ex.createOption('bigword', /^|$|\s+|\S+/);

// track tab size
bililiteRange.data ('tabSize', {monitored: true});
body.on('bililiteRangeData', {name: 'tabSize'}, function (evt){
	var style = evt.target.style;
	style.tabSize =
	style.OTabSize =
	style.MozTabSize = evt.detail.value; // for browsers that support this.
});
 
$.extend(bililiteRange.ex.commands, {
	find: function (parameter, variant){
		if (parameter.charAt(0) == '/'){
			// parse as a RegExp
			parameter = bililiteRange.ex.createRE (parameter, this.data().ignorecase);
		}else{
			// parse as an option
			parameter = this.data()[parameter];
		}
		this.find(parameter, undefined, variant);
	},
	select: function (parameter, variant){
		this.bounds(parameter).select();
	},
	vi: function (parameter, variant){
		var state = this.data();
		parameter = parameter || 'VISUAL';
		state.exmode = parameter;
	},
	'vi~colon': function (){
		var $el = $(this.element());
		$el.data('ex.status').status({
			prompt: ':',
			run: function(command) { $el.ex(command) },
			returnPromise: true
		}).then( // make sure we return focus to the text! It would be nice to have a finally method
			function(e) {el.focus()},
			function(e) {el.focus()}
		);
	},
});

var defaultvicommands = [
	'map! ^z undo',
	'map! ^y redo',
	'map! {esc} vi',
	'map : vi~colon',
	'map a "select endbounds | vi INSERT"',
	'map A "select EOL | vi INSERT"',
	'map b "find! word | select endbounds"',
	'map B "find! bigword | select endbounds"',
	'map e "find word | select endbounds"',
	'map E "find bigword | select endbounds"',
	'map i "select startbounds | vi INSERT"',
	'map i "select EOL | vi INSERT"',
	'map o ".a | vi INSERT"',
	'map O ".-1a | vi INSERT"',
	'map 0 "select BOL"',
	'map $ "select EOL"',
	'map ^ "select BOL | find /\\\\S/ | select startbounds"'
].join('|');

})(jQuery);