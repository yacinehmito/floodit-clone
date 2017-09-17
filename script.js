function colorGenerator(frequencies) {
  var sum = 0;

  Object.keys(frequencies).forEach(function(color) {
    sum += frequencies[color];
  });

  function randomColor() {
    if (sum === 0) {
      return null;
    }
    var cumFreq = 0;
    var selectedColor = null;
    var r = Math.random();
    Object.keys(frequencies).some(function(color) {
      cumFreq += frequencies[color];
      if (cumFreq / sum > r) {
        selectedColor = color;
        return true;
      }
    });
    if (selectedColor !== null) {
      sum--;
      frequencies[selectedColor]--;
    }
    return selectedColor;
  }

  return randomColor;
}

function buildBoard(length, width) {
  var n = length;
  var m = width;
  var s = n * m;
  var part = Math.floor(s / 6);
  var extras = s % 6;
  var frequencies = {
    red: part,
    green: part,
    cyan: part,
    purple: part,
    yellow: part,
    navajowhite: part
  };
  Object.keys(frequencies).forEach(function(color) {
    if (extras > 0) {
      frequencies[color]++;
      extras--;
    }
  });
  var randomColor = colorGenerator(frequencies);
  var board = new Array(n).fill(null).map(function(_, rowIndex) {
    return new Array(m).fill(null).map(function(_, colIndex) {
      var color = randomColor();
      if (color === null) {
        throw Error("Cannot pick random color");
      }
      return {
        row: rowIndex,
        col: colIndex,
        color
      };
    });
  });
  return board;
}

function Game() {
  this.length = 14;
  this.width = 14;
  this.size = this.length * this.width;
  this.board = buildBoard(this.length, this.width);
  this.maxPlays = 25;
  this.plays = 0;
  this.controlled = new Set();

  var firstCell = this.board[0][0];
  this.color = firstCell.color;
  this.controlled.add(firstCell);
  var controlled = this.controlled;
  this.getNeighboursOf(firstCell).forEach(function(neighbour) {
    if (neighbour.color === firstCell.color) {
      controlled.add(neighbour);
    }
  });
}

Game.prototype.mapBoard = function(callback) {
  return this.board.map(function(row, rowIndex) {
    return row.map(function(cell, colIndex) {
      return callback(cell, rowIndex, colIndex, this.board);
    });
  });
};

Game.prototype.getNeighboursOf = function(cell) {
  var neighbours = [];
  function addToNeighbours() {
    for (var i = 0; i < arguments.length; i++) {
      var cell = arguments[i];
      if (cell !== undefined) {
        neighbours.push(cell);
      }
    }
  }

  var row;

  row = this.board[cell.row - 1];
  if (row) {
    addToNeighbours(row[cell.col]);
  }

  row = this.board[cell.row];
  addToNeighbours(row[cell.col - 1], row[cell.col + 1]);

  row = this.board[cell.row + 1];
  if (row) {
    addToNeighbours(row[cell.col]);
  }

  return neighbours;
};

Game.prototype.play = function(color) {
  var that = this;
  if (color === this.color) {
    return "noaction";
  }
  this.color = color;
  this.controlled.forEach(function(cell) {
    that.getNeighboursOf(cell).forEach(function(neighbour) {
      if (neighbour.color === color) {
        that.controlled.add(neighbour);
      }
    });
  });
  this.controlled.forEach(function(cell) {
    cell.color = color;
  });
  this.plays++;
  if (this.plays >= this.maxPlays) {
    return "loss";
  }
  if (this.controlled.size === this.size) {
    return "win";
  }
  return "keepgoing";
};

var listener;

function generateHtmlBoard(game, boardDiv) {
  var playsDiv = document.getElementById("plays");

  var desiredBoardWidth = 300;
  var cellSize = Math.floor(desiredBoardWidth / game.length);
  var boardWidth = cellSize * game.length;

  boardDiv.style.width = boardWidth + "px";

  var cellDivs = game.mapBoard(function(cell) {
    var cellDiv = document.createElement("div");
    cellDiv.classList.add("cell");
    cellDiv.dataset.row = cell.row;
    cellDiv.dataset.col = cell.col;
    cellDiv.style.backgroundColor = cell.color;
    cellDiv.style.width = cellSize + "px";
    cellDiv.style.height = cellSize + "px";
    boardDiv.appendChild(cellDiv);
    return cellDiv
  });

  var resultDiv = document.createElement("div");
  resultDiv.classList.add("result");
  boardDiv.append(resultDiv)

  playsDiv.innerHTML = game.plays + " / " + game.maxPlays

  function onClick(event) {
    var cellDiv = event.target;
    if (!cellDiv.classList.contains("cell")) {
      return undefined;
    }

    var playResult = game.play(game.board[cellDiv.dataset.row][cellDiv.dataset.col].color);
    if (playResult === "win") {
      resultDiv.classList.add("win");
      resultDiv.innerHTML = "<div>You win!</div>";
    }
    if (playResult === "loss") {
      resultDiv.classList.add("loss");
      resultDiv.innerHTML = "<div>You lose...</div>";
    }
    cellDivs.forEach(function(row) {
      row.forEach(function(cellDiv) {
        cellDiv.style.backgroundColor =
          game.board[cellDiv.dataset.row][cellDiv.dataset.col].color;
      })
    });

    playsDiv.innerText = game.plays + " / " + game.maxPlays

  }

  listener = onClick
  boardDiv.addEventListener("click", listener);
}

var game;
window.onload = function() {
  game = new Game()
  var boardDiv = document.getElementById("board")
  generateHtmlBoard(game, boardDiv)
  var startButton = document.getElementById("startButton");
  startButton.addEventListener("click", function() {
    boardDiv.removeEventListener("click", listener)
    boardDiv.innerHTML = ""
    game = new Game()
    generateHtmlBoard(game, boardDiv)
  })
}