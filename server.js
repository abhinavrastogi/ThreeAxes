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

io.on('connection', function(socket){
	console.log('a user connected', socket.id);

	socket.on('deviceorientation', function(data) {
		socket.broadcast.emit('deviceorientation', data);
	});
	socket.on('devicemotion', function(data) {
		socket.broadcast.emit('devicemotion', data);
	});
});

http.listen(3000, function(err) {
	if(err) throw err;
	console.log('Express server listening on port - ' + 3000);
});
