var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require("socket.io")(http);
var path = require("path");


//This object stores all the params for each player:
// {player: {posx, posy, velx, vely}}
var players = new Object();


app.get('/', function(req,res) {

	res.sendFile(path.join(__dirname+'/public/game.html'));	

});

app.get('/play', function(req, res) {

	res.sendFile(path.join(__dirname+'/public/game.html'));

});

app.use(express.static('public'));

io.on('connection', function(socket) {

	var id = socket.id;
	var position;
	
	//Send the socketID back to client
	socket.emit('ID', id);

	console.log('a user connected: ' + id);
	
	players[id] = {posx: 0, posy: 0, velx: 0, vely: 0};
	
	//Listen for positions:
	socket.on('player position', function(positiondata) {
	
		players[id] = JSON.parse(positiondata);
	
	});
	
	//Listen for the jump events:
	socket.on('jump', function() {
	
		//A player jumped, so broadcast this to everyone:
		socket.broadcast.emit('jump', id);
	
	});
	
	//Listen for score increases and level up the player
	socket.on('level up', function() {
	
		//A player leveled up so broadcast to everyone else:
		socket.broadcast.emit('level up', id);
	
	});
	
	socket.on('disconnect', function() {
		
		delete players[id];
	
	});

});

setInterval(function() {
	
	io.emit('players', JSON.stringify(players));	
	
}, 10);

app.use(express.static('public'));

http.listen(3000, function() {
	
	console.log('listening');

});




