import pkg from 'sequelize';
import { makeNewGameItems } from '../lib/gameplay.mjs';

const { Op } = pkg;

/*
 * ========================================================
 * ========================================================
 * ========================================================
 * ========================================================
 *
 *                  Controller Stuff
 *
 * ========================================================
 * ========================================================
 * ========================================================
 */

export default function games(db) {
  // find available users and render create game page
  const newGame = async (req, res) => {
    console.log('in GamesController.newGame');

    try {
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
        console.log('playerIds', playerIds);
      } else if (typeof playerIds === 'object') {
        playerIds = [loggedInUserId, ...playerIds];
        console.log('playerIds', playerIds);
      }
    } catch (error) {
      console.log('create game error: ', error);
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
