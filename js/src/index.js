import './styles.scss';
import axios from 'axios';

// global variables ============================================
// get elements for containing gameplay info
const sessionCol = document.getElementById('session-col');
const messageCol = document.getElementById('message-col');
const drawPileCol = document.getElementById('drawPile-col');
const discardPileCardCol = document.getElementById('discardPileCard-col');
const gameStatsTableContainer = document.getElementById('gameStatsTable-cont');
const playerHandRow = document.getElementById('playerHand-row');
const playCardsBtn = document.getElementById('playCards-btn');

// array to store user's cards to send to the discard pile
const cardsToPlay = [];

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

// make a card display
const makeCard = (cardData) => {
  const suitEl = document.createElement('div');

  suitEl.innerText = cardData.suit;

  const nameEl = document.createElement('div');
  nameEl.innerText = cardData.name;

  const cardEl = document.createElement('div');
  cardEl.classList.add('card', 'col-3', 'align-items-center', 'col-md-2');

  cardEl.appendChild(nameEl);
  cardEl.appendChild(suitEl);

  return cardEl;
};

// select a card to play or unselect it
const selectOrUnselectCardToPlay = (cardEl, cardToPlay) => {
  // when player clicks this card and it has not been selected before,
  // store it in an array of cards that will be played
  // but if card is selected before,
  // remove it from the array of cards.
  let isCardPresent = false; // will eventually be false if card has not been selected before

  if (cardsToPlay.length > 0) { // only check if there are cards in array
    for (let i = 0; i < cardsToPlay.length; i += 1) {
      if (cardToPlay === cardsToPlay[i]) {
        // unselect the card
        isCardPresent = true;
        cardsToPlay.splice(i, 1);
        i -= 1; // account for the decrease in array length

        // remove the card border display to let player know card is unselected
        cardEl.classList.remove('select-card-border');
      }
    }
  }

  if (isCardPresent === false) {
    // select and store the card since it is not selected previously
    cardsToPlay.push(cardToPlay);

    // display the card border to let player know card is selected
    cardEl.classList.add('select-card-border');
  }
};

// display cards
const displayCards = (playerHand) => {
  for (let i = 0; i < playerHand.length; i += 1) {
    const cardEl = makeCard(playerHand[i]);

    // store the current card in case the player wants to exchange it later
    const cardToPlay = playerHand[i];

    // eslint-disable-next-line no-loop-func
    cardEl.addEventListener('click', (event) => {
      // select the card to exchange or unselect it
      selectOrUnselectCardToPlay(event.currentTarget, cardToPlay);
    });

    playerHandRow.appendChild(cardEl);
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
    displayCards(gameData.handCards);

    // remove display of play cards btn if it is not the user's turn, vice versa
    if (gameData.isUserTurn === false) {
      playCardsBtn.classList.add('remove-display');
    } else {
      // will not remove anything if this class was not added previously
      playCardsBtn.classList.remove('remove-display');
    }
  })
  .catch((error) => {
    // handle error
    console.log('get game error', error);
  });

console.log('hello');
