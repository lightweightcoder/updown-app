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
const cancelGameAnchor = document.getElementById('cancel-game-anchor');

// array to store user's cards to send to the discard pile
const cardsToPlay = [];

// modal to display invalid messages
let invalidMsgModalContainer = null;

// modal to display end game messages and links
let endGameModalContainer = null;

// helper functions ============================================
/**
 * create and display a modal to show at the end of a game
 * @param {object} data - containing either a winnerName string or tied player names array
 */
const createAndDisplayEndGameModal = (data) => {
  // if the modal has been created before, remove it first
  if (endGameModalContainer !== null) {
    endGameModalContainer.remove();
  }

  endGameModalContainer = document.createElement('div');

  let message;

  // if input is a winner name
  if (data.winnerName) {
    message = `Congratulations to <b>${data.winnerName}</b> on winning!`;
  }

  // if input is an array of tied player names
  if (data.tiedPlayersNames) {
    message = `Congratulations to <b>${data.tiedPlayersNames.join(' & ')}</b> on tieing!`;
  }

  // html to create the modal
  endGameModalContainer.innerHTML = `
    <div class="modal fade" id="endGameModalContainer" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <a class="btn btn-primary" href="/home" role="button">Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.append(endGameModalContainer);

  // eslint-disable-next-line no-undef
  const modal = new bootstrap.Modal(document.querySelector('#endGameModal'), {
    keyboard: false,
    backdrop: 'static',
  });

  // show the modal
  modal.show();
};

// create and display a modal with an invalid message
const createAndDisplayInvalidMsgModal = (message) => {
  // if the modal has been created before, remove it first
  if (invalidMsgModalContainer !== null) {
    invalidMsgModalContainer.remove();
  }
  invalidMsgModalContainer = document.createElement('div');

  // html to create the modal
  invalidMsgModalContainer.innerHTML = `
    <div class="modal fade" id="invalidMsgModal" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">OH NO</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.append(invalidMsgModalContainer);

  // eslint-disable-next-line no-undef
  const modal = new bootstrap.Modal(document.querySelector('#invalidMsgModal'), {
    keyboard: false,
    backdrop: 'static',
  });

  // show the modal
  modal.show();
};

// display the user's info and logout btn
const displayUserSessionInfo = (username) => {
  const welcomeMsgEl = document.createElement('span');
  const logoutAnchor = document.createElement('a');

  welcomeMsgEl.innerHTML = `welcome back <b>${username}</b>`;

  logoutAnchor.innerText = 'logout';
  logoutAnchor.href = '/logout';

  // append elements
  sessionCol.append(welcomeMsgEl, logoutAnchor);
};

// display the message of which player's turn
const displayMessage = (gameData) => {
  // empty previous html in messageCol
  messageCol.innerHTML = '';

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
  // empty previous html in drawPileCol
  drawPileCol.innerHTML = '';

  const drawPileSizeEl = document.createElement('span');

  drawPileSizeEl.innerHTML = `cards in draw pile: ${drawPileSize}`;

  // append elements
  drawPileCol.append(drawPileSizeEl);
};

// display the number of cards left in the draw pile
const displayDiscardPileCard = (discardPileCard) => {
  // empty previous html in discardPileCardCol
  discardPileCardCol.innerHTML = '';

  const discardPileCardEl = document.createElement('span');

  discardPileCardEl.innerHTML = `discardPileCard: ${discardPileCard.name} of ${discardPileCard.suit}`;

  // append elements
  discardPileCardCol.append(discardPileCardEl);
};

// display the current game statistics
const displayGameStats = (data) => {
  // empty previous html in gameStatsTableContainer
  gameStatsTableContainer.innerHTML = '';

  // create the display for the game stats table headings
  const headingRow = document.createElement('div');
  headingRow.classList.add('row');

  const usernameHeadingCol = document.createElement('div');
  usernameHeadingCol.classList.add('col-7', 'table-col');

  const handSizeHeadingCol = document.createElement('div');
  handSizeHeadingCol.classList.add('col-5', 'table-col');

  // create elements to contain the game statistics content
  const usernameHeadingEl = document.createElement('h5');
  const handSizeHeadingEl = document.createElement('h5');

  // add the game statistics content
  usernameHeadingEl.innerHTML = 'Username';
  handSizeHeadingEl.innerHTML = 'Hand Size';

  // append elements
  usernameHeadingCol.append(usernameHeadingEl);
  handSizeHeadingCol.append(handSizeHeadingEl);
  headingRow.append(usernameHeadingCol, handSizeHeadingCol);
  gameStatsTableContainer.append(headingRow);

  // create the display for the game stats table info
  for (let i = 0; i < data.length; i += 1) {
    // create the bootstrap rows and columns
    const row = document.createElement('div');
    row.classList.add('row');
    const usernameCol = document.createElement('div');
    usernameCol.classList.add('col-7', 'table-col');
    const handSizeCol = document.createElement('div');
    handSizeCol.classList.add('col-5', 'table-col');

    // create elements to contain the game statistics content
    const usernameEl = document.createElement('p');
    const handSizeEl = document.createElement('p');

    // add the game statistics content
    usernameEl.innerHTML = data[i].username;
    handSizeEl.innerHTML = data[i].handSize;

    // append elements
    usernameCol.append(usernameEl);
    handSizeCol.append(handSizeEl);
    row.append(usernameCol, handSizeCol);
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
  // empty the cardsToPlay array
  cardsToPlay.splice(0, cardsToPlay.length);

  // empty previous html in playerHandRow
  playerHandRow.innerHTML = '';

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

// handler to send played cards to server to update game
const handlePlayCardsBtnClick = (gameId) => function () {
  // if player did not select any cards, don't do anything
  if (cardsToPlay.length === 0) {
    createAndDisplayInvalidMsgModal('please choose a card to play');
    return;
  }

  axios.put(`/games/${gameId}/playcards`, { cardsToPlay })
    .then((res) => {
      console.log(res);
      // if server detects user who played cards is not the current player
      // or user did not select any cards, show modal with invalid msg
      if (typeof res.data === 'string') {
        const invalidMsg = res.data;
        createAndDisplayInvalidMsgModal(invalidMsg);
      }

      // if there is a next player,
      // make request for all items for gameplay of the ongoing game and display them
      if (res.data.isNextPlayerTurn === true) {
        console.log('get next turn game data');
        axios.get('/games/ongoing')
          .then((secondRes) => {
            const gameData = secondRes.data;

            // display gameplay elements
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
      }

      // if there is a winner, create an end game modal
      if (res.data.winnerName) {
        console.log('winnerName is', res.data.winnerName);

        // create an end game modal with the winner's name
        createAndDisplayEndGameModal({ winnerName: res.data.winnerName });
      }

      // if there is a tie, create an end game modal
      if (res.data.tiedPlayersNames) {
        console.log('tiedPlayersNames are', res.data.tiedPlayersNames);

        // create an end game modal with the tied players' names
        createAndDisplayEndGameModal({ tiedPlayersNames: res.data.tiedPlayersNames });
      }
    })
    .catch((error) => {
      // handle error
      console.log('play cards error:', error);
    });
};

// game initialisation =============
// make request for all items for gameplay of the ongoing game
axios.get('/games/ongoing')
  .then((res) => {
    const gameData = res.data;

    // add link to cancel game btn
    cancelGameAnchor.href = `games/${gameData.gameId}/cancel`;

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

    // add event listener to send played cards to server to update the game
    playCardsBtn.addEventListener('click', handlePlayCardsBtnClick(gameData.gameId));

    // if its not user turn, add a countdown to refresh the page every 3 seconds
    if (gameData.isUserTurn === false) {
      setInterval(() => { window.location = '/'; }, 5000);
    }
  })
  .catch((error) => {
    // handle error
    console.log('get game error', error);
    // window.location = '/login';
  });
