import pkg from 'sequelize';
import { makeNewGameItems } from '../lib/gameplay.mjs';

const { Op } = pkg;

/*
 * ========================================================
 * ========================================================
 *
 *                  Helper Functions
 *
 * ========================================================
 * ========================================================
 */

/**
 * check in the order of playerIds array if a player has any playable cards
 * playable cards are those which value are in the range of +1 of discardPileCard
 * 1st player who has a playable card is the current player
 * @param {array} playerHands - each element is a player's hand cards object
 * @param {array} playerIds - each element is a player id
 * @param {object} discardPileCard - card for the discard pile
 */
const getStartingPlayerId = (playersHands, playerIds, discardPileCard) => {
  let startingPlayerId = 'none';

  // check if a player has a playable card
  for (let i = 0; i < playersHands.length; i += 1) {
    for (let j = 0; j < playersHands[i].length; j += 1) {
      const cardBeingChecked = playersHands[i][j];

      // if card meets criteria to be playable
      // eslint-disable-next-line max-len
      if (cardBeingChecked.rank === discardPileCard.rank || cardBeingChecked.rank === discardPileCard.rank + 1 || cardBeingChecked.rank === discardPileCard.rank - 1 || (cardBeingChecked.rank === 1 && discardPileCard.rank === 13) || (cardBeingChecked.rank === 13 && discardPileCard.rank === 1)) {
        // this player who has a playable card will be the curent player
        startingPlayerId = playerIds[i];

        // if that player has a card, return that player's number and exit the function
        return startingPlayerId;
      }
    }
  }

  // if code reaches here, no player has a playable card
  return startingPlayerId;
};

/*
 * ========================================================
 * ========================================================
 *
 *                  Controller Stuff
 *
 * ========================================================
 * ========================================================
 */

export default function games(db) {
  // find available users and render create game page
  const newGame = async (req, res) => {
    console.log('get request to render create game page came in');

    try {
      // redirect user to gameplay page if he or she has an ongoing game
      if (req.user.hasOngoingGame === true) {
        res.redirect('/');

        return;
      }

      // get the logged in user id
      const loggedInUserId = req.user.id;

      // find all players (in database) who are not the logged in user
      // and do not have an ongoing game
      const availablePlayers = await db.User.findAll({
        where: {
          id: {
            [Op.ne]: loggedInUserId,
          },
          hasOngoingGame: false,
        },
      });

      // render create game page
      res.render('new', { availablePlayers });
    } catch (error) {
      console.log('newGame error:', error);
      res.status(500).send(error);
    }
  };

  // create new game
  const create = async (req, res) => {
    console.log('post request to create game came in');

    try {
      // get user ids of the players
      let { playerIds } = req.body;
      const loggedInUserId = req.user.id;

      // test if playerIds is only 1 player or more than 1
      // then concatenate playerIds and loggedInUserId into an array
      if (typeof playerIds === 'string') {
        playerIds = [loggedInUserId, playerIds];
      } else if (typeof playerIds === 'object') {
        playerIds = [loggedInUserId, ...playerIds];
      }

      // some variables that will be stored in the database
      let startingPlayerId = 'none';
      let playersHands;
      let drawPile;
      let discardPileCard;

      // if we cant find a current player after an iteration of the while loop below,
      // it means that no player has a playable card even after emptying the drawPile
      // so a new set of game items have to be created again.
      while (startingPlayerId === 'none') {
        // make items for a new game: a shuffled deck, playerhands, draw pile and discard pile card
        const newGameItems = makeNewGameItems(playerIds.length);

        playersHands = newGameItems.playersHands;
        drawPile = newGameItems.drawPile;
        discardPileCard = newGameItems.discardPileCard;

        // try to get a current player number. The current player has to have a playable card
        startingPlayerId = getStartingPlayerId(playersHands, playerIds, discardPileCard);

        // while there are no players with a playable card and there are still cards in drawPile,
        // make a card from drawPile the discardPileCard and do the check again
        // and repeat till a player has a playable card
        while (startingPlayerId === 'none' && drawPile.length !== 0) {
          discardPileCard = drawPile.pop();

          // eslint-disable-next-line max-len
          startingPlayerId = getStartingPlayerId(playersHands, discardPileCard);
        }
      }

      // create the game once the starting items have been created
      // and starting player has been found in the while loop above
      console.log('create game!');

      const newGameData = {
        drawPile,
        discardPileCard,
        currentPlayerId: startingPlayerId,
      };

      // run the DB INSERT query to create the new game
      const createdGame = await db.Game.create(newGameData);

      const newGamesUserDatas = [];

      // store the gamesUser data for each player
      // and run the DB update query to update the hasOngoingGame column in users table to true
      for (let i = 0; i < playerIds.length; i += 1) {
        const newGamesUserData = {
          gameId: createdGame.id,
          userId: playerIds[i],
          hand: playersHands[i],
          playerNum: i + 1,
        };

        newGamesUserDatas.push(newGamesUserData);

        // eslint-disable-next-line no-await-in-loop
        await db.User.update({ hasOngoingGame: true }, {
          where: {
            id: playerIds[i],
          },
        });
      }

      // run the DB insert query to create join table data
      await db.GamesUser.bulkCreate(newGamesUserDatas);
    } catch (error) {
      console.log('create game error: ', error);
      // send error to browser
      res.status(500).send(error);
    }
  };

  // get game data of a user's ongoing game
  const show = async (req, res) => {
    console.log('get request to find a user\'s ongoing game data came in');

    try {
      // get user id of the user
      const loggedInUserId = req.user.id;

      // find the ongoing game data of the user
    } catch (error) {
      console.log('show error: ', error);
      // send error to browser
      res.status(500).send(error);
    }
  };

  // return all functions we define in an object
  // refer to the routes file above to see this used
  return {
    newGame,
    create,
  };
}
