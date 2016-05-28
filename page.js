(function() {
	var Promise = require('es6-promise').Promise;

	exports.create = function() {
		var page = require('webpage').create();

		page.viewportSize = {
			width: 1920,
			height: 1080
		};

		page.event.key['↵'] = page.event.key.Enter;
		page.event.key['↓'] = page.event.key.Down;
		page.event.key['⇥'] = page.event.key.Tab;
		page.event.key['⌫'] = page.event.key.Backspace;

		// debugging
		// page.onResourceRequested = function (request) {
		// 	//console.log('Request ' + JSON.stringify(request, undefined, 4));
		// 	console.log("Request: " + request.url);
		// };

		// page.onResourceReceived = function(response) {
		// 	console.log("Response: " + response.url);
		// }

		page.onError = function (msg, trace) {
			console.log(msg);
			trace.forEach(function(item) {
				console.log('  ', item.file, ':', item.line);
			});
		};

		page.onConsoleMessage = function(msg, lineNum, sourceId) {
			if (msg == 'Blocked a frame with origin "http://www.lufthansa.com" from accessing a frame with origin "http://1016557.fls.doubleclick.net". Protocols, domains, and ports must match.')
				return;

			console.log('[CONSOLE] ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
		};

		function debug(o) {
			console.log(JSON.stringify(o));
			return o;
		}

		// works because phantomjs do not scroll
		function sb_getBoundingClientRect(selector) { return document.querySelector(selector).getBoundingClientRect(); }

		function isSelectorPresent(selector) {
			function sb_isSelectorPresent(selector) { return document.querySelector(selector) !=  null; }
			return function(page) { return page.evaluate(sb_isSelectorPresent, selector); };
		}

		function isSelectorAbsent(selector) {
			function sb_isSelectorAbsent(selector) { return document.querySelector(selector) ==  null; }
			return function(page) { return page.evaluate(sb_isSelectorAbsent, selector); };
		}

		function isSelectorVisible(selector) {
			return function(page) {
				var rect = page.evaluate(sb_getBoundingClientRect, selector);
				return rect.width > 0 && rect.height > 0;
			};
		}

		function isSelectorFocused(selector) {
			function sb_isSelectorFocused(selector) { return document.querySelector(selector) ==  document.activeElement; }
			return function(page) { return page.evaluate(sb_isSelectorFocused, selector); };
		}

		function doesSelectorContain(selector, contents) {
			function sb_doesSelectorContain(selector, contents) { return document.querySelector(selector).innerText == contents; }
			return function(page) { return page.evaluate(sb_doesSelectorContain, selector, contents); };
		}

		page.click = function(selector) {
			console.log("clicking $('" + selector + "')");
			var rect = this.evaluate(sb_getBoundingClientRect, selector);

			var mouseX = rect.left + rect.width/2;
			var mouseY = rect.top + rect.height/2;

			debug({mouseX: mouseX, mouseY: mouseY});
			this.sendEvent('click', mouseX, mouseY);
		};

		page.write = function(text, modifier) {
			console.log("writing '" + text + "'");
			if (typeof(modifier)==='undefined') modifier = 0;

			for(var i=0; i<text.length; i++) {
				this.sendEvent('keypress', this.event.key[text.charAt(i)], null, null, modifier);
			}
		};

		page.waitFor = function(condition, whatNext, timeout) {
			var that = this;

			var tries = 0;

			var loop = function() {
				if (condition(that)) {
					whatNext();
				}
				else {
					if (timeout && tries++ == 20)
						timeout();
					else
						setTimeout(loop, 100);
				}

			};

			loop();
		};

		page.waitForSelector = function(selector, whatNext, timeout) {
			console.log("Waiting for " + selector);
			this.waitFor(isSelectorPresent(selector), whatNext, timeout);
		};

		page.waitForAndClick = function(selector) {
			var that = this;

			return function() {
				return new Promise(function(resolve, reject) {
					that.waitForSelector(selector, 
						function() {
							that.click(selector);
							resolve();
						}, 
						function() {
							reject("waitForAndClick(" + selector + ")");
						});
				});
			};
		};

		page.onLoadFinished = function(status) {
			console.log(">>>>> onLoadFinished: " + status);
		};

		page.onLoadStarted = function() {
			console.log("<<<<< onLoadStarted");
		};

		page.waitPageLoad = function() {
			var that = this;

			return function() {
				return new Promise(function(resolve, reject) {
					var prev = that.onLoadFinished;
					that.onLoadFinished = function(status) { 
						that.onLoadFinished = prev; 
						if (status == 'success')
							resolve();
						else
							reject("fail to continue");
					};
				});
			}
		};

		page.waitForPresence = function(selector) {
			return function() {
				return new Promise(function(resolve, reject) {
					console.log("waitForPresence." + selector);
					page.waitFor(isSelectorPresent(selector), resolve, function() { reject("waitForPresence." + selector); });
				});
			};
		};

		page.waitForAbsence = function(selector) {
			return function() {
				return new Promise(function(resolve, reject) {
					console.log("waitForAbsence." + selector);
					page.waitFor(isSelectorAbsent(selector), resolve, function() { reject("waitForAbsence." + selector); });
				});
			};
		};

		page.waitForContent = function(selector, contents) {
			return function() {
				return new Promise(function(resolve, reject) {
					console.log("waitForContent." + selector + "=" + contents);
					page.waitFor(doesSelectorContain(selector, contents), resolve, function() { reject("waitForContent." + selector + "=" + contents); });
				});
			};
		};

		page.waitForVisibility = function(selector) {
			return function() {
				return new Promise(function(resolve, reject) {
					console.log("waitForVisibility." + selector);
					page.waitFor(isSelectorVisible(selector), resolve, function() { reject("waitForVisibility." + selector); });
				});
			};
		};

		page.waitForFocus = function(selector) {
			return function() {
				return new Promise(function(resolve, reject) {
					console.log("waitForFocus." + selector);
					page.waitFor(isSelectorFocused(selector), resolve, function() { reject("waitForFocus." + selector); });
				});
			};
		};

		page.type = function(text, modifier) {
			return function() { page.write(text, modifier); };
		};

		page.snapshot = function(prefix, interval) {
			return function() {
				var x = 0;

				var snapshot0 = function() {
					// var snap = prefix + ("00000" + x++).slice(-6) + ".png";
					// console.log("snapshot to " + snap);
					page.render(prefix);
					setTimeout(snapshot0, interval);
				};

				snapshot0();
			}
		};

		console.log("page stuffed");

		return page;
	};
}).call(this);