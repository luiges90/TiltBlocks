"use strict";

var BOARD_SIZE = 12;
var SQUARE_SIZE = 48;

// state constants
var STATE_LOADING = 0;
var STATE_READY = 1;
var STATE_ANIMATING = 2;
var STATE_CLEARED = 3;
var STATE_FAILED = 4;
var STATE_MAIN_MENU = 5;
var inEditor = false;

// key constants
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

var state;

var step, stepLimit;

var level = 0;

var BLOCK_CODE = ['1', '2', '3', '4', '5', '6', '9'];
var MOVABLE_CODE = BLOCK_CODE.concat(['0']);
var GATE_CODE = ['U', 'I', 'O', 'P'];
var SOLID_CODE = MOVABLE_CODE.concat(GATE_CODE).concat(['X']);
var BOTTOM_LAYER_CODE = ['W', 'A', 'S', 'D', 'T', 'H', 'J', 'K', 'L'];
var BOTTOM_LAYER_CLASSES = '.leftArrow, .rightArrow, .upArrow, .downArrow, .sticky, .redTrigger, .greenTrigger, .blueTrigger, .yellowTrigger';

var PROGRESS_KEY = 'tb_level';

function getLevelString(number){
	return (Math.floor(number / 10) + 1) + '-' + (number % 10 + 1);
}

var furthestLevel = 0;
var storedLevel = 0;

$(document).ready(function() {
	state = STATE_MAIN_MENU;
	
	furthestLevel = localStorage.getItem(PROGRESS_KEY);
	furthestLevel = parseInt(furthestLevel);
	if (isNaN(furthestLevel)) furthestLevel = 0;
	level = furthestLevel;
	
	initialize();
	createLevelSelectScene();
	
	$(document).keyup(keyPressed);
	$(".arrow").mousedown(arrowPressed);
	
	$(".scene").hide();
	$("#main-menu-scene").show();
	
	$("#main-menu-scene .start").click(function(){
		$(".scene").fadeOut();
		$("#game-scene").fadeIn();
		$("#main-menu-scene #progress-clear-alert").hide();
		loadLevel(furthestLevel);
	});

	$("#main-menu-scene .level-select").click(function(){
		$("#level-select-scene .level").each(function(){
			if ($(this).data('level') < furthestLevel) {
				$(this).css("background-color", "#0F0").addClass("cleared-level open-level");
			} else if ($(this).data('level') == furthestLevel) {
				$(this).css("background-color", "#FF0").addClass("current-level open-level");
			} else {
				$(this).css("background-color", "#CCC").addClass("locked-level");
			}
		});
		$(".scene").fadeOut();
		$("#level-select-scene").fadeIn();
	});
	
	$("#level-select-scene").on('click', '.level.open-level', function() {
		$(".scene").fadeOut();
		$("#game-scene").fadeIn();
		level = $(this).data('level');
		loadLevel(level);
	});
	
	$("#main-menu-scene .clear-progress").click(function(){
		if (level > 0){
			storedLevel = furthestLevel;
		}
		localStorage.removeItem(PROGRESS_KEY);
		$("#main-menu-scene #progress-clear-alert").html('Progress cleared. <a href="#">Ouch! Undo my clear!!</a>').show();
		$("#main-menu-scene #progress-clear-alert a").click(function(e) {
			e.preventDefault();
			furthestLevel = storedLevel;
			localStorage.setItem(PROGRESS_KEY, storedLevel);
			$("#main-menu-scene #progress-clear-alert").html("OK, your progress has been restored. :)").delay(5000).fadeOut();
		});
		level = 0;
		furthestLevel = 0;
	});
	
	$("#level-select-scene .left").click(function() {
		$(".scene").fadeOut();
		$("#main-menu-scene").fadeIn();
	});
	
	$("#main-menu-scene .level-editor").click(function(){
		$(".scene").fadeOut();
		$("#level-editor-scene .panel.playing").hide();
		$("#level-editor-scene").fadeIn();
		inEditor = true;
	});
	
	createLevelEditorActions();
	
	$(".home").click(function() {
		$(".next").off("click");
		$("#popup-layer").fadeOut();
		$(".popup").fadeOut();
		$(".popup-bg").fadeOut();
		$(".scene").fadeOut();
		$("#main-menu-scene").fadeIn();
		state = STATE_MAIN_MENU;
		// clear board data
		clearBoard();
		inEditor = false;
	});

	$(".retry").click(function() {
		$(".next").off("click");
		loadLevel(level);
		$("#popup-layer").fadeOut();
		$(".popup").fadeOut();
		$(".popup-bg").fadeOut();
	});
	
});

var board, bottomBoard;
var codeDivs;
var step, stepLimit;

function clearBoard() {
	// initialize board
	board = [];
	bottomBoard = [];
	for (var i = 0; i < BOARD_SIZE; ++i) {
		board[i] = [];
		bottomBoard[i] = [];
		for (var j = 0; j < BOARD_SIZE; ++j) {
			board[i][j] = '.';
			bottomBoard[i][j] = '.';
		}
	}
	
	$(".inBoard").fadeOut(function(){$(this).remove()});
}

function initialize() {
	clearBoard();
	
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
			$("#level-select-scene .levels").append(levelBtn);
		}
	}
}

function createLevelEditorActions() {
	var backupBoard;
	var $board = $("#level-editor-scene .board");

	$board.mousedown(function(d) {
		$board.on('mousemove', function(e) {
			if (state != STATE_MAIN_MENU) return;
			var x = e.pageX;
			var y = e.pageY;
			if (typeof x === "undefined") x = d.pageX;
			if (typeof y === "undefined") y = d.pageY;
			
			var boardLeft = Math.floor((x - $board.offset().left) / SQUARE_SIZE);
			var boardTop = Math.floor((y - $board.offset().top) / SQUARE_SIZE);
			
			var currentCode = String($(".palette.active").data('code'));
			if (currentCode == "undefined") currentCode = '.';
			
			if (board[boardTop][boardLeft] != currentCode) {
				board[boardTop][boardLeft] = currentCode;
				$("#level-editor-scene .inBoard.r" + boardTop + "c" + boardLeft).remove();
				$(codeDivs[currentCode]).clone()
							.removeClass("palette").removeClass("active").addClass("inBoard").addClass("r" + boardTop + "c" + boardLeft)
							.offset({top: SQUARE_SIZE * boardTop, left: SQUARE_SIZE * boardLeft}).appendTo("#level-editor-scene .board");
			}
		}).mousemove();
	});
	
	$(window).mouseup(function() {
		$("#level-editor-scene .board").off('mousemove');
	});
	
	$(".palette").click(function() {
		$(".palette").removeClass("active");
		$(this).addClass("active");
	});
	
	$("#level-editor-scene .panel .save").click(function() {
		var code = '';
		for (var i = 0; i < board.length; ++i) {
			for (var j = 0; j < board.length; ++j){
				code += board[i][j];
			}
		}
		var step = $("#level-editor-scene .panel .step-limit").val();
		if (step.length < 2) step = '0' + step;
		code += step;
	
		$(".editor.save .level-code").val(code);
		$(".editor.save").fadeIn();
	});
	
	$("#level-editor-scene .panel .load").click(function() {
		$(".editor.load").fadeIn();
	});
	
	$("#level-editor-scene .load.popup .load-level").click(function() {
		var data = $("#level-editor-scene .load.popup .level-code").val();
		loadLevelFromString(data, "#level-editor-scene .board");
		$("#level-editor-scene .steps .step-limit").val(step);
		$(".arrow").removeClass("lastDir");
		state = STATE_MAIN_MENU;
	});
	
	$("#level-editor-scene .save-load-ok").click(function(){
		$(".popup").fadeOut();
		$(".popup-bg").fadeOut();
	});
	
	function returnToEdit() {
		board = $.extend(true, [], backupBoard);
		updateBoardFromData("#level-editor-scene .board");
		$("#level-editor-scene .panel.playing").hide();
		$("#level-editor-scene .panel.editing").show();
		$(".popup").fadeOut();
		$(".popup-bg").fadeOut();
		$("#popup-layer").fadeOut();
		state = STATE_MAIN_MENU;
	}
	
	$(".popup .ok").click(returnToEdit);
	
	$("#level-editor-scene .panel .back").click(returnToEdit);

	$("#level-editor-scene .panel .play").click(function() {
		backupBoard = $.extend(true, [], board);
		stepLimit = $("#level-editor-scene .panel.editing .step-limit").val();
		step = stepLimit;
		$("#level-editor-scene .panel.playing").show();
		$("#level-editor-scene .panel.editing").hide();
		$("#level-editor-scene .panel.playing .steps .content").html(step + "/" + stepLimit);
		$(".arrow").removeClass("lastDir");
		$("#level-editor-scene .panel.playing .steps .content").removeClass("warning");
		state = STATE_READY;
	});

}

function updateBoardFromData(blockAppendTo)
{
	// setup board
	$(".inBoard").remove();
	for (var i = 0; i < board.length; ++i) {
		for (var j = 0; j < board.length; ++j){
			if (typeof codeDivs[board[i][j]] !== 'undefined'){
				$(codeDivs[board[i][j]]).clone()
					.removeClass("palette").addClass("inBoard").addClass("r" + i + "c" + j)
					.offset({top: SQUARE_SIZE * i, left: SQUARE_SIZE * j}).appendTo(blockAppendTo);
			}
			bottomBoard[i][j] = '.';
		}
	}
}

function loadLevelFromString(string, blockAppendTo) {
	string = string.replace(/\s/g, "");
	for (var i = 0; i < BOARD_SIZE * BOARD_SIZE; ++i) {
		board[Math.floor(i / BOARD_SIZE)][i % BOARD_SIZE] = string.charAt(i);
	}
	stepLimit = parseInt(string.slice(-2));
	step = stepLimit;
	
	updateBoardFromData(blockAppendTo);
}

function loadLevel(number) {
	state = STATE_LOADING;
	$.ajax({
		url : "levels/" + getLevelString(number) + ".txt",
		dataType: "text",
		success : function (data) {
			// read and parse level file
			loadLevelFromString(data, "#game-scene .board");
			
			// setup info
			$("#game-scene .level .content").html(getLevelString(number));
			$("#game-scene .steps .content").html(step + "/" + stepLimit);
			$(".arrow").removeClass("lastDir");
			$("#game-scene .steps .content").removeClass("warning");
			
			level = number;
			if (level > furthestLevel){
				furtherLevel = level;
			}
			
			// ready
			state = STATE_READY;
		}
	});
}

function markMoved(dir) {
	$(".arrow").removeClass("lastDir");
	$(".arrow." + dir).addClass("lastDir");
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
	$("#game-scene .steps .content").html(step + "/" + stepLimit);
	$("#level-editor-scene .panel.playing .steps .content").html(step + "/" + stepLimit);
	if (step < 2) {
		$("#game-scene .steps .content").addClass("warning");
		$("#level-editor-scene .panel.playing .steps .content").addClass("warning");
	}
	animateBlocks(steps, function(){
		state = STATE_READY;
		checkComplete();
		checkFail();
	});
}

function moveBlock(startR, startC, endR, endC) {
	if ($.inArray(board[endR][endC], BOTTOM_LAYER_CODE) >= 0){
		bottomBoard[endR][endC] = board[endR][endC];
	}

	if (startR != endR || startC != endC) {
		board[endR][endC] = board[startR][startC];
		board[startR][startC] = bottomBoard[startR][startC];
	}
	
	return {start: [startR, startC], end: [endR, endC]};
}

function moveBlocks(dirR, dirC) {
	var changeSet = [];
	
	// moving left
	if (dirC < 0) {
		for (var i = 0; i < BOARD_SIZE; ++i) {
			for (var j = 0; j < BOARD_SIZE; ++j) {
				if ($.inArray(board[i][j], MOVABLE_CODE) >= 0) {
					if (bottomBoard[i][j] == 'T') {
						var elem = moveBlock(i, j, i, j);
						if (elem) {
							changeSet.push(elem);
						}
					} else {
						for (var k = j - 1; ; --k) 
						{
							if (k == -1 || $.inArray(board[i][k], SOLID_CODE) >= 0 || $.inArray(board[i][k], ['W', 'S', 'D']) >= 0) {
								var elem = moveBlock(i, j, i, k + 1);
								if (elem) {
									changeSet.push(elem);
								}
								break;
							} 
							else if (board[i][k] == 'T') 
							{
								var elem = moveBlock(i, j, i, k);
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
	}
	
	// moving right
	if (dirC > 0) {
		for (var i = 0; i < BOARD_SIZE; ++i) {
			for (var j = BOARD_SIZE - 1; j > 0 ; --j) {
				if ($.inArray(board[i][j], MOVABLE_CODE) >= 0) {
					if (bottomBoard[i][j] == 'T') {
						var elem = moveBlock(i, j, i, j);
						if (elem) {
							changeSet.push(elem);
						}
					} else {
						for (var k = j + 1; ; ++k) 
						{
							if (k == BOARD_SIZE || $.inArray(board[i][k], SOLID_CODE) >= 0 || $.inArray(board[i][k], ['W', 'S', 'A']) >= 0) {
								var elem = moveBlock(i, j, i, k - 1);
								if (elem) {
									changeSet.push(elem);
								}
								break;
							} 
							else if (board[i][k] == 'T') 
							{
								var elem = moveBlock(i, j, i, k);
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
	}
	
	// moving up
	if (dirR < 0) {
		for (var i = 0; i < BOARD_SIZE; ++i) {
			for (var j = 0; j < BOARD_SIZE; ++j) {
				if ($.inArray(board[j][i], MOVABLE_CODE) >= 0) {
					if (bottomBoard[j][i] == 'T') {
						var elem = moveBlock(j, i, j, i);
						if (elem) {
							changeSet.push(elem);
						}
					} else {
						for (var k = j - 1; ; --k) 
						{
							if (k == -1 || $.inArray(board[k][i], SOLID_CODE) >= 0 || $.inArray(board[k][i], ['A', 'S', 'D']) >= 0) {
								var elem = moveBlock(j, i, k + 1, i);
								if (elem) {
									changeSet.push(elem);
								}
								break;
							} 
							else if (board[k][i] == 'T') 
							{
								var elem = moveBlock(j, i, k, i);
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
	}
	
	// moving down
	if (dirR > 0) {
		for (var i = 0; i < BOARD_SIZE; ++i) {
			for (var j = BOARD_SIZE - 1; j > 0 ; --j) {
				if ($.inArray(board[j][i], MOVABLE_CODE) >= 0) {
					if (bottomBoard[j][i] == 'T') {
						var elem = moveBlock(j, i, j, i);
						if (elem) {
							changeSet.push(elem);
						}
					} else {
						for (var k = j + 1; ; ++k) 
						{
							if (k == BOARD_SIZE || $.inArray(board[k][i], SOLID_CODE) >= 0 || $.inArray(board[k][i], ['W', 'A', 'D']) >= 0) {
								var elem = moveBlock(j, i, k - 1, i);
								if (elem) {
									changeSet.push(elem);
								}
								break;
							} 
							else if (board[k][i] == 'T') 
							{
								var elem = moveBlock(j, i, k, i);
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
	}
	
	// gate "moves" to fix animation
	for (var i = 0; i < BOARD_SIZE; ++i) {
		for (var j = 0; j < BOARD_SIZE; ++j) {
			if ($.inArray(board[i][j], GATE_CODE) >= 0) {
				var elem = moveBlock(i, j, i, j);
				if (elem) {
					changeSet.push(elem);
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
				// normal blocks
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
					startR = parseInt(startR, 10);
					startC = parseInt(startC, 10);
					visited[startR][startC] = true;
					eliminated.push([startR, startC]);
					if (board[startR][startC] == '9'){
						if ($.inArray(board[startR - 1][startC], BLOCK_CODE) >= 0 && !visited[startR - 1][startC]){
							dfs(startR - 1, startC);
						}
						if ($.inArray(board[startR + 1][startC], BLOCK_CODE) >= 0 && !visited[startR + 1][startC]){
							dfs(startR + 1, startC);
						}
						if ($.inArray(board[startR][startC - 1], BLOCK_CODE) >= 0 && !visited[startR][startC - 1]){
							dfs(startR, startC - 1);
						}
						if ($.inArray(board[startR][startC + 1], BLOCK_CODE) >= 0 && !visited[startR][startC + 1]){
							dfs(startR, startC + 1);
						}
					}
					if (startR > 0 && !visited[startR - 1][startC] && (board[startR - 1][startC] == board[startR][startC] || board[startR - 1][startC] == '9')) {
						dfs(startR - 1, startC);
					}
					if (startR < BOARD_SIZE - 1 && !visited[startR + 1][startC] && (board[startR + 1][startC] == board[startR][startC] || board[startR + 1][startC] == '9')) {
						dfs(startR + 1, startC);
					}
					if (startC > 0 && !visited[startR][startC - 1] && (board[startR][startC - 1] == board[startR][startC] || board[startR][startC - 1] == '9')) {
						dfs(startR, startC - 1);
					}
					if (startC < BOARD_SIZE - 1 && !visited[startR][startC + 1] && (board[startR][startC + 1] == board[startR][startC] || board[startR][startC + 1] == '9')) {
						dfs(startR, startC + 1);
					}
				})(i, j);
				
				if (eliminated.length > 1) {
					for (var i in eliminated) {
						board[eliminated[i][0]][eliminated[i][1]] = bottomBoard[eliminated[i][0]][eliminated[i][1]];
						eliminateSet.push(eliminated[i]);
					}
				}
				
				// gates
				if (bottomBoard[i][j] == 'H') {
					for (var k = 0; k < BOARD_SIZE; ++k){
						for (var l = 0; l < BOARD_SIZE; ++l) {
							if (board[k][l] == 'U') {
								board[k][l] = '.';
								eliminateSet.push([k, l]);
							}
						}
					}
				}
				
				if (bottomBoard[i][j] == 'J') {
					for (var k = 0; k < BOARD_SIZE; ++k){
						for (var l = 0; l < BOARD_SIZE; ++l) {
							if (board[k][l] == 'I') {
								board[k][l] = '.';
								eliminateSet.push([k, l]);
							}
						}
					}
				}
				
				if (bottomBoard[i][j] == 'K') {
					for (var k = 0; k < BOARD_SIZE; ++k){
						for (var l = 0; l < BOARD_SIZE; ++l) {
							if (board[k][l] == 'O') {
								board[k][l] = '.';
								eliminateSet.push([k, l]);
							}
						}
					}
				}
				
				if (bottomBoard[i][j] == 'L') {
					for (var k = 0; k < BOARD_SIZE; ++k){
						for (var l = 0; l < BOARD_SIZE; ++l) {
							if (board[k][l] == 'P') {
								board[k][l] = '.';
								eliminateSet.push([k, l]);
							}
						}
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
			
			$(".r" + start[0] + "c" + start[1]).not(BOTTOM_LAYER_CLASSES)
				.animate({top: SQUARE_SIZE * end[0], left: SQUARE_SIZE * end[1]}, distance * MOVING_SPEED, "linear")
				.removeClass("r" + start[0] + "c" + start[1]).addClass("r" + end[0] + "c" + end[1]).delay(maxDistance * MOVING_SPEED - distance * MOVING_SPEED);
		}
		animationTime += maxDistance * MOVING_SPEED;
		
		// eliminate
		for (var j in steps[i+1]) {
			$(".r" + steps[i+1][j][0] + "c" + steps[i+1][j][1]).not(BOTTOM_LAYER_CLASSES)
				.fadeOut(ELIMINATE_SPEED, function(){$(this).remove();});
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
		if (inEditor){
			$(".popup .buttons.main").hide();
			$(".popup .buttons.editor").show();
		} else {
			$(".popup .buttons.editor").hide();
			$(".popup .buttons.main").show();
		}
		if (!inEditor) {
			if (level >= furthestLevel){
				furthestLevel++;
			}
			localStorage.setItem(PROGRESS_KEY, furthestLevel);
			$(".next").one("click", function() {
				level++;
				loadLevel(level);
				$("#popup-layer").fadeOut();
				$(".level-cleared").fadeOut();
			});
			$(document).keyup(function(e){
				if (e.which == 13){
					$(".next").click();
				}
			});
		}
	}
}

function checkFail() {
	if (state == STATE_CLEARED) return;

	var failed = false;
	if (step <= 0) {
		failed = "Too many steps!";
	}
	/*var counts = [];
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
	}*/
	
	if (failed) {
		$(".level-failed .content").html(failed);
		$("#popup-layer").css('background-color', '#000').fadeIn();
		if (inEditor){
			$(".popup .buttons.main").hide();
			$(".popup .buttons.editor").show();
		} else {
			$(".popup .buttons.editor").hide();
			$(".popup .buttons.main").show();
		}
		$(".level-failed").fadeIn();
		state = STATE_FAILED;
	}
}