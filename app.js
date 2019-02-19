/**
 * Module dependencies.
 */
var express        = require('express');
var app            = express();
var server         = require('http').createServer(app);
var io             = require('socket.io').listen(server);
var routes         = require('./routes');
var path           = require('path');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var errorHandler   = require('errorhandler');

// Configuration
app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, "public")));

if(process.env.NODE_ENV === "production") {
  app.use(express.errorHandler());
}

if(process.env.NODE_ENV === "development") {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

// Initialization
var users = [];

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
      // io.sockets.socket(users[i].id).emit('assignUser', users[i]);
      io.sockets.connected[users[i].id].emit('assignUser', users[i]);
    }

    io.sockets.emit('drawXsAndOs', xBoard, oBoard);
  })
});

// Routes

app.get('/', routes.index);

listener = server.listen(3000, function(){
    console.log("Listening on port %d in %s environment.", listener.address().port, app.settings.env);
});
