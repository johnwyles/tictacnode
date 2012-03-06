// John Wyles
// john@johnwyles.com

// TODO: Cleanup drawXsAndOs and drawPosition

// Socket.IO
var socket;

// Canvas
var gameBoard;
var boardContext;

// User
var user;

// X and O bitmasks; game board resembles:
// 000000001 | 000000010 | 000000100
// ---------------------------------
// 000001000 | 000010000 | 000100000
// ---------------------------------
// 001000000 | 010000000 | 100000000
var xBoard;
var oBoard;

function initGame()
{  
  gameBoard = $('canvas#gameBoard').get(0);
  boardContext = gameBoard.getContext('2d');

  var pathArray = window.location.pathname.split( '/' );
  var hostName = pathArray[2];
  socket = io.connect('http://localhost:3000');

  socket.on('connect', function() {
    // alert('Initializing connection');
    socket.emit('initializeConnection');
  });

  socket.on('waitForOpponent', function() {
    // alert('Waiting for an opponent.');
    clearGameBoard();
    updateStatus('Awaiting an opponent&hellip;');
  });

  socket.on('assignUser', function (assignedUser) {
    // alert('Assigning user.');
    user = assignedUser;
    $('h2#userXOrO').html('You are the ' + user.xOrO + ' opponent.');
    if (user.turn) {
      updateStatus('Your turn to play.');
    } else {
      updateStatus('Awaiting other user to play.');
    }
  });

  socket.on('startGame', function() {
    // alert('Starting game.');
    clearGameBoard();
    drawGameBoard();
    gameBoard.addEventListener('click', processClick, false);
    updateStatus('The game has started.');
  });

  socket.on('drawXsAndOs', function(xBoard, oBoard) {
    // alert('Drawing Xs and Os');
    drawXsAndOs(xBoard, oBoard);
  });

  socket.on('displayGame', function() {
    // alert('Displaying game.');
    drawGameBoard();
  });
}

function updateStatus(status) {
  $('div#gameStatus').html(status);
}

function clearGameBoard() {
  boardContext.clearRect(0, 0, gameBoard.width, gameBoard.height);
  boardContext.beginPath();
  xBoard = oBoard = 0;
}

// Draw Game Board
function drawGameBoard() {
  boardContext.beginPath();
  boardContext.lineWidth = 5;
  boardContext.strokeStyle = "#999";

  // Left Vertical Line
  boardContext.moveTo(gameBoard.width / 3, 0);
  boardContext.lineTo(gameBoard.width / 3, gameBoard.height);

  // Right Vertical Line
  boardContext.moveTo(2 * (gameBoard.width / 3), 0);
  boardContext.lineTo(2 * (gameBoard.width / 3), gameBoard.height);

  // Top Horizontal Line
  boardContext.moveTo(0, (gameBoard.height / 3));
  boardContext.lineTo(gameBoard.width, (gameBoard.height / 3));

  // Bottom Horizontal Line
  boardContext.moveTo(0, 2 * (gameBoard.height / 3));
  boardContext.lineTo(gameBoard.width, 2 * (gameBoard.height / 3));

  boardContext.stroke();
  boardContext.closePath();
}

function drawXOrO(x, y, xOrO) {
  boardContext.beginPath();
  boardContext.lineWidth = 4;

  var offsetX = (gameBoard.width / 3) * 0.1;
  var offsetY = (gameBoard.height / 3) * 0.1;

  var beginX = x * (gameBoard.width / 3) + offsetX;
  var beginY = y * (gameBoard.height / 3) + offsetY;

  var endX = (x + 1) * (gameBoard.width / 3) - offsetX * 2;
  var endY = (y + 1) * (gameBoard.height / 3) - offsetY * 2;

  if (xOrO == 'X') {
    boardContext.strokeStyle = '#0000cc';
    
    boardContext.moveTo(beginX, beginY);
    boardContext.lineTo(endX, endY);

    boardContext.moveTo(beginX, endY);
    boardContext.lineTo(endX, beginY);
  } else {
    boardContext.strokeStyle = '#cc0000';
    boardContext.arc(beginX + ((endX - beginX) / 2), beginY + ((endY - beginY) / 2), (endX - beginX) / 2, 0, Math.PI * 2, true);
  }

  boardContext.stroke();
  boardContext.closePath();
}

function drawXsAndOs(xBoardInput, oBoardInput) {
  xBoard = xBoardInput;
  oBoard = oBoardInput;

  drawPosition(xBoard, 'X');
  drawPosition(oBoard, 'O');

  // TODO: Clean this up
  var xGameStatus = checkWinner(xBoard);
  var oGameStatus = checkWinner(oBoard);
  if (xGameStatus == 1) {
    updateStatus('X is the winner!  Game over.  Refresh to play again...');
    gameBoard.removeEventListener('click', processClick, false);
  } else if (oGameStatus == 1) {
    updateStatus('O is the winner!  Game over.  Refresh to play again...');
    gameBoard.removeEventListener('click', processClick, false);
  } else if ((xGameStatus == 2) || (oGameStatus == 2)) {
    updateStatus('No winner.  Game over.  Refresh to play again');
    gameBoard.removeEventListener('click', processClick, false);
  }
}

function drawPosition(xOrOBoard, xOrO) {
  var positionX;
  var positionY;
  var drawBit;
  var bit = 1;

  for (i=1; i<=9; i++) {
    drawBit = 1;
    positionX = 0;
    positionY = 0;
    if (xOrOBoard & bit) {
      while ((bit & drawBit) == 0) {
        drawBit = drawBit << 1;
        positionX++;
        if (positionX > 2) {
          positionX = 0;
          positionY++;
        }
      }

      drawXOrO(positionX, positionY, xOrO);
    }
    
    bit = bit << 1;
  }
}

function processClick(eventHandle) {
  var bit = 1;
  var otherUserXOrO;
  var bitLocation;
  var x;
  var y;

  if (!user.turn) {
    updateStatus('It is not your turn, you must wait on the other person.');
    return;
  }

  if (eventHandle.pageX && eventHandle.pageY) {
    x = eventHandle.pageX;
    y = eventHandle.pageY;
  } else {
    x = eventHandle.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    y = eventHandle.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }

  x = Math.floor((x - gameBoard.offsetLeft) / (gameBoard.width / 3));
  y = Math.floor((y - gameBoard.offsetTop) / (gameBoard.height / 3));

  bitLocation = 1 << x + (y * 3);

  if (((xBoard & bitLocation) == 0) && ((oBoard & bitLocation) == 0)) {
    oBoard = (user.xOrO == 'O') ? (oBoard | bitLocation) : oBoard;
    xBoard = (user.xOrO == 'X') ? (xBoard | bitLocation) : xBoard;

    otherUserXOrO = (user.xOrO == 'X') ? 'O' : 'X';
    updateStatus('You played ' + user.XOrO + ' at position (' + x + ', ' + y + ').  It is now ' + otherUserXOrO + '\'s turn');

    socket.emit('drawXsAndOs', xBoard, oBoard);
  } else {
    updateStatus('You cannot play in a spot that has already been played.');
  }
}

function checkWinner(gameBoard) {
  var result = 0;

  if (((gameBoard | 0x1C0) == gameBoard) || ((gameBoard | 0x38 ) == gameBoard) || 
    ((gameBoard | 0x7) == gameBoard) || ((gameBoard | 0x124) == gameBoard) || 
    ((gameBoard | 0x92) == gameBoard) || ((gameBoard | 0x49) == gameBoard) || 
    ((gameBoard | 0x111) == gameBoard) || ((gameBoard | 0x54) == gameBoard)) {  
    result = 1;
  }
  
  if ((xBoard | oBoard) == 0x1FF) {
    result = 2;
  }

  return result;
}
