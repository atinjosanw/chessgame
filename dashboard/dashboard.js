var socket = io();
var games = {};
var boards = {};


socket.emit('dashboardlogin');
socket.on('dashboardlogin', function(msg) {
  console.log(msg.games);
  createGamesList(msg.games);
});

socket.on('gameadd', function (msg) {
  initGame(msg.gameId, msg.gameState);
});

socket.on('move', function (msg) {
  games[msg.gameId].move(msg.move);
  boards[msg.gameId].position(games[msg.gameId].fen());
});

var createGamesList = function (serverGames) {
  Object.keys(serverGames).forEach(function(gameId) {
    initGame(gameId, serverGames[gameId]);
  });
};

var initGame = function (gameId, serverGame) {
  var cfg = {
    draggable: false,
    showNotation: false,
    orientation: 'white',
    pieceTheme: '../img/chesspieces/wikipedia/{piece}.png',
    position: serverGame.board ? serverGame.board : 'start',
  };

  $('#games').append($('<div id="game-board'+gameId+'" class="gameboard"></div>'));

  var game = serverGame.board ? new Chess(serverGame.board) : new Chess();
  games[gameId] = game;

  var board = new ChessBoard('game-board'+gameId, cfg);
  boards[gameId] = board;
};
