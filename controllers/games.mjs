import pkg from 'sequelize';

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

      console.log(availablePlayers);

      // render create game page
      res.render('new', { availablePlayers });
    } catch (error) {
      console.log('newGame error:', error);
      res.status(500).send(error);
    }
  };

  // return all functions we define in an object
  // refer to the routes file above to see this used
  return {
    newGame,
  };
}
