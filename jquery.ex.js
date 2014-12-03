// jquery.ex.js--utilities to use bililiteRange.ex.js with jQuery, allowing visual feedback, keyboard input, toolbar buttons, reading/writing
// (with AJAX; use mockjax (https://github.com/appendto/jquery-mockjax/) to implement other methods

// depends:  bililiteRange.ex.js and all its depends,  jquery.keymap.js, jquery.status.js,  jquery.savemonitor.js
// documentation: to be created
// Version 1.0

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

(function ($){
$.fn.ex = function (status, toolbar){
	// the toolbar, status bar and monitor are attached to the jQuery data. The actual state (clean, dirty, pending) is attached to the
	// bililiteRange data, so we can access it from ex.
	var toolbar = $(toolbar), status = $(status), self = this;
	this.data('ex.status', status).data('ex.toolbar', toolbar);
	this.each(function(){
		bililiteRange(this).ex(''); // make sure it's initialized (including the undo manager)
		var monitor = $(this).savemonitor();
		$(this).data('ex.monitor', monitor);
		var data = bililiteRange(this).data();
		data['save~state'] = monitor.state();
		monitor.on($.savemonitor.states, function(evt){
			data['save~state'] = evt.type;
		});
	});
	toolbar.keydown({keys: /\w/}, function (evt){
		// numbers/letters to activate the toolbar buttons (can tab/shift-tab over then enter, as normal)
		self.each(function(){
			bililiteRange(this).ex ('toolbar '+parseInt(evt.hotkeys, 36));
			evt.preventDefault();
			return false;
		});
	});
	// TODO: manage arrow keys
	return this;
}

// if we don't tell jQuery, it won't copy over custom data
$.event.fixHooks['bililiteRangeData'] = { props:['detail'] };
// modify the bililiteRangeData to allow specifying which item we're monitoring (this is something that only jQuery can do, not 
// plain events. use $(elem).on('bililiteRange', {name: 'nameOfItem}, function (){handler});
$.event.special['bililiteRangeData'] = {
	handle: function(evt){
		var desiredname = evt.data && evt.data.name;
		if (desiredname && evt.detail.name != desiredname) return;
		return evt.handleObj.handler.apply(this, arguments);
	}
}

// reading and writing files
bililiteRange.ex.createOption('directory', ''); // used as the $.post url for saving
bililiteRange.ex.createOption('file', 'Untitled');
bililiteRange.data('save~state', { // the string representing whether the text has been saved
	value: 'clean',
	enumerable: false,
	monitored: true
});


$.fn.simulateclick = function (){
	var self = this;
	self.addClass('highlight');
	setTimeout(function(){ self.removeClass('highlight') }, 400);
};


// The new commands

$.extend(bililiteRange.ex.commands, {
	sendkeys: function (parameter, variant){
		this.sendkeys(parameter);
	},
	
	toolbar: function (parameter, variant){
		var toolbar = $(this.element()).data('ex.toolbar');
		var which = parseInt(parameter);
		var target = $(this.element());
		if ($.isNumeric(which)){
			$('button', toolbar).eq(which).click().simulateclick();
		}else{
			$('button', toolbar).eq(0).focus();
		}
	},

	button: function (parameter, variant){
		var rng = this, $el = $(this.element());
		var toolbar = $el.data('ex.toolbar');
		var opts = {};
		if (variant){
			// use the simple form
			opts.name = parameter;
		}else{
			bililiteRange.ex.splitCommands(parameter, ' ').forEach(function(item){
				var match = /(\w+)=(.+)/.exec(item);
				if (!match) throw new Error('Bad syntax in button: '+item);
				opts[match[1]] = bililiteRange.ex.string(match[2]);
			});
		}
		if (!opts.name && opts.command) opts.name = opts.command;
		if (!opts.name && opts.monitor) opts.name = opts.monitor;
		if (!opts.name) throw new Error ('No name defined in button');
		if (!opts.command && opts.monitor) opts.command = opts.monitor+" toggle";
		if (!opts.command && bililiteRange.ex.commands[opts.name]) opts.command = opts.name;
		if (!opts.command) opts.command = 'sendkeys '+JSON.stringify(opts.name); // just insert the string
		
		function run(event){
			$el.data('ex.status').status({
				run: function(){
					rng.bounds('selection').ex(opts.command, '%%').select().scrollIntoView();
					rng.element().focus();
					return rng.exMessage;
				}
			});
			event.preventDefault();
		}

		var button = $('button[name='+JSON.stringify(opts.name)+']', toolbar);
		if (button.length == 0) button = $('<button>').appendTo(toolbar);
		button.attr({
			name: opts.name,
			'class': opts.name.replace(/~/g,'-'),
			title: opts.title
		}).click(run);
		if (opts.keys){
			$el.off('keydown', {keys: opts.keys});
			$el.keydown({keys: opts.keys}, function(event){
				button.simulateclick();
				run(event);
			});
		}
		if (opts.monitor) {
			var monitorValue;
			function setValue(value) {
				if (typeof value === "boolean") value = value ? 'on' : 'off';
				if (monitorValue) button.removeClass(monitorValue);
				button.addClass(value);
				monitorValue = value;
			}
			setValue (rng.data()[opts.monitor]);
			$(rng.element()).on('bililiteRangeData', {name: opts.monitor}, function(evt){
				setValue (evt.detail.value);
			})
		}
	},
	
	read: function (parameter, variant){
		var rng = this;
		$.get(parameter, function (text) {
			rng.text(text, 'end').select().element().focus();
		});
	},
	
	write: function(parameter, variant){
		var rng = this, data = this.data();
		var status = $(this.element()).data('ex.status');
		var monitor = $(this.element()).data('ex.monitor');
		if (parameter) data.file = parameter;
		monitor.clean(status.status({
			run: function() { return $.post(data.directory, {
				buffer: rng.all(),
				file: data.file
			}).then(
				function() { return data.file+' Saved' },
				function() { return new Error(data.file+' Not saved') }
			)},
			returnPromise: true
		}));
	}
});

})(jQuery);
