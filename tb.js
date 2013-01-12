var BOARD_SIZE = 12;
var SQUARE_SIZE = 48;

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
				board[Math.floor(i / BOARD_SIZE)][i % BOARD_SIZE] = data.charAt(i);
			}
			$(".inBoard").remove();
			for (var i = 0; i < board.length; ++i) {
				for (var j = 0; j < board.length; ++j){
					var $palette = $(codeDivs[board[i][j]]);
					$palette = $palette.clone();
					$palette.addClass("inBoard").addClass("r" + i + "c" + j);
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
		case KEY_UP: step(-1, 0); break;
		case KEY_DOWN: step(1, 0); break;
		case KEY_LEFT: step(0, -1); break;
		case KEY_RIGHT: step(0, 1); break;
	}
}

function step(dirX, dirY) {
	var changeSet = moveBlocks(dirX, dirY);
	animateBlocks(changeSet);
}

function moveBlock(startR, startC, endR, endC) {
	if (startR == endR && startC == endC) return false;

	var start = [startR, startC];
	var end = [endR, endC];
	
	board[end[0]][end[1]] = board[start[0]][start[1]];
	board[start[0]][start[1]] = ".";
	
	var elem = new Object();
	elem.start = start;
	elem.end = end;
	return elem;
}

function moveBlocks(dirR, dirC) {
	var changeSet = new Array();
	
	if (dirC < 0) {
		for (var i = 0; i < BOARD_SIZE; ++i) {
			for (var j = 0; j < BOARD_SIZE; ++j) {
				if ($.inArray(board[i][j], ['1', '2', '3', '4']) >= 0) {
					for (var k = j - 1; k >= 0; --k) 
					{
						if ($.inArray(board[i][k], ['X', '1', '2', '3', '4']) >= 0) {
							var elem = moveBlock(i, j, i, k + 1);
							if (elem) {
								changeSet.push(elem);
							}
							break;
						}
					}
				}
			}
		}
	}
	
	if (dirC > 0) {
		for (var i = 0; i < BOARD_SIZE; ++i) {
			for (var j = BOARD_SIZE - 1; j > 0 ; --j) {
				if ($.inArray(board[i][j], ['1', '2', '3', '4']) >= 0) {
					for (var k = j + 1; k >= 0; ++k) 
					{
						if ($.inArray(board[i][k], ['X', '1', '2', '3', '4']) >= 0) {
							var elem = moveBlock(i, j, i, k - 1);
							if (elem) {
								changeSet.push(elem);
							}
							break;
						}
					}
				}
			}
		}
	}
	
	if (dirR < 0) {
		for (var i = 0; i < BOARD_SIZE; ++i) {
			for (var j = 0; j < BOARD_SIZE; ++j) {
				if ($.inArray(board[j][i], ['1', '2', '3', '4']) >= 0) {
					for (var k = j - 1; k >= 0; --k) 
					{
						if ($.inArray(board[k][i], ['X', '1', '2', '3', '4']) >= 0) {
							var elem = moveBlock(j, i, k + 1, i);
							if (elem) {
								changeSet.push(elem);
							}
							break;
						}
					}
				}
			}
		}
	}
	
	if (dirR > 0) {
		for (var i = 0; i < BOARD_SIZE; ++i) {
			for (var j = BOARD_SIZE - 1; j > 0 ; --j) {
				if ($.inArray(board[j][i], ['1', '2', '3', '4']) >= 0) {
					for (var k = j + 1; k >= 0; ++k) 
					{
						if ($.inArray(board[k][i], ['X', '1', '2', '3', '4']) >= 0) {
							var elem = moveBlock(j, i, k - 1, i);
							if (elem) {
								changeSet.push(elem);
							}
							break;
						}
					}
				}
			}
		}
	}
	
	return changeSet;
}

function animateBlocks(changeSet) {
	for (var elem in changeSet) {
		console.log(changeSet[elem]);
	}
}