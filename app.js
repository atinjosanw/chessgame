var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 3000;
var io = require('socket.io')(http);

var activeGames = {};
var users = {};
var lobbyUsers = {};


app.use(express.static('public'));
app.use(express.static('dashboard'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/dashboard', function (req, res) {
  res.sendFile(__dirname + '/dashboard/dashboard.html');
});

/**
 * EVENTS
 */

io.on('connection', function(socket) {
  console.log('New connection ' + socket);

  socket.on('login', function (userId) {
    console.log(userId + ' joining lobby');
    socket.userId = userId;

    if (!users[userId]) {
      console.log('creating new user');
      users[userId] = {userId: socket.userId, games: {}};
    }
    else {
      console.log('user found!');
      Object.keys(users[userId].games).forEach(function (gameId) {
        console.log('gameId - ' + gameId);
      });
    }

    var currentInfo  = {
      users: Object.keys(lobbyUsers),
      games: Object.keys(users[userId].games)
    };
    socket.emit('login', currentInfo);
    console.log(currentInfo);

    lobbyUsers[userId] = socket;

    socket.broadcast.emit('joinlobby', socket.userId);

  });

  socket.on('invite', function(opponentId) {
    console.log('got an invite from: ' + socket.userId + ' -->' + opponentId);

    socket.broadcast.emit('leavelobby', socket.userId);
    socket.broadcast.emit('leavelobby', opponentId);

    var game = {
      id: Math.floor((Math.random() * 100) + 1),
      board: null,
      users: {white: socket.userId, black: opponentId}
    };

    socket.gameId = game.id;
    activeGames[game.id] = game;

    users[game.users.white].games[game.id] = game.id;
    users[game.users.black].games[game.id] = game.id;

    console.log('starting game: ' + game.id);
    lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
    lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});

    delete lobbyUsers[game.users.white];
    delete lobbyUsers[game.users.black];

    var gameAddInfo = {gameId: game.id, gameState: game};
    socket.broadcast.emit('gameadd', gameAddInfo);
    console.log(gameAddInfo);
  });

  socket.on("resumegame", function (gameId) {
    console.log('ready to resume game: ' + gameId);

    socket.gameId = gameId;
    var game = activeGames[gameId];

    users[game.users.white].games[game.id] = game.id;
    users[game.users.black].games[game.id] = game.id;

    console.log('resuming game: ' + game.id);
    if (lobbyUsers[game.users.white]) {
      lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
      delete lobbyUsers[game.users.white];
    }

    if (lobbyUsers[game.users.black]) {
      lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});
      delete lobbyUsers[game.users.black];
    }
  });

  socket.on('move', function (msg) {
    socket.broadcast.emit('move', msg);
    activeGames[msg.gameId].board = msg.board;
    console.log(msg);
  });

  socket.on('disconnect', function(msg) {
    console.log(msg);

    if (socket && socket.userId && socket.gameId) {
      console.log(socket.userId + ' disconnected');
      console.log(socket.gameId + ' disconnected');
    }

    delete lobbyUsers[socket.userId];

    socket.broadcast.emit('logout', {
      userId: socket.userId,
      gameId: socket.gameId,
    });
  });

  socket.on('dashboardlogin', function() {
    console.log('dashboard joined.');
    socket.emit('dashboardlogin', {games: activeGames});
  });
});

http.listen(port, function () {
  console.log('listening on *: ' + port);
});