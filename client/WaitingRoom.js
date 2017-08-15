WaitingRoom = function(game) {
	// Socket for server side communication
	this.socket;

	// Interface and basic room operations
	this.readyButton;
	this.room;
	this.backButton;
	this.tick;
	this.text_room;
	this.text_player;

	// Details of players
	this.playerID;
	this.username;
};

WaitingRoom.prototype = {

	// Initial the setting of waiting room
	init: function(data) {
		this.room = data.room;
		this.socket = data.socket;
		this.playerID = data.playerID;
		this.username = data.username;
	},

	// Load the resources needed in implementing interface
	preload: function() {
		this.load.spritesheet('readyButton', 'res/ready.png', 300, 100, 2);
		this.load.image('tick', 'res/tick.png');
		this.load.image('backButton', 'res/prevPage.png');
		this.tick = [];
		this.playerInfo = [];
		this.text_room = this.game.add.text(50,30,"Room No. "+this.room.roomID,{ font: "56px Arial", fill: "#263572"});
		this.text_player = this.game.add.text(50,100,"Players:",{ font: "40px Arial", fill: "#ff0044"});

	},

	
	create: function() {
		// Call function for handle chat room messages
		this.handleChat();

		var that = this;

		this.readyButton = this.game.add.button(200, 400, 'readyButton', this.ready,this,0,0,1,0);
		this.readyButton.width = 180;
		this.readyButton.height = 60;
		this.backButton = this.game.add.button(0, 400, 'backButton', this.back,this,null,null,null,null);

		
	// Display players' status
		for (var i = 0; i < 2; i++) {
			this.tick[i] = this.add.sprite(20, 200+i*50, 'tick');
			this.tick[i].visible = false;
			this.playerInfo[i] = this.game.add.text(70, 200+i*50, i+1+".   ", { font: "30px Arial", fill: "#FFFFFF"});

		}
		for (var i = 0; i < 2; i++) {
			if(!this.room.empty[i]){
				this.playerInfo[i].setText(i+1+".   "+this.room.players[i].playerName);
				if(this.room.players[i].ready)
					this.tick[i].visible = true;
			}
		}
		
	// Update the room status when a player enters or leaves
		this.socket.on('update_player', function(data) {
			that.room = data;
			for(var i = 0; i < 2; i++){
				if(!data.empty[i]){
					that.playerInfo[i].setText(i+1+".   "+that.room.players[i].playerName);
				}
				else{
					that.playerInfo[i].setText(" ");
				}

			}
		});

	// Update all players' status for ready
		this.socket.on('update_ready', function(data) {
			that.room = data;
			for(var i = 0; i <	data.numPlayer; i++){
				if(data.players[i].ready)
					that.tick[i].visible = true;
				else
					that.tick[i].visible = false;
			}
		});
		
	// Trigger the game (Let the game begins :D)
		this.socket.on('game_start', function() {
				that.game.state.start('Game', true, false, 
					{room: that.room, socket: that.socket, playerID: that.playerID, username: that.username});
		});

	},

	update: function() {
		
	},
	
	// Change the Ready state of a player
	ready: function() {
		this.room.players[this.playerID].ready = !this.room.players[this.playerID].ready;
		this.tick[this.playerID].visible = !this.tick[this.playerID].visible;
		this.socket.emit('ready', {roomID: this.room.roomID, playerID: this.playerID});

	},

	// Handle when a player leaves the room
	back: function() {
		this.socket.emit('back', {roomID: this.room.roomID, playerID: this.playerID});
		var chatarea = document.getElementById('chat');
		var ul = document.getElementById('messages');
		var form = document.getElementById('form');
		chatarea.removeChild(ul);
		chatarea.removeChild(form);
		this.game.state.start('Lobby', true, false, {username: this.username});

	},

	// handle socket communications for instant chat room system
	handleChat: function() {
		// HTML part
		var ul = document.createElement("ul");
		ul.setAttribute('id', "messages");
		var form = document.createElement("form");
		form.setAttribute('id', "form");
		var input = document.createElement("input");
		var button = document.createElement("button");
		var text = document.createTextNode("Send");
		button.appendChild(text);
		input.setAttribute('id', "m");
		form.appendChild(input);
		form.appendChild(button);
		var chatarea = document.getElementById('chat');
		chatarea.appendChild(ul);
		chatarea.appendChild(form);
		
		// On form submission, send the message through Socket.io
		var that = this;
		$('form').submit(function(){
			that.socket.emit('chat message', {msg: that.username+': '+$('#m').val(), room: that.room});
			$('#m').val('');
			return false;
		});
		var j = 0;
		
		// Socket.IO part
		that.socket.on('chat message', function(msg){
			$('#messages').append($('<li>').text(msg));
			$('#messages').scrollTop($('#messages')[0].scrollHeight);
		});
		
	}
};

