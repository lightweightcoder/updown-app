import './styles.scss';
import axios from 'axios';

// get elements for containing gameplay info
const sessionCol = document.getElementById('session-col');
const messageCol = document.getElementById('message-col');
const drawPileCol = document.getElementById('drawPile-col');
const discardPileCardCol = document.getElementById('discardPileCard-col');
const gameStatsTableContainer = document.getElementById('gameStatsTable-cont');

// helper functions ============================================
// display the user's info and logout btn
const displayUserSessionInfo = (username) => {
  const welcomeMsgEl = document.createElement('span');
  const logoutBtn = document.createElement('button');

  welcomeMsgEl.innerHTML = `welcome back <b>${username}</b>`;
  logoutBtn.innerText = 'logout';

  // event listner for logout btn
  // logoutBtn.addEventListener('click', handleLogoutBtnClick);

  // append elements
  sessionCol.append(welcomeMsgEl, logoutBtn);
};

// display the message of which player's turn
const displayMessage = (gameData) => {
  const messageEl = document.createElement('span');

  if (gameData.username !== gameData.currentPlayerUsername) {
    messageEl.innerHTML = `waiting for ${gameData.currentPlayerUsername} to play cards...`;
  } else {
    messageEl.innerHTML = 'It is your turn.';
  }

  // append elements
  messageCol.append(messageEl);
};

// display the number of cards left in the draw pile
const displayDrawPileSize = (drawPileSize) => {
  const drawPileSizeEl = document.createElement('span');

  drawPileSizeEl.innerHTML = `cards in draw pile: ${drawPileSize}`;

  // append elements
  drawPileCol.append(drawPileSizeEl);
};

// display the number of cards left in the draw pile
const displayDiscardPileCard = (discardPileCard) => {
  const discardPileCardEl = document.createElement('span');

  discardPileCardEl.innerHTML = `discardPileCard: ${discardPileCard.name} of ${discardPileCard.suit}`;

  // append elements
  discardPileCardCol.append(discardPileCardEl);
};

// display the current game statistics
const displayGameStats = (data) => {
  for (let i = 0; i < data.length; i += 1) {
    // create the bootstrap rows and columns
    const row = document.createElement('div');
    row.classList.add('row');
    const usernameCol = document.createElement('div');
    usernameCol.classList.add('col-6', 'table-col');
    const handSizeCol = document.createElement('div');
    handSizeCol.classList.add('col-3', 'table-col');
    const scoreCol = document.createElement('div');
    scoreCol.classList.add('col-3', 'table-col');

    // create elements to contain the game statistics content
    const usernameEl = document.createElement('p');
    const handSizeEl = document.createElement('p');
    const scoreEl = document.createElement('p');

    // add the game statistics content
    usernameEl.innerHTML = data[i].username;
    handSizeEl.innerHTML = data[i].handSize;
    scoreEl.innerHTML = data[i].score;

    // append elements
    usernameCol.append(usernameEl);
    handSizeCol.append(handSizeEl);
    scoreCol.append(scoreEl);
    row.append(usernameCol, handSizeCol, scoreCol);
    gameStatsTableContainer.append(row);
  }
};

// game initialisation =============
// make request for all items for gameplay of the ongoing game
axios.get('/games/one')
  .then((res) => {
    const gameData = res.data;

    // display gameplay elements
    displayUserSessionInfo(gameData.username);
    displayMessage(gameData);
    displayDrawPileSize(gameData.drawPileSize);
    displayDiscardPileCard(gameData.discardPileCard);
    displayGameStats(gameData.tableData);
  })
  .catch((error) => {
    // handle error
    console.log('get game error', error);
  });

console.log('hello');
