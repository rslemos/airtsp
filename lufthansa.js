console.log("start");

debugger;

var Promise = require('es6-promise').Promise;
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

	console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};

function debug(o) {
	console.log(JSON.stringify(o));
	return o;
}

function exit() {
	phantom.exit();
}

function render(to) {
	return function() { 
		console.log('rendering page to ' + to);
		page.render(to);
	};
}

function sb_getBoundingClientRect(selector) {
	// works because phantomjs do not scroll
	console.log("sb_getBoundingClientRect(" + selector + ")");
	return document.querySelector(selector).getBoundingClientRect();
}

function sb_isSelectorPresent(selector) {
	return document.querySelector(selector) !=  null;
}

function sb_isSelectorAbsent(selector) {
	return document.querySelector(selector) ==  null;
}

function sb_isSelectorFocused(selector) {
	return document.querySelector(selector) ==  document.activeElement;
}

function sb_doesSelectorContain(selector, contents) {
	return document.querySelector(selector).innerText == contents;
}

function isSelectorPresent(selector) {
	return function(page) {
		return page.evaluate(sb_isSelectorPresent, selector);
	};
}

function isSelectorAbsent(selector) {
	return function(page) {
		return page.evaluate(sb_isSelectorAbsent, selector);
	};
}

function isSelectorVisible(selector) {
	return function(page) {
		var rect = page.evaluate(sb_getBoundingClientRect, selector);
		return rect.width > 0 && rect.height > 0;
	};
}

function isSelectorFocused(selector) {
	return function(page) {
		return page.evaluate(sb_isSelectorFocused, selector);
	};
}

function doesSelectorContain(selector, contents) {
	return function(page) {
		return page.evaluate(sb_doesSelectorContain, selector, contents);
	};
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

function snapshot(prefix, interval) {
	return function() {
		var x = 0;

		var snapshot0 = function() {
			var snap = prefix + ("00000" + x++).slice(-6) + ".png";
			console.log("snapshot to " + snap);
			page.render(snap);
			setTimeout(snapshot0, interval);
		};

		snapshot0();
	}
};

console.log("page stuffed");

function setup() {
	console.log("setup()");
	return new Promise(function(resolve, reject) {
		console.log("opening lufthansa");

		page.open("http://www.lufthansa.com", function(status) {
			console.log("http://www.lufthansa.com: " + status);

			if (status == 'success')
				resolve();
			else
				reject("open");
		});
	})
	.then(snapshot("lufthansa", 50))
	.then(page.waitForPresence("#cl-country > option[value='BR']"))
	.then(page.waitForAndClick("#cl-country"))
	.then(page.waitForFocus("#cl-country"))
	.then(function() { page.write("BRA↵"); })
	.then(page.waitForPresence("#cl-language > option[value='pt']"))
//	.then(page.waitForAndClick("#cl-language"))
//	.then(page.waitForFocus("#cl-language"))
//	.then(function() { page.write("POR↵"); })
	.then(page.waitForAndClick("button"))
	.then(page.waitPageLoad());
}

function find(origin, origin_ext, destination, destination_ext, fromDate, toDate) {
	console.log("find(...)");
	return function(x) {
		console.log("will actually find(...)");
		return Promise
			.resolve(x)
			.then(page.waitForAndClick("#flightmanagerFlightsFormOrigin"))
			.then(page.waitForFocus("#flightmanagerFlightsFormOrigin"))
			.then(function() { page.write("A", 0x04000000); })
			.then(function() { page.write(origin); })
//			.then(page.waitPageLoad());
			.then(page.waitForAndClick("li[aria-label='" + origin_ext + "']"))
			.then(page.waitForAndClick("#flightmanagerFlightsFormDestination"))
			.then(page.waitForFocus("#flightmanagerFlightsFormDestination"))
			.then(function() { page.write("A", 0x04000000); })
			.then(function() { page.write(destination); })
			.then(page.waitForAndClick("li[aria-label='" + destination_ext + "']"))
			.then(page.waitForAndClick("#flightmanagerFlightsFormOutboundDateDisplay"))
			.then(page.waitForPresence("div#kosa-cal-modal-1 h2"))
			.then(page.waitForVisibility("div#kosa-cal-modal-1 h2"))
			.then(page.waitForContent("div#kosa-cal-modal-1 h2", "Partida"))
			.then(page.waitForAndClick("td[data-kosa-calendar-date='" + fromDate + "']"))
			.then(page.waitForPresence("div#kosa-cal-modal-2 h2"))
			.then(page.waitForVisibility("div#kosa-cal-modal-2 h2"))
			.then(page.waitForContent("div#kosa-cal-modal-2 h2", "Regresso"))
			.then(page.waitForAndClick("td[data-kosa-calendar-date='" + toDate + "']"))
			.then(page.waitForAbsence("div.date > div.months-wrapper"))
			.then(page.waitForAndClick("#flightmanager-tabpanel-1 button[type=submit]"))
			.then(page.waitPageLoad())
			.then(page.waitForPresence("section#inner"));
	};
}

function reset() {
	return function(x) {
		console.log("resetting");
		return Promise
			.resolve(x)
			.then(page.waitForAndClick("a#header-logo"))
			.then(page.waitPageLoad());
	};
}

setup()
.then(find("GIG", "Rio de Janeiro - International Brasil                             ", "FRA", "Frankfurt Alemanha", "2016-05-25", "2016-06-25"))
.then(render('lufthansaGIGFRA.png'))
.then(reset())
.then(find("GRU", "Sao Paulo - Guarulhos International Brasil                             ", "FRA", "Frankfurt Alemanha", "2016-05-25", "2016-06-25"))
.then(render('lufthansaGRUFRA.png'))
.then(exit)
.catch(function(error) {
	console.log("ERROR: " + error);
	render('error.png')();
	exit();
});

console.log("Waiting for queued promises to complete");
