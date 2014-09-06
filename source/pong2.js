var posicao = null;
var posicao2 = null;

window.onload = function() {


	var video = document.getElementById('video');

	var tracker = new tracking.ColorTracker(['yellow']);
	var tracker2 = new tracking.ColorTracker(['magenta']);

	tracking.track('#video', tracker, { camera: true });
	tracking.track('#video', tracker2, { camera: true });

	tracker.on('track', function(event) {
		event.data.forEach(function(rect) {
	  		posicao = rect.y * 2.7;
		});
	});

	tracker2.on('track', function(event) {
		event.data.forEach(function(rect) {
	  		posicao2 = rect.y * 2.7;
		});
	});


	// start and run the game
	main();

	initGUIControllers(tracker);
	initGUIControllers(tracker2);


}

Player = function(name,px, py){
	return{

	x: px,
	y: py,

	width:  20,
	height: 100,

	/**
	 * Update the position depending on pressed keys
	 */
	update: function(posicao) {			
		if (keystate[UpArrow]) this.y -= 7;
		if (keystate[DownArrow]) this.y += 7;
		// keep the paddle inside of the canvas
		//this.y = posicao;
		this.y = Math.max(Math.min(this.y, HEIGHT - this.height), 0);
	},

	/**
	 * Draw the player paddle to the canvas
	 */
	draw: function() {
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
	}
};

var

/**
 * Constants
 */
WIDTH  = window.innerWidth,
HEIGHT = window.innerHeight,

pi = Math.PI,

UpArrow   = 38,
DownArrow = 40,

/**
 * Game elements
 */
canvas,
ctx,
keystate,

/**
 * The player paddle
 * 
 * @type {Object}
 */
p1 = new Player('player 1',null,null),

/**
 * The ai paddle
 * 
 * @type {Object}
 */
p2 = new Player('player 2',300,null),

ai = new Player('player 3',null,null)
/**	
 * The ball object
 * 
 * @type {Object}
 */
ball = {
	x:   null,
	y:   null,
	vel: null,

	side:  20,
	speed: 12,

	/**
	 * Serves the ball towards the specified side
	 * 
	 * @param  {number} side 1 right
	 *                       -1 left
	 */
	serve: function(side) {
		// set the x and y position
		var r = Math.random();
		this.x = side===1 ? p1.x+p1.width : ai.x - this.side;
		this.y = (HEIGHT - this.side)*r;
		// calculate out-angle, higher/lower on the y-axis =>
		// steeper angle
		var phi = 0.1*pi*(1 - 2*r);
		// set velocity direction and magnitude
		this.vel = {
			x: side*this.speed*Math.cos(phi),
			y: this.speed*Math.sin(phi)
		}
	},

	/**
	 * Update the ball position and keep it within the canvas
	 */
	update: function(player) {
		// update position with current velocity
		this.x += this.vel.x;
		this.y += this.vel.y;
		// check if out of the canvas in the y direction
		if (0 > this.y || this.y+this.side > HEIGHT) {
			// calculate and add the right offset, i.e. how far
			// inside of the canvas the ball is
			var offset = this.vel.y < 0 ? 0 - this.y : HEIGHT - (this.y+this.side);
			this.y += 2*offset;
			// mirror the y velocity
			this.vel.y *= -1;
		}
		// helper function to check intesectiont between two
		// axis aligned bounding boxex (AABB)
		var AABBIntersect = function(ax, ay, aw, ah, bx, by, bw, bh) {
			return ax < bx+bw && ay < by+bh && bx < ax+aw && by < ay+ah;
		};

		// check againts target paddle to check collision in x
		// direction
		var pdle = this.vel.x < 0 ? player : ai;
		if (AABBIntersect(pdle.x, pdle.y, pdle.width, pdle.height,
				this.x, this.y, this.side, this.side)
		) {	
			// set the x position and calculate reflection angle
			this.x = pdle===player ? player.x+player.width : ai.x - this.side;
			var n = (this.y+this.side - pdle.y)/(pdle.height+this.side);
			var phi = 0.25*pi*(2*n - 1); // pi/4 = 45
			// calculate smash value and update velocity
			var smash = Math.abs(phi) > 0.2*pi ? 1.5 : 1;
			this.vel.x = smash*(pdle===player ? 1 : -1)*this.speed*Math.cos(phi);
			this.vel.y = smash*this.speed*Math.sin(phi);
		}

		// reset the ball when ball outside of the canvas in the
		// x direction
		if (0 > this.x+this.side || this.x > WIDTH) {
			this.serve(pdle===player ? 1 : -1);
		}
	},

	/**
	 * Draw the ball to the canvas
	 */
	draw: function() {
		ctx.fillRect(this.x, this.y, this.side, this.side);
	}
};

/**
 * Starts the game
 */
function main() {
	// create, initiate and append game canvas
	canvas = document.createElement("canvas");
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	ctx = canvas.getContext("2d");
	document.body.appendChild(canvas);

	keystate = {};
	// keep track of keyboard presses
	document.addEventListener("keydown", function(evt) {
		keystate[evt.keyCode] = true;
	});
	document.addEventListener("keyup", function(evt) {
		delete keystate[evt.keyCode];
	});

	init(); // initiate game objects

	// game loop function
	var loop = function() {
		update();
		draw();

		window.requestAnimationFrame(loop, canvas);
	};
	window.requestAnimationFrame(loop, canvas);
}

/**
 * Initatite game objects and set start positions
 */
function init() {
	p1.x = p1.width;
	p1.y = (HEIGHT - p1.height)/2;

	ai.x = WIDTH - (p1.width + ai.width);
	ai.y = (HEIGHT - ai.height)/2;

	ball.serve(1);
}

/**
 * Update all game objects
 */
function update() {
	ball.update(p2);
	p1.update(posicao);
	p2.update(posicao2);
	ai.update();
}

/**
 * Clear canvas and draw all game objects and net
 */
function draw() {
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	ctx.save();

	ctx.fillStyle = "#fff";

	ball.draw();
	p1.draw();
	p2.draw();
	ai.draw();

	// draw the net
	var w = 4;
	var x = (WIDTH - w)*0.5;
	var y = 0;
	var step = HEIGHT/20; // how many net segments
	while (y < HEIGHT) {
		ctx.fillRect(x, y+step*0.25, w, step*0.5);
		y += step;
	}

	ctx.restore();
}
