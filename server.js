var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('static'));

app.get('/', function(req, res) {
	res.end(fs.readFileSync('index.html'));
});

app.get('/view', function(req, res) {
	res.end(fs.readFileSync('view.html'));
});

app.get('/three', function(req, res) {
	res.end(fs.readFileSync('three.html'));
});

io.on('connection', function(socket){
	console.log('a user connected', socket.id);

	socket.on('deviceorientation', function(data) {
		// console.log(data);
		socket.broadcast.emit('deviceorientation', data);
	});
	socket.on('btnFwd', function(data) {
		// console.log('fwd');
		socket.broadcast.emit('btnFwd', data);
	});
	socket.on('btnBck', function(data) {
		// console.log(data);
		socket.broadcast.emit('btnBck', data);
	});
	socket.on('shoot', function(data) {
		// console.log(data);
		socket.broadcast.emit('shoot', data);
	});
	socket.on('addBtn', function(data) {
		console.log(data);
		socket.broadcast.emit('add', data);
	});
	// socket.on('devicemotion', function(data) {
	// 	socket.broadcast.emit('devicemotion', data);
	// });
	// setInterval(function() {
	// 	console.log('shooting');
	// 	socket.broadcast.emit('shoot', {});
	// }, 5000);
});

http.listen(3000, function(err) {
	if(err) throw err;
	console.log('Express server listening on port - ' + 3000);
});
