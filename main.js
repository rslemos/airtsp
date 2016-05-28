var lufthansa = require('./lufthansa.js');

var connection = lufthansa.connect();

connection
.find("GIG", "FRA", "2016-06-25", "2016-07-25")
.render('lufthansaGIGFRA.png')
.reset()
.find("GRU", "FRA", "2016-06-25", "2016-07-25")
.render('lufthansaGRUFRA.png')
.catch(function(error) {
	console.log("ERROR: " + error);
	connection.render('error.png')();
})
.then(phantom.exit)
;

console.log("Waiting for queued promises to complete");
