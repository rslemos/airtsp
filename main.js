var page = require('./page').create();
var lufthansa = require('./lufthansa.js');

function render(to) {
	return function() {
		console.log('rendering page to ' + to);
		page.render(to);
	};
}

lufthansa.connect(page)
.find("GIG", "FRA", "2016-06-25", "2016-07-25")
.then(render('lufthansaGIGFRA.png'))
.reset()
.find("GRU", "FRA", "2016-06-25", "2016-07-25")
.then(render('lufthansaGRUFRA.png'))
.catch(function(error) {
	console.log("ERROR: " + error);
	render('error.png')();
})
.then(phantom.exit)
;

console.log("Waiting for queued promises to complete");
