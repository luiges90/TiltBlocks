var BOARD_SIZE = 16;
var SQUARE_SIZE = 32;

// state constants
var STATE_LOADING = 0;
var STATE_READY = 1;
var STATE_MOVING = 2;
var STATE_ALERTING = 3;

// key constants
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

var state;

$(document).ready(function() {
	state = STATE_LOADING;
	initialize();
	loadLevel("1-1");
	$(document).keyup(keyPressed);
});

var board;
var codeDivs;

function initialize() {
    // initialize board
	board = new Array();
	for (var i = 0; i < BOARD_SIZE; ++i) 
	{
		board[i] = new Array();
		for (var j = 0; j < BOARD_SIZE; ++j)
		{
			board[i][j] = new Object();
		}
	}
	
	// initialize code map
	codeDivs = new Array();
	$(".palette").each(function() {
		codeDivs[$(this).data('code')] = this;
	});
}

function loadLevel(name) {
	$.ajax({
		url : "levels/" + name + ".txt",
		dataType: "text",
		success : function (data) {
			data = data.replace(/\s/g, "");
			for (var i = 0; i < data.length; ++i) {
				board[Math.floor(i / 16)][i % 16].code = data.charAt(i);
			}
			$(".inBoard").remove();
			for (var i = 0; i < board.length; ++i) {
				for (var j = 0; j < board.length; ++j){
					var $palette = $(codeDivs[board[i][j].code]);
					$palette = $palette.clone();
					$palette.addClass("inBoard");
					$palette.offset({top: SQUARE_SIZE * i, left: SQUARE_SIZE * j});
					$palette.appendTo("#board");
				}
			}
			state = STATE_READY;
		}
	});
}

function keyPressed(e) {
	if (state != STATE_READY) return;
	switch (e.which) {
		case KEY_UP: step(0, -1); break;
		case KEY_DOWN: step(0, 1); break;
		case KEY_LEFT: step(-1, 0); break;
		case KEY_RIGHT: step(1, 0); break;
	}
}

function step(dirX, dirY) {
	
}