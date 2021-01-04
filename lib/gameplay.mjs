import makeShuffledDeck from './make-deck.mjs';

// make items for a new game: a shuffled deck, playerhands, draw pile and discard pile card
// eslint-disable-next-line import/prefer-default-export
export function makeNewGameItems(numOfPlayers) {
  // make a shuffled deck
  const deck = makeShuffledDeck();

  const discardPileCard = deck.pop();

  // start of making players hands ----------------------------------------------------
  // number of starting cards per player given that
  // at least 10 cards are set aside for draw pile
  const numOfStartingCards = Math.floor((deck.length - 10) / numOfPlayers);

  // array to store players' hand cards
  const playersHands = [];

  // create starting cards for each player
  for (let i = 0; i < numOfPlayers; i += 1) {
    const playerHand = [];

    // deal starting cards for that player
    for (let j = 0; j < numOfStartingCards; j += 1) {
      playerHand.push(deck.pop());
    }

    // store that player's hand
    playersHands.push(playerHand);
  }
  // end of making players hands ----------------------------------------------------

  return {
    playersHands,
    drawPile: deck,
    discardPileCard,
  };
}
