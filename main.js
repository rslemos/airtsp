var lufthansa = require('./lufthansa.js');

lufthansa.setup()
.then(lufthansa.find("GIG", "FRA", "2016-06-25", "2016-07-25"))
.then(lufthansa.render('lufthansaGIGFRA.png'))
.then(lufthansa.reset())
.then(lufthansa.find("GRU", "FRA", "2016-06-25", "2016-07-25"))
.then(lufthansa.render('lufthansaGRUFRA.png'))
.catch(function(error) {
	console.log("ERROR: " + error);
	lufthansa.render('error.png')();
})
.then(lufthansa.exit)
;

console.log("Waiting for queued promises to complete");
