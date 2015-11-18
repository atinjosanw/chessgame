var socket, serverGame;
var username, playerColor;
var game, board;
var userOnline = [];
var myGames = [];
socket = io();


socket.on('login', function(msg) {
  usersOnline = msg.users;
  updateUserList();

  myGames = msg.games;
  updateGamesList();
});

socket.on('joinlobby', function (msg) {
  addUser(msg);
});

socket.on('leavelobby', function(msg) {
  removeUser(msg);
});


socket.on('gameadd', function (msg) {
  alert("You are in game " + msg.gameId);
});

socket.on('gameremove', function(msg){

});

socket.on('joingame', function (msg) {
  console.log('joined as game id: ' + msg.game.id);
  playerColor = msg.color;
  initGame(msg.game);

  $('#page-lobby').hide();
  $('#page-game').show();
});


socket.on('move', function (msg) {
  if (serverGame && msg.gameId === serverGame.id) {
    console.log(msg);
    game.move(msg.move);
    board.position(game.fen());
  }
});

socket.on('logout', function (msg) {
  removeUser(msg.username);
});

var handleMove = function(source, target) {
  var move = game.move({from: source, to: target});
  socket.emit('move', move);
};

/**
 * MENUS
 */
 $('#login').on('click', function () {
  username = $('#username').val();

  if (username.length > 0) {
    $('#userLabel').text(username);
    socket.emit('login', username);

    $('#page-login').hide();
    $('#page-lobby').show();
  }
 });

 $('#game-back').on('click', function() {
  socket.emit('login', username);

  $('#page-game').hide();
  $('#page-lobby').show();
 });

 $('#game-quit').on('click', function() {
  socket.emit('resign', {userId: username, gameId: serverGame.id});

  $('#page-game').hide();
  $('#page-lobby').show();
 });

 var addUser = function (userId) {
  userOnline.push(userId);
  updateUserList();
 };

var removeUser = function(userId) {
  for (var i = 0; i < userOnline.length; i++) {
    if (userOnline[i] === userId) {
      userOnline.splice(i, 1);
      break;
    }
  }
  updateUserList();
};

var updateGamesList = function() {
  $('#gamesList').html('');
  myGames.forEach(function (game) {
    $('#gamesList').append($('<button>')
                   .text('#' + game)
                   .on('click', function() {
                    socket.emit('resumegame', game);
                   }));
  });
};

var updateUserList = function () {
  $('#userList').html('');
  userOnline.forEach(function (user) {
    $('#userList').append($('<button>')
                  .text(user)
                  .on('click', function () {
                    socket.emit('invite', user);
                  }));
  });
};


/**
 * CHESS GAME
 */
var initGame = function (serverGameState) {
  serverGame = serverGameState;

  var cfg = {
    draggable: true,
    showNotation: false,
    orientation: playerColor,
    position: serverGame.board ? serverGame.board : 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  };

  game = serverGame.board ? new Chess(serverGame.board) : new Chess();
  board = new ChessBoard('game-board', cfg);
};

var onDragStart = function (source, piece, position, orientation) {
  if (game.game_over() === true ||
    (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
    (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
    (game.turn() !== playerColor[0])) {
    return false;
  }
};

var onDrop = function(source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  // Illgal move
  if (move === null) {
    return 'snapback';
  }
  else {
    socket.emit('move', {move: move, gameId: serverGame.id, board: game.fen()});
  }
};

var onSnapEnd = function() {
  board.position(game.fen());
};







