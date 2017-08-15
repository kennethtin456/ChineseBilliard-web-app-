var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var dbConfig = require('./db');
var mongoose = require('mongoose');

// Connect to DB
mongoose.connect(dbConfig.url);

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Config engine for compiling jade file to html
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Setup for easier file path and url
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(__dirname));

// Configuring Passport from passport.js
var passport = require('passport');
var expressSession = require('express-session');

// Initialize Passport
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

 // Using the flash middleware provided by connect-flash to store messages in session and displaying in templates
var flash = require('connect-flash');
app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);


app.use(express.static(__dirname + '/client'));

// Load Room functions from room.js
var Room = require('./client/room');
// Initialize game room settings
var rooms = [];
var totalRooms = 0;
var emptyRoom = [];


var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

app.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.sendFile(path.join(__dirname+'/client/index.html'));
		//res.render(path.join(__dirname+'/client/index'), { message: req.flash('message') });
	});

	/* Handle Login POST */
app.post('/login', passport.authenticate('login', {
		successRedirect: '/game',
		failureRedirect: '/',
		failureFlash : true  
	}));
app.post('/fblogin', passport.authenticate('fblogin', {
		successRedirect: '/game',
		failureRedirect: '/',
		failureFlash : true  
}));

app.get('/signup', function(req, res){
		res.sendFile(path.join(__dirname+'/client/register.html'));
		//res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
app.post('/signup', passport.authenticate('signup', {
		successRedirect: '/',
		failureRedirect: '/signup',
		failureFlash : true  
	}));
	/* GET Home Page */
app.get('/game', isAuthenticated, function(req, res){
		//res.sendFile(path.join(__dirname+'/client/game.html'));
		res.render(path.join(__dirname+'/client/game'), { user: req.user});

});

//app.use('/', routes);
//.use(express.static(__dirname + '/views'), routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// Handle real-time communication between players and server
io.sockets.on('connection', function(socket) {
	
	// Modify room status when a player quits
   	socket.on('disconnect', function() {
      for (var i = 0; i < totalRooms; i++) {
      	for (var j = 0; j < 2; j++) {
      	
      		if (!rooms[i].empty[j]) {
      			
	      		if (rooms[i].players[j].socketID == socket.id) {

	      			rooms[i].removePlayer(j);
	      			socket.broadcast.to(i)
							.emit('update_player', rooms[i]);
					
					if (rooms[i].playing) {
						socket.broadcast.to(i)
							.emit('opponent_disconnected');
						/*
						var another;
						if (j == 0) another = 1;
						else another = 0;
						*/
						for (var k = 0; k < 2; k++) {
							if (k != i && !rooms[i].empty[k]) {
								rooms[i].removePlayer(k);
							}
						}
					}
					if (rooms[i].numPlayer == 0) {
						emptyRoom[i] = true;
						totalRooms--;
						console.log('delete room['+i+'] due to disconnect');
						socket.broadcast.to('lobby')
									.emit('update_lobby', {numRoom: totalRooms, room: rooms, emptyRoom: emptyRoom});
					}
	      		}
	      	}
      	}
      }

	});
   
	// Handling a player for entering the lobby 
	socket.on('lobby', function() {
		console.log('someone joined lobby');
		
		// Update status of lobby for other clients
		socket.join('lobby');
		socket.emit('update_lobby', {numRoom: totalRooms, room: rooms, emptyRoom: emptyRoom});
		socket.to('lobby')
						.emit('update_lobby', {numRoom: totalRooms, room: rooms, emptyRoom: emptyRoom});
	});
	
	// Handle a player for joining a room
	socket.on('join', function(data) {
		
		// Room is already full
		if (rooms[data.room].numPlayer >= 2) {
			socket.emit('join_reply', {room: rooms[data.room], playerID: player, success: false});
		}
		else // Room is available
		{
			socket.leave('lobby');
			socket.join(data.room);
			var player = rooms[data.room].addPlayer(data.name);
			console.log(data.name+' joined room['+data.room+']');
			// Update room and lobby status
			socket.emit('join_reply', {room: rooms[data.room], playerID: player, success: true});
			socket.broadcast.to('lobby')
								.emit('update_lobby', {numRoom: totalRooms, room: rooms, emptyRoom: emptyRoom});
			socket.broadcast.to(data.room)
							.emit('update_player', rooms[data.room]);
			rooms[data.room].players[player].socketID = socket.id;
			handleWaitingRoom(socket);
		}
	});
	
	// Handle a player for creating a new room
	socket.on ('create', function(data) {
		socket.leave('lobby');
		var nextRoom = findNextRoom();
		totalRooms++;
		socket.join(nextRoom);
		rooms[nextRoom] = new Room(nextRoom);
		emptyRoom[nextRoom] = false;
		rooms[nextRoom].addPlayer(data);
		console.log(data + ' created room[' + nextRoom + ']');
		console.log('Total number of rooms: ' + totalRooms);
		
		// Update room and lobby status
		socket.emit('create_room', rooms[nextRoom]);
		socket.broadcast.to('lobby')
							.emit('update_lobby', {numRoom: totalRooms, room: rooms, emptyRoom: emptyRoom});
		socket.broadcast.to(data.room)
						.emit('update_player', rooms[data.room]);
		rooms[nextRoom].players[0].socketID = socket.id;
		handleWaitingRoom(socket);
	});
	
	socket.on('chat message', function(data){
		socket.broadcast.to(data.room.roomID)
						.emit('chat message', data.msg);
		socket.emit('chat message', data.msg);
	});
	
});

// Return the index for an empty room
findNextRoom = function() {
	for (var i = 0; i < rooms.length; i++) {
		if (emptyRoom[i]) {
			return i;
		}
	}
	return rooms.length;
}

// Handling a player for waiting in a room
handleWaitingRoom = function(socket) {
	
	/*
	// Message system through socket.io
	socket.on('chat message', function(data){
		socket.broadcast.to(data.room.roomID)
						.emit('chat message', data.msg);
		socket.emit('chat message', data.msg);
		console.log('msg');
	});
	*/
	
	// Setup when a player changes statue from ready
	// and vice versa
	socket.on('ready', function(data) {
		rooms[data.roomID].players[data.playerID].ready = !rooms[data.roomID].players[data.playerID].ready;
		socket.broadcast.to(data.roomID)
						.emit('update_ready', rooms[data.roomID]);
		var ready_cnt = 0;
		var all_ready = true;
		for (var i = 0; i < 2; i++) {
			if (!rooms[data.roomID].empty[i]) {
				// Count number of players
				if (rooms[data.roomID].players[i].ready) {
					ready_cnt++;
				}
				// Check status of players
				if (!rooms[data.roomID].players[i].ready) {
					all_ready = false;
				}
			}
		}
		// Begin the game when everything is ready
		if (ready_cnt == 2 && all_ready){
			var ran = Math.floor(Math.random() * 2);
			if (ran == 0) {
				rooms[data.roomID].currentPlayer = 0;
			} else {
				rooms[data.roomID].currentPlayer = 1;
			}
			rooms[data.roomID].playing = true;
			socket.broadcast.to(data.roomID).emit('game_start');
			socket.emit('game_start');
		}
		handleGame(socket);
	});
	
	// Handle a player for going back to the lobby
	socket.on('back', function(data) {
		if (emptyRoom[data.roomID]) return;
		rooms[data.roomID].removePlayer(data.playerID);
		
		if (rooms[data.roomID].numPlayer <= 0) {
			emptyRoom[data.roomID] = true;
			totalRooms--;
			
			// Update room and lobby status
			socket.broadcast.to('lobby')
						.emit('update_lobby', {numRoom: totalRooms, room: rooms, emptyRoom: emptyRoom});
		}
		socket.broadcast.to(data.roomID)
						.emit('update_player', rooms[data.roomID]);
	});


}

// Handle game status for all kinds of actions
handleGame = function(socket) {
	
	// Initialize room status
	socket.on ('start', function(data) {
		socket.emit('start_game', rooms[data.roomID].currentPlayer);
		socket.broadcast.to(data.roomID)
						.emit('start_game', rooms[data.roomID].currentPlayer);
	});
	
	// Switch players' turn and update room status
	socket.on ('next_player_chase', function() {
		if (rooms[data.roomID].currentPlayer == 0){
			rooms[data.roomID].currentPlayer = 1;
		} else {
			rooms[data.roomID].currentPlayer = 0;
		}
		socket.emit('chase', rooms[data.roomID].currentPlayer);
		socket.broadcast.to(data.roomID)
						.emit('chase', rooms[data.roomID].currentPlayer);
	});
	
	// Handle a player for completing a turn
	socket.on('finish_action', function(data) {
		if (rooms[data.roomID].currentPlayer == 0){
			rooms[data.roomID].currentPlayer = 1;
		} else {
			rooms[data.roomID].currentPlayer = 0;
		}
		socket.emit('turn', rooms[data.roomID].currentPlayer);
		socket.broadcast.to(data.roomID)
						.emit('turn', rooms[data.roomID].currentPlayer);
	});
	
	// Handle a player for winning (or losing) the game
	socket.on('end_game', function(data) {
		socket.emit('result', data.winner);
		socket.broadcast.to(data.roomID)
						.emit('result', data.winner);
	});
	
	// Update the room status as game is over
	socket.on('update_game', function(data) {
		socket.broadcast.to(data.room.roomID)
						.emit('game_update', data);
	});
}

