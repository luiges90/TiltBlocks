var BOARD_SIZE = 12;
var SQUARE_SIZE = 48;

// state constants
var STATE_LOADING = 0;
var STATE_READY = 1;
var STATE_ANIMATING = 2;
var STATE_CLEARED = 3;
var STATE_FAILED = 4;
var STATE_MAIN_MENU = 5;

// key constants
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

var state;

var step, stepLimit;

var level = 0;

var BLOCK_CODE = ['1', '2', '3', '4', '5', '6'];
var MOVABLE_CODE = BLOCK_CODE.concat(['0']);
var SOLID_CODE = MOVABLE_CODE.concat(['X']);

var PROGRESS_KEY = 'tb_level';

function getLevelString(){
	return (Math.floor(level / 10) + 1) + '-' + (level % 10 + 1);
}

var stored_level = 0;

$(document).ready(function() {
	state = STATE_MAIN_MENU;
	initialize();
	createLevelSelectScene();
	
	$(document).keyup(keyPressed);
	$(".arrow").mousedown(arrowPressed);
	
	$(".scene").hide();
	$("#main-menu-scene").show();
	
	$("#main-menu-scene .start").click(function(){
		$(".scene").fadeOut();
		$("#game-scene").fadeIn();
		level = localStorage.getItem(PROGRESS_KEY);
		level = parseInt(level);
		if (isNaN(level)) level = 0;
		$("#main-menu-scene #progress-clear-alert").hide();
		loadLevel(level);
	});

	$("#main-menu-scene .level-select").click(function(){
		$(".scene").fadeOut();
		$("#level-select-scene").fadeIn();
	});
	
	$("#main-menu-scene .clear-progress").click(function(){
		if (level > 0){
			stored_level = level;
		}
		localStorage.removeItem(PROGRESS_KEY);
		$("#main-menu-scene #progress-clear-alert").html('Progress cleared. <a href="#">Ouch! Undo my clear!!</a>').show();
		$("#main-menu-scene #progress-clear-alert a").click(function(e) {
			e.preventDefault();
			level = stored_level;
			localStorage.setItem(PROGRESS_KEY, stored_level);
			$("#main-menu-scene #progress-clear-alert").html("OK, your progress has been restored. :)").delay(5000).fadeOut();
		});
		level = 0;
	});
	
	$(".home").click(function() {
		$(".next").off("click");
		$("#popup-layer").fadeOut();
		$(".popup").fadeOut();
		$(".popup-bg").fadeOut();
		$(".scene").fadeOut();
		$("#main-menu-scene").fadeIn();
		state = STATE_MAIN_MENU;
	});

	$(".retry").click(function() {
		$(".next").off("click");
		loadLevel(level);
		$("#popup-layer").fadeOut();
		$(".popup").fadeOut();
		$(".popup-bg").fadeOut();
	});
	
});

var board;
var codeDivs;
var step, stepLimit;

function initialize() {
    // initialize board
	board = [];
	for (var i = 0; i < BOARD_SIZE; ++i) 
	{
		board[i] = [];
	}
	
	// initialize code map
	codeDivs = [];
	$(".palette").each(function() {
		codeDivs[$(this).data('code')] = this;
	});
}

function createLevelSelectScene() {
	for (var i = 0; i < 10; ++i) {
		for (var j = 0; j < 10; ++j) {
			var levelBtn = $('<div>');
			levelBtn.addClass("level").data('level', i * 10 + j);
			levelBtn.css("left", j * 60).css("top", i * 50);
			levelBtn.html((i + 1) + "-" + (j + 1));
			levelBtn.click(function() {
				$(".scene").fadeOut();
				$("#game-scene").fadeIn();
				level = $(this).data('level');
				loadLevel(level);
			});
			$("#level-select-scene .levels").append(levelBtn);
		}
	}
}

function loadLevel(name) {
	state = STATE_LOADING;
	$.ajax({
		url : "levels/" + getLevelString() + ".txt",
		dataType: "text",
		success : function (data) {
			// read and parse level file
			data = data.replace(/\s/g, "");
			for (var i = 0; i < BOARD_SIZE * BOARD_SIZE; ++i) {
				board[Math.floor(i / BOARD_SIZE)][i % BOARD_SIZE] = data.charAt(i);
			}
			stepLimit = parseInt(data.slice(-2));
			step = stepLimit;
			
			// setup board
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
			
			// setup info
			$("#level .content").html(getLevelString);
			$("#steps .content").html(step + "/" + stepLimit);
			$(".arrow").removeClass("lastDir");
			$("#steps .content").removeClass("warning");
			
			// ready
			state = STATE_READY;
		}
	});
}

function markMoved(dir) {
	$(".arrow").removeClass("lastDir");
	$("." + dir).addClass("lastDir");
}

function keyPressed(e) {
	if (state != STATE_READY) return;
	switch (e.which) {
		case KEY_UP: 
			if ($(".up").hasClass("lastDir")) return;
			makeStep(-1, 0); 
			markMoved("up"); 
			break;
		case KEY_DOWN: 
			if ($(".down").hasClass("lastDir")) return;
			makeStep(1, 0); 
			markMoved("down"); 
			break;
		case KEY_LEFT: 
			if ($(".left").hasClass("lastDir")) return;
			makeStep(0, -1); 
			markMoved("left"); 
			break;
		case KEY_RIGHT: 
			if ($(".right").hasClass("lastDir")) return;
			makeStep(0, 1); 
			markMoved("right"); 
			break;
	}
}

function arrowPressed(e) {
	if (state != STATE_READY) return;
	var $this = $(this);
	if ($this.hasClass("lastDir")) return;
	if ($this.hasClass("up")) {
		makeStep(-1, 0);
		markMoved("up"); 
	} else if ($this.hasClass("down")) {
		makeStep(1, 0);
		markMoved("down"); 
	} else if ($this.hasClass("left")) {
		makeStep(0, -1);
		markMoved("left"); 
	} else if ($this.hasClass("right")) {
		makeStep(0, 1);
		markMoved("right"); 
	}
}

function makeStep(dirX, dirY) {
	var steps = [];
	do {
		var moved = moveBlocks(dirX, dirY);
		steps.push(moved);
		var eliminated = eliminateBlocks();
		steps.push(eliminated);
	} while (eliminated.length > 0);
	--step;
	$("#steps .content").html(step + "/" + stepLimit);
	if (step < 2) {
		$("#steps .content").addClass("warning");
	}
	animateBlocks(steps, function(){
		state = STATE_READY;
		checkComplete();
		checkFail();
	});
}

function moveBlock(startR, startC, endR, endC) {
	var start = [startR, startC];
	var end = [endR, endC];
	
	if (startR != endR || startC != endC) {
		board[end[0]][end[1]] = board[start[0]][start[1]];
		board[start[0]][start[1]] = ".";
	}
	
	return {start: start, end: end};
}

function moveBlocks(dirR, dirC) {
	var changeSet = [];
	
	if (dirC < 0) {
		for (var i = 0; i < BOARD_SIZE; ++i) {
			for (var j = 0; j < BOARD_SIZE; ++j) {
				if ($.inArray(board[i][j], MOVABLE_CODE) >= 0) {
					for (var k = j - 1; k >= 0; --k) 
					{
						if ($.inArray(board[i][k], SOLID_CODE) >= 0) {
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
				if ($.inArray(board[i][j], MOVABLE_CODE) >= 0) {
					for (var k = j + 1; k >= 0; ++k) 
					{
						if ($.inArray(board[i][k], SOLID_CODE) >= 0) {
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
				if ($.inArray(board[j][i], MOVABLE_CODE) >= 0) {
					for (var k = j - 1; k >= 0; --k) 
					{
						if ($.inArray(board[k][i], SOLID_CODE) >= 0) {
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
				if ($.inArray(board[j][i], MOVABLE_CODE) >= 0) {
					for (var k = j + 1; k >= 0; ++k) 
					{
						if ($.inArray(board[k][i], SOLID_CODE) >= 0) {
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
	var eliminateSet = [];
	for (var i = 0; i < BOARD_SIZE; ++i){
		for (var j = 0; j < BOARD_SIZE; ++j) {
			if ($.inArray(board[i][j], BLOCK_CODE) >= 0) {
				var color = board[i][j];
				var visited = [];
				for (var k = 0; k < BOARD_SIZE; ++k) 
				{
					visited[k] = [];
					for (var l = 0; l < BOARD_SIZE; ++l) 
					{
						visited[k][l] = false;
					}
				}
				var eliminated = [];
				
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
var ELIMINATE_SPEED = 400;
function animateBlocks(steps, callback) {
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
		}

		for (var j in steps[i]) {
			var start = steps[i][j].start;
			var end = steps[i][j].end;
			var distance = Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]);
			
			$(".r" + start[0] + "c" + start[1]).animate({top: SQUARE_SIZE * end[0], left: SQUARE_SIZE * end[1]}, distance * MOVING_SPEED, "linear")
				.removeClass("r" + start[0] + "c" + start[1]).addClass("r" + end[0] + "c" + end[1]).delay(maxDistance * MOVING_SPEED - distance * MOVING_SPEED);
		}
		animationTime += maxDistance * MOVING_SPEED;
		
		// eliminate
		for (var j in steps[i+1]) {
			$(".r" + steps[i+1][j][0] + "c" + steps[i+1][j][1]).fadeOut(ELIMINATE_SPEED, function(){$(this).remove();});
		}
		
		if (steps[i+1].length > 0){
			animationTime += ELIMINATE_SPEED;
			for (var j in steps[i]) {
				var end = steps[i][j].end;
				$(".r" + end[0] + "c" + end[1]).delay(ELIMINATE_SPEED);
			}
		}
	}

	setTimeout(callback, animationTime);
}

function checkComplete() {
	var completed = true;
	for (var i = 0; i < BOARD_SIZE; ++i){
		for (var j = 0; j < BOARD_SIZE; ++j) {
			if ($.inArray(board[i][j], BLOCK_CODE) >= 0) {
				completed = false;
			}
		}
	}
	if (completed) {
		$(".level-cleared .content").html("Steps remain: " + step);
		$("#popup-layer").css('background-color', 'transparent').fadeIn();
		$(".level-cleared").fadeIn();
		state = STATE_CLEARED;
		$(".next").one("click", function() {
			level++;
			localStorage.setItem(PROGRESS_KEY, level);
			loadLevel(level);
			$("#popup-layer").fadeOut();
			$(".level-cleared").fadeOut();
		});
	}
}

function checkFail() {
	if (state == STATE_CLEARED) return;

	var failed = false;
	if (step <= 0) {
		failed = "Too many steps!";
	}
	var counts = [];
	for (var i = 0; i < BOARD_SIZE; ++i){
		for (var j = 0; j < BOARD_SIZE; ++j) {
			if ($.inArray(board[i][j], BLOCK_CODE) >= 0) {
				if (counts[board[i][j]] === undefined){
					counts[board[i][j]] = 1;
				} else {
					counts[board[i][j]]++;
				}
			}
		}
	}
	for (var i in counts){
		if (counts[i] == 1){
			failed = "Impossible to clear!";
		}
	}
	
	if (failed) {
		$(".level-failed .content").html(failed);
		$("#popup-layer").css('background-color', '#000').fadeIn();
		$(".level-failed").fadeIn();
		state = STATE_FAILED;
	}
}