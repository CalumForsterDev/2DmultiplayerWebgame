var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require("socket.io")(http);
var path = require("path");


//This object stores all the params for each player:
// {player: {name: , position: {posx: , posy: , velx: , vely: }}
var players = new Object();
players['baddie1'] = {id: 'baddie1',username: '/noname', position: {posx: 0, posy: 0, velx: 0, vely: 0}};
players['water'] = {height: 1200,username: '/noname'};
players['boat'] = {relesed: false, username: '/noname', height: 820};


//This will hold all the positions of moving objects
var timeAtStart = Date.now();
var iteration = 0;


app.get('/', function(req,res) {

	res.sendFile(path.join(__dirname+'/public/game.html'));	

});

app.get('/host', function(req, res) {

	res.sendFile(path.join(__dirname+'/public/gamehost.html'));

});

app.get('/backup', function(req, res) {

	res.sendFile(path.join(__dirname+'/public/backup.html'));

});

app.use(express.static('public'));

io.on('connection', function(socket) {

	var id = socket.id;
	var position;
	
	//Send the socketID back to client
	socket.emit('ID', id);
	
	//Send the time at start to client
	//this is so that the client can update
	//the location of moving objects
	socket.emit('time at start', timeAtStart);

	console.log('a user connected: ' + id);
	
	players[id] = {username: '/noname', position: {posx: 0, posy: 0, velx: 0, vely: 0}};
	
	//Listen for positions:
	socket.on('player data', function(positiondata) {
		
		players[id] = JSON.parse(positiondata);
		
		if (players[id].username.length > 8) {
		
			players[id].username = 'too long';
		
		}
	
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
	
	//listen for the boat to be released
	socket.on('release', function() {
		console.log('boat relesed');
		players['boat'].released = true;
		
		io.emit('released');
	
	});
	
	//listen for updates on the enemy
	socket.on('enemy', function(enemy) {
	
		players['baddie1'] = JSON.parse(enemy);
	
	
	});
	

	
	//Listen for usernames
	socket.on('username', function(name) {
	
		if( name.length > 10) {
		
			name = 'too long';
		
		}
		players[id].username = name;
		console.log('set new username');
	
	
	});
	
	
	
	
	
	socket.on('disconnect', function() {
		
		delete players[id];
	
	});

});

setInterval(function() {
	
	var time = Date.now();
	if( time - timeAtStart > 12000) {
		
		if (iteration++ >=5 ){

			var timeToGo = (players['water'].height/0.3)/30;
			timeToGo = Math.floor(timeToGo);
			io.emit('starting in', 'Next wave in ' + timeToGo);
			iteration = 0;
		}
	
		players['water'].height -= 0.2;
		
		if (players['water'].height <= 0) {
		
			//start again
			players['water'].height = 1200;
			players['boat'].height = 820;
			players['boat'].released = false;
			
			timeAtStart = Date.now();
		
		}

	}
	else {
		if(iteration++ >= 5) {
		
			var timeToGo = (12000-(time-timeAtStart))/1000;
			timeToGo = Math.floor(timeToGo);
			io.emit('starting in', 'Starting in ' + timeToGo);
			iteration = 0;
		
		}
		
	
	}
	
	if( players['boat'].released ){
	
		var distance = players['water'].height - players['boat'].height - 25;
		
		if (distance > 400) {
		
		}
		else {
		
			players['boat'].height += distance*0.05;
		}
		
	

	
	}
	
	
	

	
	io.emit('players', JSON.stringify(players));	
	
}, 30);



http.listen(3000, function() {
	
	console.log('listening');

});
