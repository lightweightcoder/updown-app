import makeShuffledDeck from './make-deck.mjs';

// eslint-disable-next-line import/prefer-default-export
export function makeNewGameItems() {
  const deck = makeShuffledDeck();

  console.log('deck is', deck);
  console.log('deck length is', deck.length);

  return deck;
}
