function pickOne(freqs) {
  const values = Object.keys(freqs)
  const cumFreqs = {}
  let sum = 0
  for (const value of values) {
    sum += freqs[value]
    cumFreqs[value] = sum
  }
  const r = Math.floor(Math.random() * sum)
  for (const value of values) {
    if (cumFreqs[value] > r) {
      return value
    }
  }
}

function colorGenerator(colorFrequencies) {
  const freqs = Object.assign({}, colorFrequencies)
  function randomColor() {
    const color = pickOne(freqs)
    freqs[color]--
    return color
  }
  return randomColor
}

function generateArray(length, generator) {
  const array = new Array(length)
  for (let i = 0; i < length; i++) {
    array[i] = generator(i)
  }
  return array
}

function matrixForEach(callback) {
  this.forEach((rowArray, row) =>
    rowArray.forEach((cell, col) => callback(cell, row, col))
  )
}

function generateMatrix(length, width, generator) {
  const matrix = generateArray(length, row =>
    generateArray(width, col => generator(row, col))
  )
  matrix.matrixForEach = matrixForEach
  return matrix
}

function buildBoard(length, width, colors) {
  const size = length * width
  const stock = Math.floor(size / colors.length)
  let extras = size % colors.length
  const frequencies = {}
  colors.forEach(color => {
    frequencies[color] = stock
    if (extras > 0) {
      frequencies[color]++
      extras--
    }
  })
  const randomColor = colorGenerator(frequencies)
  const board = generateMatrix(length, width, (row, col) => ({
    row,
    col,
    color: randomColor(),
    owned: false
  }))
  return board
}

class Game {
  constructor(length, width) {
    if (length === undefined || width === undefined) {
      throw Error('Should provide dimensions')
    }
    this.length = length
    this.width = width
    this.size = width * length
    this.colors = ['red', 'green', 'cyan', 'purple', 'yellow', 'navajowhite']
    this.board = buildBoard(length, width, this.colors)
    this.maxPlays = 25
    this.plays = 0

    const firstCell = this.get(0, 0)
    this.color = firstCell.color
    firstCell.owned = true
    this.numberOfOwnedCells = 1
    this.seizeNeighboursOf(firstCell)
  }
  get(i, j) {
    if (i < 0 || i >= this.length) {
      return undefined
    }
    return this.board[i][j]
  }
  getNeighboursOf(cell) {
    const { row, col } = cell
    const deltas = [[0, 1], [0, -1], [1, 0], [-1, 0]]
    return deltas
      .map(([dRow, dCol]) => this.get(row + dRow, col + dCol))
      .filter(neighbour => neighbour !== undefined)
  }
  seizeNeighboursOf(cell) {
    this.getNeighboursOf(cell)
      .filter(neighbour => !neighbour.owned && neighbour.color === cell.color)
      .map(neighbour => {
        neighbour.owned = true
        this.numberOfOwnedCells++
        return neighbour
      })
      .forEach(neighbour => this.seizeNeighboursOf(neighbour))
  }
  forEach(callback) {
    this.board.matrixForEach(callback)
  }
  mapBoard(callback) {
    return generateMatrix(this.length, this.width, (row, col) =>
      callback(this.get(row, col), row, col)
    )
  }
  play(color) {
    if (color === this.color) {
      return 'noaction'
    }
    this.color = color
    this.forEach(cell => {
      if (cell.owned) {
        cell.color = this.color
        this.seizeNeighboursOf(cell)
      }
    })
    this.plays++
    console.log(this.numberOfOwnedCells)
    console.log(this.size)
    return this.numberOfOwnedCells === this.size
      ? 'win'
      : this.plays >= this.maxPlays ? 'loss' : 'keepgoing'
  }
}

function generateHtmlBoard(game, boardDiv) {
  const playsDiv = document.getElementById('plays')

  const desiredBoardWidth = 300
  const cellSize = Math.floor(desiredBoardWidth / game.length)
  const boardWidth = cellSize * game.length

  boardDiv.style.width = boardWidth + 'px'

  const cellDivs = game.mapBoard(function(cell) {
    const cellDiv = document.createElement('div')
    cellDiv.classList.add('cell')
    cellDiv.dataset.row = cell.row
    cellDiv.dataset.col = cell.col
    cellDiv.style.backgroundColor = cell.color
    cellDiv.style.width = cellSize + 'px'
    cellDiv.style.height = cellSize + 'px'
    boardDiv.appendChild(cellDiv)
    return cellDiv
  })

  const resultDiv = document.createElement('div')
  resultDiv.classList.add('result')
  boardDiv.append(resultDiv)

  playsDiv.innerHTML = game.plays + ' / ' + game.maxPlays

  function onClick(event) {
    const cellDiv = event.target
    if (!cellDiv.classList.contains('cell')) {
      return undefined
    }

    const { row, col } = cellDiv.dataset
    const playResult = game.play(game.get(row, col).color)

    if (playResult === 'win') {
      resultDiv.classList.add('win')
      resultDiv.innerHTML = '<div>You win!</div>'
    }
    if (playResult === 'loss') {
      resultDiv.classList.add('loss')
      resultDiv.innerHTML = '<div>You lose...</div>'
    }
    cellDivs.matrixForEach(cellDiv => {
      const { row, col } = cellDiv.dataset
      cellDiv.style.backgroundColor = game.get(row, col).color
    })

    playsDiv.innerText = game.plays + ' / ' + game.maxPlays
  }

  boardClickListener = onClick
  boardDiv.addEventListener('click', boardClickListener)
}

let game
let boardClickListener
window.onload = function() {
  const boardDiv = document.getElementById('board')
  const startButton = document.getElementById('startButton')
  startButton.addEventListener('click', function() {
    boardDiv.removeEventListener('click', boardClickListener)
    while (boardDiv.firstChild) {
      boardDiv.removeChild(boardDiv.firstChild)
    }
    game = new Game(14, 14)
    generateHtmlBoard(game, boardDiv)
  })
  game = new Game(14, 14)
  generateHtmlBoard(game, boardDiv)
}
