Game = function (game) {
	this.socket;
	this.playerID;
	this.username;
	this.room;


	this.table;
	this.cue;
	this.redChess;
	this.redChessStatus;
	this.blackChess;
	this.blackChessStatus;
	this.shootChess;
	this.shootChessStatus;
	this.shootChessImg;
	this.opponentShootChess;
	this.angle;
	this.hole;
	this.freeCircle;
	this.guidingLine;
	this.shootChessOnCircle;
	this.powerBar;
	this.powerLine;

	this.result;
	this.resultBg;
	this.backButton;
	this.giveupButton;
	this.shootChessButton;


	this.tableWidth;
	this.tableOffsetX;
	this.tableOffsetY;
	this.buttonWidth;
	this.buttonHeight;
	this.buttonOffsetX;
	this.buttonOffsetY;
	this.powerBarOffsetX;
	this.powerBarOffsetY;
	this.powerBarWidth;
	this.powerBarHeight;
	this.chessRadius;
	this.holeRadius;
	this.holeOffset;
	this.edgeWidth;
	this.playerStatus;
	this.freeCircleRadius;
	this.freeCircleOffset;
	this.cueWidth;
	this.cueHeight;
	this.guidingLineWidth;
	this.guidingLineHeight;

	this.slope;
	this.yintercept;

	this.shootChessKilled;

	this.maxSpeed;
	this.totalCue;
	this.chasing;

	this.playerName = [];
	this.numCue = [];
	this.textHint;
	this.textStatus;
	this.warning;
};

Game.prototype = {

	// Initialize game status
	init: function(data) {
		this.room = data.room;
		this.socket = data.socket;
		this.playerID = data.playerID;
		this.username = data.username;
		this.mode = data.mode;
	},
	
	// Load necessary resources
	preload: function() {
		
		// Load images
		this.load.image('table', 'res/table.png');
		this.load.image('shootChess', 'res/shootChess.png');
		this.load.image('blackChess', 'res/blackChess.png');
		this.load.image('redChess', 'res/redChess.png');
		this.load.image('hole', 'res/hole.png');
		this.load.image('cue', 'res/cue.png');
		this.load.image('guidingLine', 'res/guidingLine.png');
		this.load.image('resultBg', 'res/result.png');
		this.load.spritesheet('backButton', 'res/backButton.png', 100, 30, 2);
		this.load.spritesheet('giveupButton', 'res/giveupButton.png', 100, 30, 2);
		this.load.spritesheet('shootChessButton', 'res/shootChessButton.png', 100, 30, 2);
		this.load.image('powerBar', 'res/powerBar.png');
		this.load.image('powerLine', 'res/powerLine.png');
	
		// Initialize constant values
		this.tableWidth = 400;
		this.tableOffsetX = 200;
		this.tableOffsetY = 50;
		this.edgeWidth = Math.round(15*this.tableWidth/600);
		this.chessRadius = Math.round(15*this.tableWidth/600);
		this.freeCircleRadius = Math.round(36*this.tableWidth/600);
		this.freeCircleOffset = Math.round(110*this.tableWidth/600);
		this.holeRadius = this.chessRadius*2;
		this.holeOffset = Math.round(this.chessRadius*1.5);
		this.buttonWidth = Math.round(150*this.tableWidth/600);
		this.buttonHeight = Math.round(45*this.tableWidth/600);
		this.buttonOffsetX = this.tableOffsetX+this.tableWidth+this.edgeWidth*2-this.buttonWidth*3;
		this.buttonOffsetY = this.tableWidth+2*this.edgeWidth+this.tableOffsetY;
		this.powerBarWidth = Math.round(40*this.tableWidth/600);
		this.powerBarHeight = Math.round(200*this.tableWidth/600);
		this.powerBarOffsetX = this.tableWidth+this.edgeWidth*2+this.tableOffsetX;
		this.powerBarOffsetY = this.tableOffsetY+this.tableWidth+this.edgeWidth*2-this.powerBarHeight;
		this.cueWidth = Math.round(349*this.tableWidth/600);
		this.cueHeight = Math.round(5*this.tableWidth/600);
		this.guidingLineWidth = Math.round(200*this.tableWidth/600);
		this.guidingLineHeight = Math.round(3*this.tableWidth/600);
		
		// Initialize game text style
		this.playerName[0] = this.game.add.text(this.powerBarOffsetX+this.powerBarWidth, this.buttonOffsetY-120, this.room.players[0].playerName,{ font: "30px Arial", fill: "#ff0044", align: "center" });
		this.playerName[1] = this.game.add.text(this.powerBarOffsetX+this.powerBarWidth, this.tableOffsetY, this.room.players[1].playerName,{ font: "30px Arial", fill: "#ff0044", align: "center" });
		this.numCue[0] = this.game.add.text(this.powerBarOffsetX+this.powerBarWidth, this.buttonOffsetY-80, "Cues: 1",{ font: "30px Arial", fill: "#ff0044", align: "center" });
		this.numCue[1] = this.game.add.text(this.powerBarOffsetX+this.powerBarWidth, this.tableOffsetY+40, "Cues: 1",{ font: "30px Arial", fill: "#ff0044", align: "center" });
		if(this.playerID == 0){
			this.textStatus = this.game.add.text(this.powerBarOffsetX+this.powerBarWidth, this.buttonOffsetY-40, "Hint: ", { font: "24px Arial", fill: "#ff0044", align: "center" });
			this.warning = this.game.add.text(this.powerBarOffsetX+this.powerBarWidth, this.buttonOffsetY,"ABC",{ font: "24px Arial", fill: "#ff0044", align: "center" });
		}
		else{
			this.textStatus = this.game.add.text(this.powerBarOffsetX+this.powerBarWidth, this.tableOffsetY+80, "Hint: ", { font: "24px Arial", fill: "#ff0044", align: "center" });
			this.warning = this.game.add.text(this.powerBarOffsetX+this.powerBarWidth, this.tableOffsetY+120,"",{ font: "24px Arial", fill: "#ff0044" });
		}

	},
	
	// Start a game
	create: function() {
		this.room.playing = true;
		
		this.game.physics.startSystem(Phaser.Physics.P2JS);
		this.game.physics.p2.friction = 0.1;
		this.game.physics.p2.restitution = 0.7;
		this.table = this.add.sprite(this.tableOffsetX, this.tableOffsetY, 'table');
		this.table.width = this.tableWidth+this.edgeWidth*2;
		this.table.height = this.tableWidth+this.edgeWidth*2;

		this.cue = this.add.sprite(200, 300, 'cue');
		
		this.hole = [];
		this.hole[0] = this.add.sprite(this.holeOffset+this.edgeWidth+this.tableOffsetX, 
							this.holeOffset+this.edgeWidth+this.tableOffsetY, 'hole');
		this.hole[1] = this.add.sprite(this.tableWidth-this.holeOffset-this.holeRadius*2+this.edgeWidth+this.tableOffsetX, 
							this.holeOffset+this.edgeWidth+this.tableOffsetY, 'hole');
		this.hole[2] = this.add.sprite(this.holeOffset+this.edgeWidth+this.tableOffsetX, 
							this.tableWidth-this.holeOffset-this.holeRadius*2+this.edgeWidth+this.tableOffsetY, 'hole');
		this.hole[3] = this.add.sprite(this.tableWidth-this.holeOffset-this.holeRadius*2+this.edgeWidth+this.tableOffsetX, 
							this.tableWidth-this.holeOffset-this.holeRadius*2+this.edgeWidth+this.tableOffsetY, 'hole');
		for(var i = 0; i < 4; i++){
			this.hole[i].height = this.holeRadius*2;
			this.hole[i].width = this.holeRadius*2;
		}

		
		

		this.cue.anchor.setTo(-0.1, 0.5);

		
		this.guidingLine = this.add.sprite(0, 0, 'guidingLine');
		this.guidingLine.width = this.guidingLineWidth;
		this.guidingLine.height = this.guidingLineHeight;
		this.guidingLine.anchor.setTo(1.1, 0.5);
		this.guidingLine.visible = false;

		this.game.physics.p2.setBoundsToWorld(true, true, true, true, false);
		this.game.physics.p2.setBounds(this.edgeWidth+this.tableOffsetX, this.edgeWidth+this.tableOffsetY, this.tableWidth, this.tableWidth, true, true, true, true, false);
		

		this.shootChessImg = this.add.sprite(150, 150, 'shootChess');
		this.shootChessImg.height = this.chessRadius*2;
		this.shootChessImg.width = this.chessRadius*2;
		this.shootChessImg.visible = false;
		this.createShootChess();
		this.shootChess.visible = false;
		this.shootChessStatus = "STOPPED";
		this.opponentShootChess = this.add.sprite(150, 150, 'shootChess');
		this.opponentShootChess.height = this.chessRadius*2;
		this.opponentShootChess.width = this.chessRadius*2;
		this.opponentShootChess.visible = false;

		this.redChess = [];
		this.redChessStatus = [];
		this.redChess[0] = this.add.sprite(this.chessRadius+1+this.edgeWidth+this.tableOffsetX, 
								this.chessRadius+1+this.edgeWidth+this.tableOffsetY, 'redChess');
		for(var i = 1; i <= 14; i++){
			this.redChess[i] = this.add.sprite(this.chessRadius*(2*(i+2)+1)+this.edgeWidth+this.tableOffsetX, 
								this.chessRadius+this.edgeWidth+this.tableOffsetY, 'redChess');
		}
		this.redChess[15] = this.add.sprite(this.tableWidth-this.chessRadius+this.edgeWidth+this.tableOffsetX, 
								this.chessRadius+this.edgeWidth+this.tableOffsetY, 'redChess');
		for(var i = 0; i < 16; i++){
			this.redChess[i].height = this.chessRadius*2;
			this.redChess[i].width = this.chessRadius*2;
			this.game.physics.p2.enableBody(this.redChess[i]);
			this.redChess[i].body.collideWorldBounds = true;
			this.redChess[i].body.setCircle(this.chessRadius);
			this.redChess[i].body.damping = 0.9;
			this.redChessStatus[i] = "STOPPED";
			this.redChess[i].checkWorldBounds = true;
			this.redChess[i].outOfBoundsKill = true;
			this.redChess[i].inputEnabled = true;
			this.redChess[i].name = "r"+i;
			this.redChess[i].events.onInputDown.add(this.handleChessInput, this);
		}

		this.blackChess = [];
		this.blackChessStatus = [];
		this.blackChess[0] = this.add.sprite(this.chessRadius+1+this.edgeWidth+this.tableOffsetX, 
								this.tableWidth-this.chessRadius-1+this.edgeWidth+this.tableOffsetY, 'blackChess');
		for(var i = 1; i <= 14; i++){
			this.blackChess[i] = this.add.sprite(this.chessRadius*(2*(i+2)+1)+this.edgeWidth+this.tableOffsetX, 
									this.tableWidth-this.chessRadius+this.edgeWidth+this.tableOffsetY, 'blackChess');
		}
		this.blackChess[15] = this.add.sprite(this.tableWidth-this.chessRadius+this.edgeWidth+this.tableOffsetX, 
									this.tableWidth-this.chessRadius+this.edgeWidth+this.tableOffsetY, 'blackChess');
		for(var i = 0; i < 16; i++){
			this.blackChess[i].height = this.chessRadius*2;
			this.blackChess[i].width = this.chessRadius*2;
			this.game.physics.p2.enableBody(this.blackChess[i]);
			this.blackChess[i].body.collideWorldBounds = true;
			this.blackChess[i].body.setCircle(this.chessRadius);
			this.blackChess[i].body.damping = 0.9;
			this.blackChessStatus[i] = "STOPPED";
			this.blackChess[i].checkWorldBounds = true;
			this.blackChess[i].outOfBoundsKill = true;
			this.blackChess[i].inputEnabled = true;
			this.blackChess[i].name = "b"+i;
			this.blackChess[i].events.onInputDown.add(this.handleChessInput, this);
		}

		this.freeCircle = [];
		this.freeCircle[0] = new Phaser.Circle(this.freeCircleOffset+this.edgeWidth+this.tableOffsetX, 
								this.freeCircleOffset+this.edgeWidth+this.tableOffsetY, this.freeCircleRadius*2);
		this.freeCircle[1] = new Phaser.Circle(this.tableWidth-this.freeCircleOffset+this.edgeWidth+this.tableOffsetX, 
								this.freeCircleOffset+this.edgeWidth+this.tableOffsetY, this.freeCircleRadius*2);
		this.freeCircle[2] = new Phaser.Circle(this.freeCircleOffset+this.edgeWidth+this.tableOffsetX, 
								this.tableWidth-this.freeCircleOffset+this.edgeWidth+this.tableOffsetY, this.freeCircleRadius*2);
		this.freeCircle[3] = new Phaser.Circle(this.tableWidth-this.freeCircleOffset+this.edgeWidth+this.tableOffsetX, 
								this.tableWidth-this.freeCircleOffset+this.edgeWidth+this.tableOffsetY, this.freeCircleRadius*2);

		this.powerBar = this.add.sprite(this.powerBarOffsetX, this.powerBarOffsetY, 'powerBar');
		this.powerBar.width = this.powerBarWidth;
		this.powerBar.height = this.powerBarHeight;
		this.powerLine = this.add.sprite(this.powerBarOffsetX, this.powerBarOffsetY, 'powerLine');
		this.powerLine.width = this.powerBarWidth;
		this.powerLine.visible = false;
		this.maxSpeed = this.tableWidth*3;

		this.backButton = this.game.add.button(this.buttonOffsetX+this.buttonWidth*2, this.buttonOffsetY, 'backButton', this.backButtonHandler, this, 0, 0, 1, 0);
 		this.backButton.name = 'backButton';
 		this.backButton.inputEnabled = false;
		this.backButton.visible = false;
		this.backButton.width = this.buttonWidth;
		this.backButton.height = this.buttonHeight;
		this.giveupButton = this.game.add.button(this.buttonOffsetX+this.buttonWidth, this.buttonOffsetY, 'giveupButton', this.giveupButtonHandler, this, 0, 0, 1, 0);
 		this.giveupButton.name = 'giveupButton';
 		this.giveupButton.inputEnabled = false;
		this.giveupButton.visible = false;
		this.giveupButton.width = this.buttonWidth;
		this.giveupButton.height = this.buttonHeight;
		this.shootChessButton = this.game.add.button(this.buttonOffsetX, this.buttonOffsetY, 'shootChessButton', this.shootChessButtonHandler, this, 0, 0, 1, 0);
 		this.shootChessButton.name = 'shootChessButton';
 		this.shootChessButton.inputEnabled = false;
		this.shootChessButton.visible = false;
		this.shootChessButton.width = this.buttonWidth;
		this.shootChessButton.height = this.buttonHeight;

		this.cue.visible = false;
		this.playerStatus = "WAIT";
		this.chasing = false;
		
		this.room.numCue[0] = 1;
		this.room.numCue[1] = 1;
		this.totalCue = 1;

		this.game.input.onDown.add(this.handleMouseDown, this);
		this.game.input.onUp.add(this.handleMouseUp, this);

		// Socket communication
		var that = this;
		this.socket.emit('start', this.room);

		this.socket.on('start_game', function(data) {
			if(that.playerID == data){
				that.playerStatus = "CHOOSE_ACTION";
				that.shootChessButton.inputEnabled = true;
				that.shootChessButton.visible = true;
				that.giveupButton.inputEnabled = true;
				that.giveupButton.visible = true;
			}
			else{
				that.playerStatus = "WAITING_OTHER";
			}
		});
		
		// Switch turns
		this.socket.on('turn', function(data) {
			if(that.playerID == data){
				that.playerStatus = "CHOOSE_ACTION";
				that.shootChessButton.inputEnabled = true;
				that.shootChessButton.visible = true;
				that.giveupButton.inputEnabled = true;
				that.giveupButton.visible = true;
			}
			else{
				that.playerStatus = "WAITING_OTHER";
			}
		});
		
		// Handle a turn for each player
		this.socket.on('chase', function(data) {
			if(that.playerID == data){
				that.chasing = true;
				that.playerStatus = "CHOOSE_ACTION";
				that.shootChessButton.inputEnabled = true;
				that.shootChessButton.visible = true;
				that.giveupButton.inputEnabled = true;
				that.giveupButton.visible = true;
			}
			else{
				that.playerStatus = "WAITING_OTHER";
			}
		});
		
		// Update the status of board and chess
		this.socket.on('game_update', function(data) {
			that.room = data.room;
			for(var i = 0; i < 16; i++){
				that.redChessStatus[i] = data.redStatus[i];
				that.blackChessStatus[i] = data.blackStatus[i];
				if(data.redStatus[i] == "KILLED")
					that.killChess(that.redChess[i]);
				if(data.blackStatus[i] == "KILLED")
					that.killChess(that.blackChess[i]);
				that.redChess[i].body.x = data.redx[i];
				that.redChess[i].body.y = data.redy[i];
				that.redChess[i].x = data.redx[i] - that.chessRadius;
				that.redChess[i].y = data.redy[i] - that.chessRadius;
				that.redChess[i].body.velocity.x = 0;
				that.redChess[i].body.velocity.y = 0;
				that.blackChess[i].body.x = data.blackx[i];
				that.blackChess[i].body.y = data.blacky[i];
				that.blackChess[i].x = data.blackx[i] - that.chessRadius;
				that.blackChess[i].y = data.blacky[i] - that.chessRadius;
				that.blackChess[i].body.velocity.x = 0;
				that.blackChess[i].body.velocity.y = 0;
			}
			that.opponentShootChess.visible = true;
			that.opponentShootChess.x = data.shootx - that.chessRadius;
			that.opponentShootChess.y = data.shooty - that.chessRadius;
		});
		
		// Display result of the game
		this.socket.on('result', function(data) {
			that.resultBg = that.game.add.button(400, 200, 'resultBg', that.handleResult, that,null,null,null,null);
			if(data == -1){
				that.result = that.game.add.text(400, 200, "DRAW\n\n"+"(Click to return)",{ font: "30px Arial", fill: "#ff0044", align: "center" });
			}
			else if(data == that.playerID){
				that.result = that.game.add.text(400, 200, "You WIN\n\n"+"(Click to return)",{ font: "30px Arial", fill: "#ff0044", align: "center" });
			}
			else{
				that.result = that.game.add.text(400, 200, "You Lose\n\n"+"(Click to return)",{ font: "30px Arial", fill: "#ff0044", align: "center" });
			}
			that.result.visible = true;
		});
		this.socket.on('opponent_disconnected', function() {
			that.resultBg = that.game.add.button(400, 200, 'resultBg', that.handleResult, that,null,null,null,null);
			that.result = that.game.add.text(400, 200, "Opponent is\ndisconnected\n"+"(Click to return)",{ font: "30px Arial", fill: "#ff0044", align: "center" });
		});
	},

	update: function() {
		
		
		if(this.playerStatus != "WAITING_OTHER" && this.playerStatus != "POSITION_SHOOTCHESS"){
			this.sendUpdateGame();
		}


		if(this.playerStatus == "CHOOSE_ACTION")
 			this.textStatus.setText("Please choose action");
 		else if(this.playerStatus == "GIVEUP_CHESS")
 			this.textStatus.setText("Click chess to give up");
 		else if(this.playerStatus == "POSITION_SHOOTCHESS")
 			this.textStatus.setText("Put your shoot chess");
 		else if(this.playerStatus == "SET_ANGLE_POWER")
 			this.textStatus.setText("Set angle and power");
 		else if(this.playerStatus == "MOVING")
 			this.textStatus.setText("Moving");
 		else if(this.playerStatus == "WAITING_OTHER")
 			this.textStatus.setText("Opponent's turn");
 		if(this.playerStatus == "CHOOSE_ACTION"){

 		}
 		if(this.playerStatus == "GIVEUP_CHESS"){
 			
 		}
		if(this.playerStatus == "POSITION_SHOOTCHESS"){
			this.opponentShootChess.visible = false;
			this.shootChessImg.visible = true;
			this.shootChessImg.x = this.game.input.activePointer.x;
			this.shootChessImg.y = this.game.input.activePointer.y;

		}
		if(this.playerStatus == "SET_ANGLE_POWER"){
			this.guidingLine.x = this.shootChess.body.x;
			this.guidingLine.y = this.shootChess.body.y;
			this.guidingLine.visible = true;
			this.cue.x = this.shootChess.body.x;
			this.cue.y = this.shootChess.body.y;
			this.angle = this.game.physics.arcade.angleBetween(this.shootChess, this.game.input.activePointer);
			this.cue.rotation = this.angle; 
			this.guidingLine.rotation = this.angle;
			var speed = Math.sqrt(Math.pow((this.shootChess.body.x - this.game.input.activePointer.x)*20,2)+
						Math.pow((this.shootChess.body.y - this.game.input.activePointer.y)*20,2));
			var max = Math.sqrt(2*this.maxSpeed*this.maxSpeed);

			this.powerLine.y = this.powerBarOffsetY + speed / max * this.powerBarHeight;

		}
		
		// Handle different state of a game move
		if(this.playerStatus == "MOVING"){

			for(var j = 0; j < 4; j++){
				if(this.checkHole(this.shootChess, this.hole[j]) && this.shootChessStatus != "KILLED"){
					this.shootChessStatus = "KILLED";
					this.room.numCue[this.playerID] -= 1;
				}
				for(var i = 0; i < 16; i++){
					if(this.playerID == 0){
						if(this.checkHole(this.redChess[i], this.hole[j]) && this.redChessStatus[i] != "KILLED"){
							this.room.numCue[this.playerID] += 1;
							this.redChessStatus[i] = "KILLED";
						}
						if(this.checkHole(this.blackChess[i], this.hole[j]) && this.blackChessStatus[i] != "KILLED"){
							this.room.numCue[this.playerID] += 0;
							this.blackChessStatus[i] = "KILLED";
						}
					}
					else{
						if(this.checkHole(this.redChess[i], this.hole[j])  && this.redChessStatus[i] != "KILLED"){
							this.room.numCue[this.playerID] += 0;
							this.redChessStatus[i] = "KILLED";
						}
						if(this.checkHole(this.blackChess[i], this.hole[j]) && this.blackChessStatus[i] != "KILLED"){
							this.room.numCue[this.playerID] += 1;
							this.blackChessStatus[i] = "KILLED";
						}
					}
				}
			}
			if(this.finishMoving()){
				
				this.playerStatus = "CHOOSE_ACTION";
				this.shootChessButton.inputEnabled = true;
				this.shootChessButton.visible = true;
				this.giveupButton.inputEnabled = true;
				this.giveupButton.visible = true;

				this.room.numCue[this.playerID] -= 1;
				this.numCue[0].setText("Cues: "+this.room.numCue[0]);
				this.numCue[1].setText("Cues: "+this.room.numCue[1]);
				if(this.checkSelfWin()){
					if(!this.chasing){
						if(this.playerID == this.room.firstPlayer)
							this.socket.emit('next_player_chase');
						else
							this.socket.emit('end_game', {roomID: this.room.roomID, winner: this.playerID});
					}
					else
						this.socket.emit('end_game', {roomID: this.room.roomID, winner: -1});
				}
				
				if(this.room.numCue[this.playerID] <= 0){
					if(this.chasing){
						if(!this.checkSelfWin()){
							var winner;
							if(this.playerID == 0) winner = 1;
							else winner = 0;
							this.socket.emit('end_game', {roomID: this.room.roomID, winner: winner});
						}
					}
					else{
						this.totalCue += 1;
						var nextplayer;
						if(this.playerID == 0) nextplayer = 1;
						else nextplayer = 0;
						if(this.room.numCue[this.playerID] < 0){
							this.room.numCue[nextplayer] -= this.room.numCue[this.playerID];
						}
						this.room.numCue[this.playerID] = 1;
						this.sendUpdateGame();
						this.socket.emit('finish_action', this.room);
						this.playerStatus = 'WAITING_OTHER';
						this.shootChessButton.inputEnabled = false;
						this.shootChessButton.visible = false;
						this.giveupButton.inputEnabled = false;
						this.giveupButton.visible = false;
						this.backButton.inputEnabled = false;
						this.backButton.visible = false;
					}
				}

				this.shootChessImg.visible = false;
				
			}
		}
	},

	// Use shoot chess situation
	createShootChess: function() {
		this.shootChess = this.add.sprite(200, 200, 'shootChess');
		this.shootChess.height = this.chessRadius*2;
		this.shootChess.width = this.chessRadius*2;
		this.game.physics.p2.enableBody(this.shootChess);
		this.shootChess.body.collideWorldBounds = true;
		this.shootChess.body.setCircle(this.chessRadius);
		this.shootChess.body.damping = 0.8;
		this.shootChess.checkWorldBounds = true;
		this.shootChess.outOfBoundsKill = true;
		this.shootChess.visible = true;
		this.shootChessStatus = "STOPPED";
		this.shootChess.body.velocity.x = 0;
		this.shootChess.body.velocity.y = 0;
		
	},

	// Give up chess situation
	handleChessInput: function(chess) {
		if(this.playerStatus == "GIVEUP_CHESS"){
			if(this.playerID == 0){
				for(var i = 0; i < 16; i++){
					if(chess.name == this.blackChess[i].name){
						this.blackChess[i].kill();
						this.blackChessStatus[i] = "KILLED";
					}

				}
			}
			else{
				for(var i = 0; i < 16; i++){
					if(chess.name == this.redChess[i].name){
						this.redChess[i].kill();
						this.redChessStatus[i] = "KILLED";
					}

				}
			}
		}
	},
	
	// Corresponding handlers
	shootChessButtonHandler: function() {
		this.playerStatus = "POSITION_SHOOTCHESS";
		this.shootChessButton.visible = false;
		this.shootChessButton.inputEnabled = false;
		this.giveupButton.visible = false;
		this.giveupButton.inputEnabled = false;
		this.backButton.visible = true;
		this.backButton.inputEnabled = true;
	},
	giveupButtonHandler: function() {
		this.playerStatus = "GIVEUP_CHESS";
		this.shootChessButton.visible = false;
		this.shootChessButton.inputEnabled = false;
		this.giveupButton.visible = false;
		this.giveupButton.inputEnabled = false;
		this.backButton.visible = true;
		this.backButton.inputEnabled = true;
	},
	backButtonHandler: function() {
		if(this.playerStatus == "POSITION_SHOOTCHESS" || this.playerStatus == "GIVEUP_CHESS"){
			this.playerStatus = "CHOOSE_ACTION";
			this.backButton.visible = false;
			this.backButton.inputEnabled = false;
			this.shootChessButton.visible = true;
			this.shootChessButton.inputEnabled = true;
			this.giveupButton.visible = true;
			this.giveupButton.inputEnabled = true;
		}
		else if(this.playerStatus == "SET_ANGLE_POWER"){
			this.playerStatus = "POSITION_SHOOTCHESS";
		}
	},


	handleMouseDown: function() {

	},
	
	// Set angles and power of a shoot
	handleMouseUp: function() {
		if(this.playerStatus == "POSITION_SHOOTCHESS"){
			this.shootChess.visible = true;
			this.shootChessOnCircle = this.checkOverlap(this.shootChessImg);
			var overlapChess = this.checkOverlapChess(this.shootChessImg);
			if(this.shootChessOnCircle >= 0 && overlapChess == false){
				this.cue.visible = true;
				if(this.shootChessStatus == "KILLED"){
					this.shootChess.revive();
					this.shootChess.body.velocity.x = 0;
					this.shootChess.body.velocity.y = 0;
					//this.createShootChess();
				}
				this.shootChess.x = this.shootChessImg.x;
				this.shootChess.y = this.shootChessImg.y;
				this.shootChess.body.x = this.shootChessImg.x + this.chessRadius;
				this.shootChess.body.y = this.shootChessImg.y + this.chessRadius;
				this.shootChessImg.visible = false;
				this.powerLine.visible = true;
				this.playerStatus = "SET_ANGLE_POWER";
			}
			else this.warning.setText("You cannot put it here!");

		}
		else if(this.playerStatus == "SET_ANGLE_POWER"){
			if(this.checkCueAngle()){
				this.guidingLine.visible = false;
				this.cue.visible = false
				this.powerLine.visible = false;
				var speedx = (this.shootChess.body.x - this.game.input.activePointer.x) * 20;
				var speedy = (this.shootChess.body.y - this.game.input.activePointer.y) * 20;
				var signx = speedx >= 0? 1 : -1;
				var signy = speedy >= 0? 1 : -1;
				if(Math.abs(speedx) > this.maxSpeed && Math.abs(speedy) > this.maxSpeed){
					if(Math.abs(speedx) > Math.abs(speedy)){
						this.shootChess.body.velocity.x = this.maxSpeed * signx;
						this.shootChess.body.velocity.y = this.maxSpeed * signy * Math.abs(speedy / speedx);
					}
					else{
						this.shootChess.body.velocity.x = this.maxSpeed * signx * Math.abs(speedx / speedy);
						this.shootChess.body.velocity.y = this.maxSpeed * signy;
					}
					
				}
				else if(Math.abs(speedx) > this.maxSpeed){
					this.shootChess.body.velocity.x = this.maxSpeed * signx;
					this.shootChess.body.velocity.y = speedy * Math.abs(speedy / speedx);
				}
				else if(Math.abs(speedy) > this.maxSpeed){
					this.shootChess.body.velocity.x = speedx * Math.abs(speedx / speedy);
					this.shootChess.body.velocity.y = this.maxSpeed * signy;
				}
				else{
					this.shootChess.body.velocity.x = speedx;
					this.shootChess.body.velocity.y = speedy;
				}
				this.shootChessStatus = "MOVING";
				for(var i = 0; i < 16; i++){
					if(this.redChessStatus[i] != "KILLED")
						this.redChessStatus[i] = "MOVING";
					if(this.blackChessStatus[i] != "KILLED")
						this.blackChessStatus[i] = "MOVING";
				}
				this.playerStatus = "MOVING";

			}
			else this.warning.setText("Cue Angle Incorrect!");
		}
	},

	handleResult: function() {
		for(var i = 0; i < 4; i++){
			if(!this.room.empty[i]){
				this.room.players[i].ready = false;
			}
		}
		this.game.state.start('WaitingRoom', true, true, {room: this.room, socket: this.socket, playerID: this.playerID, username: this.username});
	},

	finishMoving: function() {
		var flag = true;
		if(Math.abs(this.shootChess.body.velocity.x) < 2 && Math.abs(this.shootChess.body.velocity.y) < 2)
			this.shootChessStatus = "STOPPED";
		if(this.shootChessStatus == "MOVING")
			flag = false;

		for(var i = 0; i < 16; i++){
			if(Math.abs(this.redChess[i].body.velocity.x) < 2 && Math.abs(this.redChess[i].body.velocity.y) < 2)
				if(this.redChessStatus[i] != "KILLED")
					this.redChessStatus[i] = "STOPPED";
			if(this.redChessStatus[i] == "MOVING")
				flag = false;
		}
		for(var i = 0; i < 16; i++){
			if(Math.abs(this.blackChess[i].body.velocity.x) < 2 && Math.abs(this.blackChess[i].body.velocity.y) < 2)
				if(this.blackChessStatus[i] != "KILLED")
					this.blackChessStatus[i] = "STOPPED";
			if(this.blackChessStatus[i] == "MOVING")
				flag = false;
		}
		

		return flag;
	},
	
	// Check whether a chess enters a hole
	checkHole: function(chess, hole) {
        var dx = chess.body.x - (hole.x+this.holeRadius);
        var dy = chess.body.y - (hole.y+this.holeRadius);
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist <= (this.holeRadius + this.chessRadius)*0.7){
        	
            var x = chess.body.velocity.x;
			var y = chess.body.velocity.y;
			if(Math.sqrt(x*x + y*y) < 100){
				this.killChess(chess);
				
				return true;
			}
        }
        return false;
	},

	// Check for collision
	checkOverlap: function(chess) {
		var circle;
		if(this.playerID == 0)
			circle = 2;
		else
			circle = 0;
		for(var i = circle; i < (circle+2); i++){
			var dx = chess.x + this.chessRadius - (this.freeCircle[i].x);
	        var dy = chess.y + this.chessRadius - (this.freeCircle[i].y);
	        var dist = Math.sqrt(dx*dx + dy*dy);
	        if (dist <= (this.freeCircleRadius + this.chessRadius)){
				return i;
	        }
    	}
        return -1;
	},

	checkOverlapChess: function(chess) {
		for(var i = 0; i < 16; i++){
			var dx1 = chess.x + this.chessRadius - (this.redChess[i].x);
	        var dy1 = chess.y + this.chessRadius - (this.redChess[i].y);
	        var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
	        if (dist1 <= this.chessRadius*2){
				return true;
	        }
	        var dx2 = chess.x + this.chessRadius - (this.blackChess[i].x);
	        var dy2 = chess.y + this.chessRadius - (this.blackChess[i].y);
	        var dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
	        if (dist2 <= this.chessRadius*2){
				return true;
	        }
		}
		return false;
	},
	
	// Check for angles of shooting that is not allowed
	checkCueAngle: function() {
		if(this.playerID == 0){
			var x1 = this.tableWidth + this.edgeWidth - this.shootChess.body.x;
			var y = this.tableWidth + this.edgeWidth - this.shootChess.body.y;
			var cueAngle1 = Math.atan(y/x1);
			var x2 = this.shootChess.body.x - this.edgeWidth;
			var cueAngle2 = Math.atan(x2/y) + Math.PI/2;
			if(cueAngle1 > this.angle || cueAngle2 < this.angle){
				return false;
			}
			else{
				return true;
			}
		}
		else{
			var x1 = this.tableWidth + this.edgeWidth - this.shootChess.body.x;
			var y = this.shootChess.body.y - this.edgeWidth;
			var cueAngle1 = Math.atan(y/x1);
			var x2 = this.shootChess.body.x - this.edgeWidth;
			var cueAngle2 = Math.atan(x2/y) + Math.PI/2;
			if(cueAngle1 > (-1)*this.angle || cueAngle2 < (-1)*this.angle){
				return false;
			}
			else{
				return true;
			}
		}
	},

	// Update the game status for the other player
	sendUpdateGame: function() {
		var redx = [];
		var redy = [];
		var blackx = [];
		var blacky = [];
		for(var i = 0; i < 16; i++){
			redx[i] = this.redChess[i].body.x;
			redy[i] = this.redChess[i].body.y;
			blackx[i] = this.blackChess[i].body.x;
			blacky[i] = this.blackChess[i].body.y;
		}
		var shootx = this.shootChess.body.x;
		var shooty = this.shootChess.body.y;
		this.socket.emit('update_game', {redx: redx, redy: redy, blackx: blackx, blacky: blacky, 
			shootx: shootx, shooty: shooty, redStatus: this.redChessStatus, blackStatus: this.blackChessStatus, 
			shootStatus: this.shootChessStatus, playerStatus: this.playerStatus, room: this.room});
	},
	
	// Remove a chess
	killChess: function(chess) {
		/*chess.x = 500;
		chess.y = 500;
		chess.body.x = 500;
		chess.body.y = 500;
		chess.body.velocity.x = 0;
		chess.body.velocity.y = 0;*/
		chess.kill();
	},

	// Check the winning state of game
	checkSelfWin: function() {
		var flag = true;
		if (this.playerID == 0) {
			for (var i = 0; i < 16; i++) {
				if (this.redChessStatus[i] != "KILLED") {
					flag = false;
				}
			}
		} else {
			for (var i = 0; i < 16; i++) {
				if (this.blackChessStatus[i] != "KILLED"){
					flag = false;
				}
			}
		}
		return flag;
	}

};

