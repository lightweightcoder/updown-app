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

/**
 * update database with a winner
 * @param {integer} winnerUserId - winnerId to update in games table
 * @param {object} gamesUsersData - items needed to do the update
 * @param {object} db - give access to models to update the database
 */
const updateGameWithWinner = async (winnerUserId, gamesUsersData, db) => {
  console.log('updating winner!');

  try {
    // get the game id
    const { gameId } = gamesUsersData[0];
    console.log('gameId', gameId);
    console.log('winnerUserId is', winnerUserId);

    // update the user's hand in gamesUsers table
    await db.GamesUser.update(
      {
        hand: [],
      },
      {
        where: {
          gameId,
          userId: winnerUserId,
        },
      },
    );

    // update winner and status of game in games table
    await db.Game.update(
      {
        winnerId: winnerUserId,
        isOngoing: false,
      },
      {
        where: {
          id: gameId,
        },
      },
    );

    // update the hasOngoingGame column of users table to false for the players
    for (let i = 0; i < gamesUsersData.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
      await db.User.update(
        {
          hasOngoingGame: false,
        },
        {
          where: {
            id: gamesUsersData[i].userId,
          },
        },
      );
    }
  } catch (error) {
    console.log('updateGameWithWinner error:', error);
  }
};

/**
 * evaluate and update:
 * gamesUsers table with the user's hand, next player,
 * games table with drawPile and discardPileCard
 * return the updated data to display on gameplay page
 * return winner name if a winner is found
 * @param {object} gameData - items needed to do the evaluation and update
 * @param {object} db - give access to models to update the database
 */
// eslint-disable-next-line consistent-return
const updateGameAndGamesUsersTable = async (gameData, db) => {
  console.log('in update game and games users table fn');

  try {
    // store the keys in variables
    const {
      userId, drawPile, gamesUsersData, cardsToPlay,
    } = gameData;

    let { discardPileCard } = gameData;

    let winnerUserId = null;

    // the potential next player's index in gamesUsersData
    let potentialNextPlayerIndex;

    // find the user who played the cards
    const currentUser = gamesUsersData.find((gamesUser) => gamesUser.userId === userId);

    potentialNextPlayerIndex = gamesUsersData.indexOf(currentUser) + 1;

    // remove played cards from the user's hand
    for (let i = 0; i < cardsToPlay.length; i += 1) {
      for (let j = 0; j < currentUser.hand.length; j += 1) {
        // if cards name and suit matches, remove it from user's hand
        // eslint-disable-next-line max-len
        if ((cardsToPlay[i].name === currentUser.hand[j].name) && (cardsToPlay[i].suit === currentUser.hand[j].suit)) {
          currentUser.hand.splice(j, 1);

          // account for the change in length in cardsToPlay
          i -= 1;

          // make j large enough to exit the for loop because
          // there's no need to check for that card anymore
          j = 1000;
        }
      }
    }

    // if user has no card left, he/she wins the game
    if (currentUser.hand.length === 0) {
      console.log('user wins!');
      // set winnerId
      winnerUserId = userId;
    }

    // if user is the winner update the game with a winner and return the winner id
    if (winnerUserId !== null) {
      console.log('gamesUsersData[0].gameId is', gamesUsersData[0].gameId);
      updateGameWithWinner(winnerUserId, gamesUsersData, db);

      return { winnerUserId };
    }

    // check who the next player is, and use top card of drawPile as discard pile card if needed
    // -------------------------------------------------------------------------------
    // to set the next player's id
    let nextPlayerId = null;

    // if nextPlayerId === null, it means a next player has not been found
    while (nextPlayerId === null && drawPile.length > 0) {
    // to track number of players that skipped,
    // counting from player corresponding to nextPlayerIndex
      let timesSkipped = 0;

      // exit loop if every player has skipped or a next player has been found
      while (timesSkipped < gamesUsersData.length && nextPlayerId === null) {
      // if the potentialNextPlayerIndex exceeds the available indexes of gamesUsersData,
      // reset potentialNextPlayerIndex to 0
        if (potentialNextPlayerIndex === gamesUsersData.length) {
          potentialNextPlayerIndex = 0;
        }

        // player's hand to check
        const handBeingChecked = gamesUsersData[potentialNextPlayerIndex].hand;

        // check if the potential next player has a valid card in hand
        // by comparing with discardPileCard
        for (let i = 0; i < handBeingChecked.length; i += 1) {
          const cardBeingChecked = handBeingChecked[i];

          // if card meets criteria to be playable
          // eslint-disable-next-line max-len
          if (cardBeingChecked.rank === discardPileCard.rank || cardBeingChecked.rank === discardPileCard.rank + 1 || cardBeingChecked.rank === discardPileCard.rank - 1 || (cardBeingChecked.rank === 1 && discardPileCard.rank === 13) || (cardBeingChecked.rank === 13 && discardPileCard.rank === 1)) {
          // this potential next player who has a valid card is confirmed the next player
          // this will cause the while loop to stop
            nextPlayerId = gamesUsersData[potentialNextPlayerIndex].userId;

            // make i the hand length to exit the for loop
            i = handBeingChecked.length;
          }
        }

        // if the next player has not been found, skip once.
        if (nextPlayerId === null) {
          timesSkipped += 1;
          potentialNextPlayerIndex += 1;
        }
      }

      // if the next player has not been found, and every player has skipped,
      // use top card of drawPile as discard pile card and
      // check again in next iteration of while loop
      if (nextPlayerId === null && timesSkipped === gamesUsersData.length) {
        console.log('use top card of draw pile as discard pile card');
        discardPileCard = drawPile.pop();
      }
    }

    // if next player has not been found and draw pile has no more cards,
    // find user who has the least cards left to be the winner and
    // update the database
    // array to store the length of players' hand
    const handslength = [];

    if (nextPlayerId === null && drawPile.length === 0) {
      console.log('next player is not found and draw pile is empty');
      // find the hand lengths of all the players
      for (let i = 0; i < gamesUsersData.length; i += 1) {
        handslength.push(gamesUsersData[i].hand.length);
      }

      // find the smallest hand(s)
      const smallestHandLength = Math.min(...handslength);

      // find number of smallest hand(s)
      const smallestHands = handslength.filter((length) => length === smallestHandLength);
      const countOfSmallestHands = smallestHands.length;

      // if there is only 1 player with the smallest hand, he/she is the winner and
      // update database
      if (countOfSmallestHands === 1) {
        const winnerIndex = handslength.indexOf(smallestHandLength);

        winnerUserId = gamesUsersData[winnerIndex].userId;

        // update database with winner
        updateGameWithWinner(winnerUserId, gamesUsersData, db);

        // return the winner id
        return { winnerUserId };
      }

      // if there are >1 player with the smallest hand, its a draw
      // update database
      if (countOfSmallestHands > 1) {
        console.log('tied game');
        // update the isOngoing column in the games table of that game
        await db.Game.update(
          {
            isOngoing: false,
          },
          {
            where: {
              id: gamesUsersData[0].gameId,
            },
          },
        );

        // update the hasOngoingGame column of users table to false for the players
        for (let i = 0; i < gamesUsersData.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
          await db.User.update(
            {
              hasOngoingGame: false,
            },
            {
              where: {
                id: gamesUsersData[i].userId,
              },
            },
          );
        }

        // get the gameUsers that have the smallest hand lengths
        // eslint-disable-next-line max-len
        const gamesUsersWhoTied = gamesUsersData.filter((gamesUser) => gamesUser.hand.length === smallestHandLength);

        // array to store the user ids that tied the game
        const userIdsWhoTied = [];

        for (let i = 0; i < gamesUsersWhoTied.length; i += 1) {
          userIdsWhoTied.push(gamesUsersWhoTied[i].userId);
        }

        // return the users ids that tied the game
        return { userIdsWhoTied };
      }
    }

    /** --------------------------------------------------------------------------
   * if code reaches here, the next player is found. Update the game data in DB.
   * ---------------------------------------------------------------------------
   */
    // update the user's hand in gamesUsers table
    for (let i = 0; i < gamesUsersData.length; i += 1) {
    // if the userId matches that of a gamesUser, update that gamesUser
      if (userId === gamesUsersData[i].userId) {
      // eslint-disable-next-line no-await-in-loop
        await db.GamesUser.update(
          {
            hand: gamesUsersData[i].hand,
          },
          {
            where: {
              id: gamesUsersData[i].id,
            },
          },
        );
      }
    }

    // update the drawPile, discard pile card and current player turn in games table
    await db.Game.update(
      {
        drawPile,
        discardPileCard,
        currentPlayerId: nextPlayerId,
      },
      {
        where: {
          id: gamesUsersData[0].gameId,
        },
      },
    );

    return { nextPlayerId };
  } catch (error) {
    console.log('updateGameAndGamesUsersTable error:', error);
  }
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
      // redirect user to gameplay page if he or she alreadyhas an ongoing game
      if (req.user.hasOngoingGame === true) {
        res.redirect('/');

        return;
      }

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

      // redirect to gameplay page
      res.redirect('/');
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
      // find the ongoing game data and gameUser data of the user
      const gameInstances = await req.user.getGames({
        where: {
          isOngoing: true,
        },
      });

      // store the data into variables
      const gameInstance = gameInstances[0];
      const gamesUserInstance = gameInstances[0].gamesUser;

      // set boolean if user is the current player of the turn
      let isUserTurn = false;
      if (gameInstance.currentPlayerId === req.user.id) {
        isUserTurn = true;
      }

      // query DB for user of the current turn
      const currentTurnPlayerInstance = await db.User.findOne({
        where: {
          id: gameInstance.currentPlayerId,
        },
      });

      // query DB for player number, names, handsize for table on gameplay page
      const playersInfo = await db.GamesUser.findAll({
        where: {
          gameId: gameInstance.id,
        },
        order: [
          ['playerNum', 'ASC'],
        ],
        include: db.User,
      });

      // array to store player number, names and handsize
      const tableInfo = [];

      // populate the table info
      for (let i = 0; i < playersInfo.length; i += 1) {
        const tableInfoItem = {
          username: playersInfo[i].user.username,
          handSize: playersInfo[i].hand.length,
        };

        tableInfo.push(tableInfoItem);
      }

      // game data to send to response
      const gameData = {
        username: req.user.username,
        currentPlayerUsername: currentTurnPlayerInstance.username,
        drawPileSize: gameInstance.drawPile.length,
        discardPileCard: gameInstance.discardPileCard,
        handCards: gamesUserInstance.hand,
        tableData: tableInfo,
        isUserTurn,
        gameId: gameInstance.id,
      };

      // send the response
      res.send(gameData);
    } catch (error) {
      console.log('show error: ', error);
      // send error to browser
      res.status(500).send(error);
    }
  };

  // update game when player plays cards
  const playCards = async (req, res) => {
    console.log('put request to play cards and update game');

    try {
      // store cards played by player
      const { cardsToPlay } = req.body;

      // if player did not play any cards, send invalid response
      if (cardsToPlay.length === 0) {
        res.send('please choose a card to play');
        return;
      }

      // store game id
      const gameId = req.params.id;

      // query DB for data of the corresponding game information
      const gameQueryResult = await db.Game.findOne({
        where: {
          id: gameId,
        },
        include: db.GamesUser,
        order: [
          [db.GamesUser, 'playerNum', 'ASC'],
        ],
      });

      // if the user who played cards is not the current player, send invalid response
      // this happens when the user manipulates the DOM to show the play cards btn and click on it
      if (req.user.id !== gameQueryResult.currentPlayerId) {
        res.send('its not your turn');
        return;
      }

      // get the discard pile card
      const { discardPileCard } = gameQueryResult;

      // get the 1st card played
      const firstCardPlayed = cardsToPlay[0];

      // if there is an invalid card played, send a response to inform user to only play valid cards
      // valid cards must fall within +-1 rank of that of the discard pile card
      // all played cards have the same value
      for (let i = 0; i < cardsToPlay.length; i += 1) {
        if (cardsToPlay[i].rank !== firstCardPlayed.rank) {
          res.send('please only select cards that are +-1 of the value of the discard pile card and all cards must be of the same value');
          return;
        }

        // eslint-disable-next-line max-len
        if (!(cardsToPlay[i].rank === discardPileCard.rank || cardsToPlay[i].rank === discardPileCard.rank + 1 || cardsToPlay[i].rank === discardPileCard.rank - 1 || (cardsToPlay[i].rank === 1 && discardPileCard.rank === 13) || (cardsToPlay[i].rank === 13 && discardPileCard.rank === 1))) {
          res.send('please only select cards that are +-1 of the value of the discard pile card and all cards must be of the same value');
          return;
        }
      }

      /** -----------------------------------------------------------------
       * if code reaches here, validations are successful. Update the game.
       * ------------------------------------------------------------------
       */
      console.log('validations success');
      // assign the gamesUsers table data to a new array
      // so we will not do a 'manual' update to the gamesUsers model instances
      const gamesUsersData = [];
      for (let i = 0; i < gameQueryResult.gamesUsers.length; i += 1) {
        gamesUsersData.push(gameQueryResult.gamesUsers[i].dataValues);
      }

      // store the data needed to update the game in an object
      const gameData = {
        // to find the user's hand in gamesUsersData
        userId: req.user.id,
        // used when game needs to draw a card to the discard pile
        drawPile: gameQueryResult.drawPile,
        // used to update the user's hand and check who is the next player and
        // update gameUsers table if there is a winner/draw
        gamesUsersData,
        // new discard pile card
        discardPileCard: firstCardPlayed,
        // to update user's hand
        cardsToPlay,
      };

      // update the game
      const updateResult = await updateGameAndGamesUsersTable(gameData, db);
      console.log('update result is', updateResult);

      // if there is a winner, find the winner's name and send it to response
      if (updateResult.winnerUserId) {
        try {
          const winnerInstance = await db.User.findOne({
            where: {
              id: updateResult.winnerUserId,
            },
          });

          res.send({ winnerName: winnerInstance.username });
        } catch (error) {
          console.log('find the winner name error: ', error);
          // send error to browser
          res.status(500).send(error);
        }

        return;
      }

      // if there is a tie, find the tied players' names and send it to response
      if (updateResult.userIdsWhoTied) {
        try {
          const tiedPlayersInstances = await db.User.findAll({
            where: {
              id: [...updateResult.userIdsWhoTied],
            },
          });

          const tiedPlayersNames = [];

          for (let i = 0; i < tiedPlayersInstances.length; i += 1) {
            tiedPlayersNames.push(tiedPlayersInstances[i].username);
          }

          res.send({ tiedPlayersNames });
        } catch (error) {
          console.log('find the tied players names error: ', error);
          // send error to browser
          res.status(500).send(error);
        }

        return;
      }

      // if there is a next player, send response that it is the next player's turn
      if (updateResult.nextPlayerId) {
        console.log('send response that it is the next player turn');

        res.send({ isNextPlayerTurn: true });
      }
    } catch (error) {
      console.log('play cards error: ', error);
      // send error to browser
      res.status(500).send(error);
    }
  };

  // cancel an ongoing game for all players
  const cancel = async (req, res) => {
    console.log('get request to cancel an ongoing game');

    try {
      // get the game id
      const gameId = req.params.id;
      console.log('gameid', gameId);

      // find the ongoing game data, gameUser data and players data
      const gameInstance = await db.Game.findOne({
        where: {
          id: gameId,
        },
        include: db.User,
      });

      // update game status to not ongoing
      await gameInstance.update({ isOngoing: false });

      // store the players user instances and gamesUser instances
      const userInstances = gameInstance.users;

      // update users hasOngoingGame status to false
      for (let i = 0; i < userInstances.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await userInstances[i].update({ hasOngoingGame: false });
      }

      // redirect to home page
      res.redirect('/home');
    } catch (error) {
      console.log('cancel game error: ', error);
      // send error to browser
      res.status(500).send(error);
    }
  };

  // return all functions we define in an object
  // refer to the routes file above to see this used
  return {
    newGame,
    create,
    show,
    playCards,
    cancel,
  };
}
