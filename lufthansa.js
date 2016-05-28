return (function() {
	var lufthansa_airports = [];
	lufthansa_airports['GIG'] = { ext: "Rio de Janeiro - International Brasil                             " };
	lufthansa_airports['FRA'] = { ext: "Frankfurt Alemanha" };
	lufthansa_airports['GRU'] = { ext: "Sao Paulo - Guarulhos International Brasil                             " };

	var page = require('./page').create();
	var Promise = require('es6-promise').Promise;

	exports.render = function(to) {
		return function() { 
			console.log('rendering page to ' + to);
			page.render(to);
		};
	}

	exports.setup = function() {
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
		.then(page.snapshot("lufthansa.png", 10))
		.then(page.waitForPresence("#cl-country > option[value='BR']"))
		.then(page.waitForAndClick("#cl-country"))
		.then(page.waitForFocus("#cl-country"))
		.then(page.type("BRA↵"))
		.then(page.waitForPresence("#cl-language > option[value='pt']"))
	//	.then(page.waitForAndClick("#cl-language"))
	//	.then(page.waitForFocus("#cl-language"))
	//	.then(function() { page.write("POR↵"); })
		.then(page.waitForAndClick("button"))
		.then(page.waitPageLoad());
	}

	exports.find = function(origin, destination, fromDate, toDate) {
		return function(x) {
			console.log("will actually find(...)");
			return Promise
				.resolve(x)
	// origin airport
				.then(page.waitForAndClick("#flightmanagerFlightsFormOrigin"))
				.then(page.waitForFocus("#flightmanagerFlightsFormOrigin"))
				.then(page.type("A", 0x04000000))
				.then(page.type(origin))
	//			.then(page.waitPageLoad());
				.then(page.waitForAndClick("li[aria-label='" + lufthansa_airports[origin].ext + "']"))

	// destination airport
				.then(page.waitForAndClick("#flightmanagerFlightsFormDestination"))
				.then(page.waitForFocus("#flightmanagerFlightsFormDestination"))
				.then(page.type("A", 0x04000000))
				.then(page.type(destination))
				.then(page.waitForAndClick("li[aria-label='" + lufthansa_airports[destination].ext + "']"))

	// dates
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

	// submit
				.then(page.waitForAndClick("#flightmanager-tabpanel-1 button[type=submit]"))
				.then(page.waitPageLoad())
				.then(page.waitForPresence("section#inner"));
		};
	}

	exports.reset = function() {
		return function(x) {
			console.log("resetting");
			return Promise
				.resolve(x)
				.then(page.waitForAndClick("a#header-logo"))
				.then(page.waitPageLoad());
		};
	}

	return exports;
}).call(this);
