var BOARD_SIZE = 12;
var SQUARE_SIZE = 48;

// state constants
var STATE_LOADING = 0;
var STATE_READY = 1;
var STATE_ANIMATING = 2;
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
					if (typeof codeDivs[board[i][j]] !== 'undefined'){
						$(codeDivs[board[i][j]]).clone()
							.removeClass("palette").addClass("inBoard").addClass("r" + i + "c" + j)
							.offset({top: SQUARE_SIZE * i, left: SQUARE_SIZE * j}).appendTo("#board");
					}
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
	var steps = new Array();
	do {
		var moved = moveBlocks(dirX, dirY);
		steps.push(moved);
		var eliminated = eliminateBlocks();
		steps.push(eliminated);
	} while (eliminated.length > 0);
	animateBlocks(steps);
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

function eliminateBlocks() {
	var eliminateSet = new Array();
	for (var i = 0; i < BOARD_SIZE; ++i){
		for (var j = 0; j < BOARD_SIZE; ++j) {
			if ($.inArray(board[i][j], ['1', '2', '3', '4']) >= 0) {
				var color = board[i][j];
				var visited = new Array();
				for (var k = 0; k < BOARD_SIZE; ++k) 
				{
					visited[k] = new Array();
					for (var l = 0; l < BOARD_SIZE; ++l) 
					{
						visited[k][l] = false;
					}
				}
				var eliminated = new Array();
				
				(function dfs(startR, startC){
					visited[startR][startC] = true;
					eliminated.push([startR, startC]);
					if (startR > 0 && !visited[startR - 1][startC] && board[startR - 1][startC] == color) {
						dfs(startR - 1, startC);
					}
					if (startR < BOARD_SIZE && !visited[startR + 1][startC] && board[startR + 1][startC] == color) {
						dfs(startR + 1, startC);
					}
					if (startC > 0 && !visited[startR][startC - 1] && board[startR][startC - 1] == color) {
						dfs(startR, startC - 1);
					}
					if (startC < BOARD_SIZE && !visited[startR][startC + 1] && board[startR][startC + 1] == color) {
						dfs(startR, startC + 1);
					}
				})(i, j);
				
				if (eliminated.length > 1) {
					for (var i in eliminated) {
						board[eliminated[i][0]][eliminated[i][1]] = ".";
						eliminateSet.push(eliminated[i]);
					}
				}
			}
		}
	}
	return eliminateSet;
}

var MOVING_SPEED = 100;
function animateBlocks(steps) {
	state = STATE_ANIMATING;
	
	var animationTime = 0;
	for (var i = 0; i < steps.length; i += 2) {
		// move
		var maxDistance = -1;
		for (var j in steps[i]) {
			var start = steps[i][j].start;
			var end = steps[i][j].end;

			var distance = Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]);
			if (distance > maxDistance) {
				maxDistance = distance;
			}
			
			$(".r" + start[0] + "c" + start[1]).animate({top: SQUARE_SIZE * end[0], left: SQUARE_SIZE * end[1]}, distance * MOVING_SPEED, "linear")
				.removeClass("r" + start[0] + "c" + start[1]).addClass("r" + end[0] + "c" + end[1]);
		}
		animationTime += maxDistance * MOVING_SPEED;
		
		// eliminate
		for (var j in steps[i+1]) {
			$(".r" + steps[i+1][j][0] + "c" + steps[i+1][j][1]).fadeOut(400, function(){$(this).remove();});
		}
	}

	setTimeout(function(){state = STATE_READY;}, animationTime);
}