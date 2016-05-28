var lufthansa = require('./lufthansa.js');

var connection = lufthansa.connect();

connection.setup()
.then(connection.find("GIG", "FRA", "2016-06-25", "2016-07-25"))
.then(connection.render('lufthansaGIGFRA.png'))
.then(connection.reset())
.then(connection.find("GRU", "FRA", "2016-06-25", "2016-07-25"))
.then(connection.render('lufthansaGRUFRA.png'))
.catch(function(error) {
	console.log("ERROR: " + error);
	connection.render('error.png')();
})
.then(phantom.exit)
;

console.log("Waiting for queued promises to complete");
