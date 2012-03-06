
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Initialization

var users = [];

// Socket.IO

var io = require('socket.io');
var io = io.listen(app);
io.set('log level', 1);

io.sockets.on('connection', function(socket)
{
  // Connect
  socket.on('initializeConnection', function(user)
  {
    turn = (Math.random()*2) > 1;
    var user = {
      id: socket.id,
      xOrO: 'X',
      turn: turn
    };

    // Add user
    users.push(user);
    if (users.length == 2) {
      // Reserve assignments
      user.xOrO = (users[0].xOrO == 'X') ? 'O' : 'X';
      user.turn = (users[0].turn) ? false : true;
    } else if (users.length > 2) {
      // Observer assignment
      user.xOrO = 'N';
    }
    socket.emit('assignUser', user);

    switch (users.length) {
      case 1:
        // Do nothing
        break;
      case 2:
        // Start game
        io.sockets.emit('startGame');
        break;
      default:
        // Display game
        socket.emit('displayGame');
        break;
    }

    console.log("User connected: " + user.id + ", Users total: " + users.length);
  });

  // Disconnect
  socket.on('disconnect', function()
  {
    for(i=0; i<users.length; i++) {
      if (users[i].id == socket.id) {
        user = users.splice(i, 1);
        console.log("User disconnected: " + socket.id + ", Users total: " + users.length);
      }
    }

    switch(users.length) {
      case 0:
        // Do nothing...
        console.log("All users disconnected.  Waiting for new users.");
        break;
      case 1:
        // TODO: Wait for opponent
        console.log("Opponent disconnnected.  Awaiting new opponent.");
        // io.sockets.emit('waitForOpponent');
        io.sockets.emit('waitForOpponent');
        break;
      default:
        break;
    }
  });

  socket.on('drawXsAndOs', function(xBoard, oBoard) {
    // If we receive this call we know it came from the person who's turn it was
    // so lets flip all users turn and send back the assignments
    for(i=0; i<users.length; i++) {
      users[i].turn = (users[i].turn) ? false : true;
      io.sockets.socket(users[i].id).emit('assignUser', users[i]);
    }

    io.sockets.emit('drawXsAndOs', xBoard, oBoard);
  })
});

// Routes

app.get('/', routes.index);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
