Lobby = function(game) {
	// Socket.IO
	this.socket;
	
	// User details
	this.username;
	this.userID;

	// Rooms environments
	this.rooms;
	this.emptyRoom;
	this.roomButtons;
	this.newRoomButton;
	this.roomInfo;
	this.roomGroup;
	this.nextPage;
	this.prevPage;

	this.roomFull;

	this.currentPage;
	this.roomsPerPage;

	this.roomButtonHeight;
	this.roomButtonWidth;

};

Lobby.prototype = {
	init: function(data) {
		this.username = data.username;
	},
	
	// Load resources for the interface and initialize settings
	preload: function() {
		this.roomGroup = this.game.add.group();
		this.rooms = [];
		this.roomButtons = [];
		this.roomInfo = [];
		this.load.image('roomButton', 'res/roomButton.png');
		this.load.spritesheet('newRoom', 'res/newRoom.png', 455, 331, 2);
		this.load.image('nextPage', 'res/nextPage.png');
		this.load.image('nextPageBlack', 'res/nextPageBlack.png');
		this.load.image('prevPage', 'res/prevPage.png');
		this.load.image('prevPageBlack', 'res/prevPageBlack.png');
		this.load.image('roomFull', 'res/roomFull.png');
		this.roomButtonHeight = 100;
		this.roomButtonWidth = 300;
		this.roomsPerPage = 6;
		this.currentPage = 1;
	},

	create: function() {
		
		this.socket = io();

		var that = this;
		this.socket.on('userInfo', function(data) {
			that.username = data.username;
			that.t.setText(data.username+"\n"+data.email);
		});
		
		this.socket.on('update_lobby', function(data) {
			that.rooms = data.room;
			that.emptyRoom = data.emptyRoom;
			that.display_room();
		});
		
		this.socket.emit('lobby');
		var down = this.add.sprite(1000,1000,'newRoomDown');
		this.newRoomButton = this.game.add.button(500, this.roomButtonHeight*this.roomsPerPage/2+50, 'newRoom', this.new_room,this, 0,0,1,0);
		this.newRoomButton.width = 150;
		this.newRoomButton.height = 100;
		this.roomFull = this.game.add.button(400, 200, 'roomFull', this.room_full, this, null,null,null,null);
		this.roomFull.visible = false;
		this.roomFull.inputEnable = false;

	},
	
	update: function() {
		
	},

	display_room: function() {
		var k = 0;
		var roomCnt = 0;
		this.roomGroup.removeAll(true, true);
		for(var i = 0; i < this.rooms.length; i++){
			if(!this.emptyRoom[i]){
				roomCnt++;
				if(roomCnt > (this.currentPage-1)*this.roomsPerPage && roomCnt <= this.currentPage*this.roomsPerPage){
					var x, y;
					if(k % 2 == 0){
						x = 0;
						y = (Math.round(k / 2)) * this.roomButtonHeight;
					}
					else{
						x = this.roomButtonWidth;
						y = (Math.round(k / 2) - 1) * this.roomButtonHeight;
					}
					this.roomButtons[i] = this.game.add.button(x, y, 'roomButton', this.join_room, this,null,null,null,null);
					this.roomButtons[i].width = this.roomButtonWidth;
					this.roomButtons[i].height = this.roomButtonHeight;
					this.roomButtons[i].name = i;
					var str = i + "                                      "+this.rooms[i].numPlayer+"/2"+"\n";
					for(var j = 0; j < 2; j++){
						if(!this.rooms[i].empty[j])
							str = str + this.rooms[i].players[j].playerName + "\n";
					}
					this.roomInfo[i] = this.game.add.text(x+10, y, str, {font: "20px Arial", fill: "#000000", align: "left" });
					this.roomGroup.add(this.roomButtons[i]);
					this.roomGroup.add(this.roomInfo[i]);
					k++;
				}
			}
		}
		
		// Split rooms into pages
		if(roomCnt > this.currentPage * this.roomsPerPage)
			this.nextPage = this.game.add.button(this.roomButtonWidth+25, this.roomButtonHeight*this.roomsPerPage/2, 'nextPage', this.next_page, this, null,null,null,null);
		else
			this.nextPage = this.add.sprite(this.roomButtonWidth+25, this.roomButtonHeight*this.roomsPerPage/2, 'nextPageBlack');
		if(this.currentPage > 1)
			this.prevPage = this.game.add.button(this.roomButtonWidth-75, this.roomButtonHeight*this.roomsPerPage/2, 'prevPage', this.prev_page, this, null,null,null,null);
		else
			this.prevPage = this.add.sprite(this.roomButtonWidth-75, this.roomButtonHeight*this.roomsPerPage/2, 'prevPageBlack');
		this.roomGroup.add(this.nextPage);
		this.roomGroup.add(this.prevPage);
	},
	
	// Assign a specific player to a specific room
	join_room: function (button) {
		var that = this;
		
		// Update the room with new player
		this.socket.emit('join', {name: this.username, room: button.name});
		// Wait for client's reply
		this.socket.on('join_reply', function(data) {
			if(data.success == true)
				that.game.state.start('WaitingRoom', true, false, {room: data.room, socket: that.socket, playerID: data.playerID, username: that.username});
			else{
				that.roomFull.visible = true;
				that.roomFull.inputEnable = true;
			}

		});
	},

	// Create a new room and update room status
	new_room: function () {
		var that = this;
		this.socket.emit('create', this.username);
		this.socket.on('create_room', function(data) {

			that.game.state.start('WaitingRoom', true, false, {room: data, socket: that.socket, playerID: 0, username: that.username});
		});

	},

	// Browse pages of rooms
	next_page: function() {
		this.currentPage++;
		this.display_room();
	},

	prev_page: function() {
		this.currentPage--;
		this.display_room();
	},

	// Prohibit entering of a full room
	room_full: function() {
		this.roomFull.visible = false;
		this.roomFull.inputEnable = false;
	}

};

