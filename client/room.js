function Room(roomID) {
	this.roomID = roomID;
	this.playing = false;
	this.numPlayer = 0;
	this.players = [];
	this.firstTeam;
	this.currentTeam;
	this.currentPlayer;
	this.numCue = [];
	this.empty = [true, true];
	this.Player = require('./Player.js');
	this.nextEmpty = 0;
};

Room.prototype = {
	preload: function() {
		
	},

	addPlayer: function(playerName) {
		// Locate the first empty position
		if (this.empty[1]) this.nextEmpty = 1;
		if (this.empty[0]) this.nextEmpty = 0;
		
		// Initialize player details
		this.players[this.nextEmpty] = new this.Player();
		this.players[this.nextEmpty].playerName = playerName;
		this.players[this.nextEmpty].ready = false;
		
		// Add the Player to Room
		this.numPlayer++;
		this.empty[this.nextEmpty] = false;
		
		return this.nextEmpty;
	},

	removePlayer: function(playerID) {
		// a player is removed if and only there is a player exists
		if (!this.empty[playerID]) {
			this.empty[playerID] = true;
			this.numPlayer--;
		}
	}
};




module.exports = Room;
