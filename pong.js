
window.onresize=function() {objPongView.resize();};


// ==================================================================================================
// ====================================== MODEL =====================================================
// ==================================================================================================

/* instanciable object.
	source :
		http://www.cristiandarie.ro/asp-ajax/JavaScriptClass.html
		http://www.exforsys.com/tutorials/microsoft-ajax/javascript-classes/1.html
*/
function objPongRaquette(owner)
	{
	// constructor
	this.borderMargin	= 10,	// gap between 'raquette' and the play zone
	this.bounceX		= 0,
	this.coord			= {'X' : 0, 'currY' : 0, 'prevY' : 100 },	// 100 is just an arbitrary number so that the 1st display of the raquette "shadow" won't draw a hole in the field
	this.deltaY		= 50,	// don't know why there is this gap :-/
	this.lineWidth		= 0,
	this.owner			= owner,
	this.size			= {'width' : 20, 'height' : 100 },
	this.step			= 10,	// used only for computerRaquette
	// end of constructor

	this.getInitCoord	= function()
		{
		var canvasSize			= objPongView.getCanvasSize();
		this.coord['currY']	= (canvasSize['height']/2)-(this.size['height']/2);

		switch(this.owner)
			{
			case 'player':
				{ this.coord['X']	= objPongView.playZoneLimit['minX']+this.borderMargin;break; }
			case 'computer':
				{ this.coord['X']	= objPongView.playZoneLimit['maxX']-this.borderMargin-this.size['width'];break; }
			}
		},


	/**
	 * computes and draw the raquette's next position.
	 * don't forget that 'destinationY' is the ordinate of the middle of the raquette ;-) (which is centered on the mouse height)
	 */
	this.move = function(destinationY)
		{
		this.coord['prevY']	= this.coord['currY'];
		this.coord['currY']	= destinationY-this.size['height']/2;

		if(this.coord['currY']<objPongView.playZoneLimit['minY'])
			this.coord['currY']=objPongView.playZoneLimit['minY'];

		if((this.coord['currY']+(this.size['height']/2)+this.deltaY)>objPongView.playZoneLimit['maxY'])
			this.coord['currY']=objPongView.playZoneLimit['maxY']-(this.size['height']/2)-this.deltaY;

		objPongView.drawRaquette(this);
		}
	};





function objPongPlayer(playerType)
	{
	// constructor
	this.score		= 0,
	this.color		= 0,
	this.type		= playerType,
	this.name		= '',
	this.domId		= '',
	// end of constructor

	this.init = function()
		{
		switch(this.type)
			{
			case 'human' :
				{
				this.name	= 'Human';
				this.domId	= 'scorePlayer';
				break;
				}
			case 'computer' :
				{
				this.name	= 'HAL';
				this.domId	= 'scoreComputer';
				break;
				}
			}
		};

	this.displayScore = function()
		{ document.getElementById(this.domId).innerHTML=this.score; }
	};






var objPongBall =	{
	'coord'			: {'currX' : 0, 'currY' : 0, 'prevX' : 0, 'prevY' : 0 },
	'direction'		: '',
	'size'				: {'width' : 20, 'height' : 20 },
	'step'				: 10,		// step in px
	'delay'			: 50,		// delay in ms
	'maxDelay'			: 225,		// delay in ms
	'speedIncrement'	: 25,
	'stepIncrement'	: 5,
	'nbSteps'			: 0,		// do not restore ballZoneData in 1st step


	displaySpeed: function()
		{
		var displayedSpeed=10-(objPongBall.delay/objPongBall.speedIncrement);
		content.document.getElementById('speedometer').value=displayedSpeed;
		},


	/**
	 * determine ball initial position
	 */
	getInitCoord: function()
		{
		var canvasSize		= objPongView.getCanvasSize();
		var playZoneWidth	= canvasSize['width']-(2*objPongView.playZonePadding);
		var playZoneHeight	= canvasSize['height']-(2*objPongView.playZonePadding);

		objPongBall.nbSteps	= 0;	// reset the counter after player or computer marks

		objPongBall.coord['currX']	= objPongUtility.alea(playZoneWidth);
		objPongBall.coord['currY']	= objPongUtility.alea(playZoneHeight);
		objPongBall.coord['prevX']	= objPongBall.coord['currX'];
		objPongBall.coord['prevY']	= objPongBall.coord['currY'];
		},


	/**
	 * determine ball initial direction
	 */
	getInitDirection: function()
		{
		var directions			= {0:'ne', 1:'se', 2:'sw', 3:'nw' };
		var initDirection		= objPongUtility.alea(4);
		objPongBall.direction	= directions[initDirection];
		}
	};



var objPongUtility = {

	// return a random integer lower than 'max'
	alea: function(max)
		{ return (Math.floor(Math.random()*max)); }

	};




// ==================================================================================================
// ====================================== CONTROLLER ================================================
// ==================================================================================================

var soundFx = {
	/**
	 * 44kHz - 1411kbps - 16bits
	 * http://www.pacdv.com/sounds/interface_sounds-3.html
	 * http://www.freesound.org/ otot otot
	 * http://www.grsites.com/archive/sounds/
	 */
	'ballTopWallBounce'	: new Audio('./sounds/marble_bounce_2.wav'),
	'ballBottomWallBounce'	: new Audio('./sounds/marble_bounce_1.wav'),
	'ballLeftWallBounce'	: new Audio('./sounds/lose_1.wav'),
	'ballRightWallBounce'	: new Audio('./sounds/win_1.wav'),
	'ballRaquetteBounce'	: new Audio('./sounds/marble_raquette.wav'),
	};


var objPongController = {
	'timer'			: '',	// just to declare the property
	//	'timerRunning'	: 0,
	'timerRunning'		: false,
	'raquettePlayer'	: new objPongRaquette('player'),
	'raquetteComputer'	: new objPongRaquette('computer'),
	'playerHuman'		: new objPongPlayer('human'),
	'playerComputer'	: new objPongPlayer('computer'),
	'soundEnabled'		: false,
	'computerViewField' : {'width' : 0, 'startX' : 0 },




	changeComputerViewField: function()
		{
		//		var diffId=;
		//		alert(document.getElementById('difficulty').value);
		switch(document.getElementById('difficulty').value)
			{
			case '1':
				objPongController.computerViewField['width']=100;break;
			case '2':
				objPongController.computerViewField['width']=200;break;
			case '3':
				objPongController.computerViewField['width']=300;break;
			case '4':
				objPongController.computerViewField['width']=400;break;
			}

		objPongController.computerViewField['startX']=objPongController.raquetteComputer.bounceX-objPongController.computerViewField['width'];
		objPongView.drawViewField();
		},


	toggleSound: function()
		{
		var checkboxId='enableSound';
		if(document.getElementById(checkboxId).checked)
			{ this.soundEnabled=true; }
		else
			{ this.soundEnabled=false; }
		},


	start: function()
		{
		objPongView.resize();

		objPongController.playerHuman.init();
		objPongController.playerHuman.displayScore();
		objPongController.playerComputer.init();
		objPongController.playerComputer.displayScore();

		objPongController.initMouseXY();

		objPongBall.getInitCoord();
		objPongBall.getInitDirection();
		objPongBall.displaySpeed();

		content.document.getElementById('stepLength').value	= objPongBall.step;
		content.document.getElementById('enableSound').checked	= '';

		// compute bounce X
		objPongController.raquettePlayer.bounceX	= objPongView.playZoneLimit['minX']+objPongController.raquettePlayer.borderMargin+objPongController.raquettePlayer.size['width'];
		objPongController.raquetteComputer.bounceX	= objPongView.playZoneLimit['maxX']-objPongController.raquetteComputer.borderMargin-objPongController.raquetteComputer.size['width'];

		// field depth limitX
		objPongController.changeComputerViewField();
		//		objPongController.computerViewField['startX']=objPongController.raquetteComputer.bounceX-objPongController.computerViewField['width'];
		//		objPongView.drawViewField();


		objPongView.drawRaquette(objPongController.raquettePlayer);
		objPongView.drawRaquette(objPongController.raquetteComputer);

		//		objPongView.drawPoint();

		//		objPongController.startTimer();
		objPongView.start();

		},


	restart: function()
		{
		objPongBall.coord['prevX']=objPongBall.coord['currX'];
		objPongBall.coord['prevY']=objPongBall.coord['currY'];
		objPongView.restoreBallZone();

		objPongBall.getInitCoord();
		objPongBall.getInitDirection();
		},


	initMouseXY: function()
		{
		if(window.Event) { document.captureEvents(Event.MOUSEMOVE); }
		document.onmousemove = objPongController.getMouseXY;
		},


	getMouseXY: function(e)
		{
		var Y=(window.Event) ? e.pageY : event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
		objPongController.raquettePlayer.move(Y);
		},


	play: function()
		{
		objPongController.moveBall();
		objPongController.moveComputerRaquette();

		objPongController.bounceOrRank(objPongController.raquettePlayer);
		objPongController.bounceOrRank(objPongController.raquetteComputer);
		},


	startTimer: function()
		{
		objPongController.timer		= setInterval('objPongController.play();',objPongBall.delay);
		objPongController.timerRunning	= true;
		},


	stopTimer: function()
		{
		clearInterval(objPongController.timer);
		objPongController.timerRunning = false;
		},


	toggleRunning: function()
		{
		if(objPongController.timerRunning)
			{
			objPongController.stopTimer();
			content.document.getElementById('playPause').innerHTML='>';
			}
		else
			{
			objPongController.startTimer();
			content.document.getElementById('playPause').innerHTML='II';
			}
		},


	changeSpeed: function(increment)
		{
		var speedChange=increment*objPongBall.speedIncrement;

		objPongBall.delay+=speedChange;
		objPongController.stopTimer();
		objPongController.startTimer();

		if(objPongBall.delay<=0)
			objPongBall.delay=0;
		if(objPongBall.delay>objPongBall.maxDelay)
			objPongBall.delay=objPongBall.maxDelay;

		objPongBall.displaySpeed();
		},


	changeStep: function(increment)
		{
		if(objPongBall.step>=0)
			{
			var stepLength		= increment*objPongBall.stepIncrement;
			objPongBall.step	+= stepLength;
			content.document.getElementById('stepLength').value=objPongBall.step;
			}
		},


	moveBall: function() // ne, se, sw, nw
		{
		objPongBall.coord['prevX']=objPongBall.coord['currX'];
		objPongBall.coord['prevY']=objPongBall.coord['currY'];

		switch(objPongBall.direction)
			{
			case 'ne':
				objPongBall.coord['currX']+=objPongBall.step;
				objPongBall.coord['currY']-=objPongBall.step;
				break;
			case 'se':
				objPongBall.coord['currX']+=objPongBall.step;
				objPongBall.coord['currY']+=objPongBall.step;
				break;
			case 'sw':
				objPongBall.coord['currX']-=objPongBall.step;
				objPongBall.coord['currY']+=objPongBall.step;
				break;
			case 'nw':
				objPongBall.coord['currX']-=objPongBall.step;
				objPongBall.coord['currY']-=objPongBall.step;
				break;
			}

		objPongView.drawBall();
		objPongController.checkBallPos();
		},


	moveComputerRaquette: function()
		{
		var y=objPongController.raquetteComputer.coord['currY']+(objPongController.raquetteComputer.size['height']/2);
		if(objPongBall.coord['currX']>objPongController.computerViewField['startX'])
			{
			// following the ball as it's in the view field

			if(objPongBall.coord['currY']<y)
				{ objPongController.raquetteComputer.move(y-objPongController.raquetteComputer.step); }
			else
				{ objPongController.raquetteComputer.move(y+objPongController.raquetteComputer.step); }
			}
			/*
		else
			{
			// just moving around randomly
			var truc=objPongUtility.alea(2);
			window.status='RANDOM : '+truc;


			if(truc==1)
				{ objPongController.raquetteComputer.move(y+objPongController.raquetteComputer.step); }
			else
				{ objPongController.raquetteComputer.move(y-objPongController.raquetteComputer.step); }

			}
*/
		},


	checkBallPos:function()
		{
		// bounce at the bottom of the field
		if((objPongBall.coord['currY']+objPongBall.size['height'])>objPongView.playZoneLimit['maxY'])
			{
			if(objPongController.soundEnabled) { soundFx.ballBottomWallBounce.play(); }

			objPongView.drawPlayZone();
			switch(objPongBall.direction)
				{
				case 'sw':
					objPongBall.direction='nw';break;
				case 'se':
					objPongBall.direction='ne';break;
				}
			}

		// bounce at the top of the field
		if(objPongBall.coord['currY']<objPongView.playZoneLimit['minY'])
			{
			if(objPongController.soundEnabled) { soundFx.ballTopWallBounce.play(); }

			objPongView.drawPlayZone();
			switch(objPongBall.direction)
				{
				case 'nw':
					objPongBall.direction='sw';break;
				case 'ne':
					objPongBall.direction='se';break;
				}
			}

		// bounce at the right of the field
		if((objPongBall.coord['currX']+objPongBall.size['width'])>objPongView.playZoneLimit['maxX'])
			{
			if(objPongController.soundEnabled) { soundFx.ballRightWallBounce.play(); }

			objPongView.drawPlayZone();
			switch(objPongBall.direction)
				{
				case 'se':
					objPongBall.direction='sw';break;
				case 'ne':
					objPongBall.direction='nw';break;
				}

			// +1 point for human
			objPongController.playerHuman.score++;
			objPongController.playerHuman.displayScore();
			objPongController.restart();
			}

		// bounce at the left of the field
		if(objPongBall.coord['currX']<objPongView.playZoneLimit['minX'])
			{
			if(objPongController.soundEnabled) { soundFx.ballLeftWallBounce.play(); }

			objPongView.drawPlayZone();
			switch(objPongBall.direction)
				{
				case 'nw':
					objPongBall.direction='ne';break;
				case 'sw':
					objPongBall.direction='se';break;
				}

			// +1 point for computer
			objPongController.playerComputer.score++;
			objPongController.playerComputer.displayScore();

			objPongController.restart();
			}

		},


	bounceOrRank:function(raquette)
		{
		switch(raquette)
			{
			case objPongController.raquettePlayer:
				{
				if(objPongBall.coord['currX']<objPongController.raquettePlayer.bounceX)
					{
					if(((objPongBall.coord['currY']-objPongBall.size['height']/2)>=objPongController.raquettePlayer.coord['currY'])&&((objPongBall.coord['currY']+objPongBall.size['height']/2)<=(objPongController.raquettePlayer.coord['currY']+objPongController.raquettePlayer.size['height'])))
						{
						if(objPongController.soundEnabled) { soundFx.ballRaquetteBounce.play(); }

						switch(objPongBall.direction)
							{
							case 'nw': objPongBall.direction='ne';break;
							case 'sw': objPongBall.direction='se';break;
							}
						}
					}
				}

			case objPongController.raquetteComputer:
				{
				if((objPongBall.coord['currX']+objPongBall.size['width'])>objPongController.raquetteComputer.bounceX)
					{
					if(((objPongBall.coord['currY']-objPongBall.size['height']/2)>=objPongController.raquetteComputer.coord['currY'])&&((objPongBall.coord['currY']+objPongBall.size['height']/2)<=(objPongController.raquetteComputer.coord['currY']+objPongController.raquetteComputer.size['height'])))
						{
						if(objPongController.soundEnabled) { soundFx.ballRaquetteBounce.play(); }

						switch(objPongBall.direction)
							{
							case 'ne': objPongBall.direction='nw';break;
							case 'se': objPongBall.direction='sw';break;
							}
						}
					}
				}
			}
		},
	};


// ==================================================================================================
// ====================================== VIEW ======================================================
// ==================================================================================================

var objPongView = {
	'canvas'				: content.document.getElementById('myCanvas'),
	'ctxt'					: content.document.getElementById('myCanvas').getContext('2d'),

	'playZonePadding'		: 30,	// padding between canvas display zone and the game field
	'playZoneLineWidth'	: 12,
	'playZoneLimit'		: {'minX' : 0, 'maxX' : 0, 'minY' : 0, 'maxY' : 0 },

	'canvasToWindowPadding'	: {'global' : 0, 'right' : 0, 'bottom' : 28},	// 28 pixels between the right/bottom canvas borders to avoid scrollbars

	'ballZoneData'				: 0,	// init. of the display zone containing the ball, before backup.


	start: function()
		{
		objPongView.drawPlayZone();
		//		objPongView.drawViewField();
		objPongView.drawBall();
		},


	getWindowSize:function()
		{
		var leftWidth		= document.getElementById('left').offsetWidth;	// width of tf element
		var remainingWidth	= window.innerWidth-leftWidth-20;

		return {'width':remainingWidth, 'height':window.innerHeight};
		},


	setCanvasSize: function(params)
		{
		objPongView.canvas.height	= params['height']-objPongView.canvasToWindowPadding['global']-objPongView.canvasToWindowPadding['bottom'];
		objPongView.canvas.width	= params['width']-objPongView.canvasToWindowPadding['global']-objPongView.canvasToWindowPadding['right'];
		},


	getCanvasSize:function()
		{
		return {
			'width'	: objPongView.canvas.width,
			'height'	: objPongView.canvas.height
			};
		},


	/**
	 * get window size, adjust canvas accordingly and draw the play zone
	 */
	resize: function()
		{
		var params=objPongView.getWindowSize();
		objPongView.setCanvasSize(params);

		content.document.getElementById('left').style.height=params['height']-20+'px';
		objPongView.drawPlayZone();

		var canvasSize						= objPongView.getCanvasSize();
		objPongView.playZoneLimit['minX']	= objPongView.playZonePadding+objPongView.playZoneLineWidth/2;
		objPongView.playZoneLimit['maxX']	= canvasSize['width']-objPongView.playZonePadding-objPongView.playZoneLineWidth/2;
		objPongView.playZoneLimit['minY']	= objPongView.playZonePadding+objPongView.playZoneLineWidth/2;
		objPongView.playZoneLimit['maxY']	= canvasSize['height']-objPongView.playZonePadding-objPongView.playZoneLineWidth/2;

		objPongController.raquettePlayer.getInitCoord();
		objPongController.raquetteComputer.getInitCoord();
		},


	drawPlayZone: function()
		{
		// THE FIELD
		var canvasSize		= objPongView.getCanvasSize();
		var playZoneWidth	= canvasSize['width']-(2*objPongView.playZonePadding);
		var playZoneHeight	= canvasSize['height']-(2*objPongView.playZonePadding);

		objPongView.ctxt.lineWidth		= objPongView.playZoneLineWidth;
		objPongView.ctxt.strokeStyle	='#aaa';
		objPongView.ctxt.strokeRect(objPongView.playZonePadding,objPongView.playZonePadding,playZoneWidth,playZoneHeight);	// start x, start y, width, height

		// THE NET
		objPongView.ctxt.moveTo(objPongView.playZonePadding+playZoneWidth/2,objPongView.playZonePadding/2);
		objPongView.ctxt.lineTo(objPongView.playZonePadding+playZoneWidth/2,playZoneHeight+objPongView.playZonePadding*3/2);
		objPongView.ctxt.stroke();

		},


	drawRaquette: function(laRaquette)
		{
		objPongView.ctxt.lineWidth	= laRaquette.lineWidth;
		objPongView.ctxt.fillStyle	= '#000';
		objPongView.ctxt.fillRect(laRaquette.coord['X'],laRaquette.coord['prevY'],laRaquette.size['width'],laRaquette.size['height']);	// start x, start y, width, height

		objPongView.ctxt.fillStyle	='#fff';
		objPongView.ctxt.fillRect(laRaquette.coord['X'],laRaquette.coord['currY'],laRaquette.size['width'],laRaquette.size['height']);	// start x, start y, width, height

		},


	drawPoint: function()
		{
		var coteX=objPongBall.size['width'];
		var coteY=objPongBall.size['height'];

		var startX=objPongBall.coord['currX'];
		var startY=objPongBall.coord['currY'];

		objPongView.ctxt.fillStyle = '#f00';
		objPongView.ctxt.fillRect(startX,startY,coteX,coteY);	// start x, start y, width, height
		},


	drawPoint2: function(startX,startY,width,height,color)
		{
		objPongView.ctxt.fillStyle = color;
		objPongView.ctxt.fillRect(startX,startY,width,height);	// start x, start y, width, height
		},


	drawViewField: function()
		{
		// fill the play zone with a black rectangle to erase the view field
		var startX=objPongView.playZoneLimit['minX'];
		var startY=objPongView.playZoneLimit['minY'];

		var coteX=objPongController.raquetteComputer.bounceX-objPongView.playZoneLimit['minX'];
		var coteY=objPongView.playZoneLimit['maxY']-objPongView.playZoneLimit['minY'];

		objPongView.ctxt.fillStyle	= '#000';
		objPongView.ctxt.fillRect(startX,startY,coteX,coteY);	// start x, start y, width, height

		// show the view field
		startX	= objPongController.computerViewField['startX'];
		startY	= objPongView.playZoneLimit['minY'];
		coteX	= objPongController.computerViewField['width'];
		coteY	= objPongView.playZoneLimit['maxY']-objPongView.playZoneLimit['minY'];

		objPongView.ctxt.fillStyle = '#404';
		objPongView.ctxt.fillRect(startX,startY,coteX,coteY);	// start x, start y, width, height
		},


	drawBall: function()
		{
		objPongView.restoreBallZone();
		objPongView.backupBallZone();

		objPongView.ctxt.fillStyle = '#fff';
		objPongView.ctxt.fillRect(objPongBall.coord['currX'],objPongBall.coord['currY'],objPongBall.size['width'],objPongBall.size['height']);	// start x, start y, width, height
		},


	/**
	 * Backup what will be under the ball
	 * source : https://developer.mozilla.org/En/HTML/Canvas/Pixel_manipulation_with_canvas
	 */
	backupBallZone: function()
		{
		objPongView.ballZoneData=objPongView.ctxt.getImageData(objPongBall.coord['currX'],objPongBall.coord['currY'],objPongBall.size['width'],objPongBall.size['height']);
		},

	restoreBallZone: function()
		{
		if(objPongBall.nbSteps<1)
			{ objPongBall.nbSteps++; }
		else
			{
			try
				{ objPongView.ctxt.putImageData(objPongView.ballZoneData,objPongBall.coord['prevX'],objPongBall.coord['prevY']); }
			catch(err) {}
			}
		},
	};



// ==================================================================================================
// ====================================== STARTING IT ALL ! =========================================
// ==================================================================================================
objPongController.start();
