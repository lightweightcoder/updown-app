import getHash from './get-hash.mjs';

/**
 * set the cookie checking middleware callback
 * and supply logged-in user data to subsequent middleware
 * @param {object} db - contains methods corresponding to each controller in controllers folder
*/
export default function checkAuthMiddleware(db) {
  /**
   * @param {object} req - route request
   * @param {object} res - route response
   * @param {function} next - next middleware function of app.
   */
  return async function checkAuth(req, res, next) {
    console.log('inside checkAuth');
    // check to see if the cookies you need exists
    if (req.cookies.loggedInHash && req.cookies.userId) {
      // get the hashed value that should be inside the cookie
      const hash = getHash(req.cookies.userId);

      // test the value of the cookie
      if (req.cookies.loggedInHash === hash) {
        try {
          // look for this user in the database
          const user = await db.User.findByPk(req.cookies.userId);

          if (user === null) {
            // the userId in the cookie is invalid
            console.log('no such user in database');
            // redirect to login page
            res.redirect('/login');
          } else {
            // found a user in the database so move on to next middleware in route
            console.log('found user');

            // put user details in request for next middleware to use
            req.user = user;
            next();
          }
        } catch (error) {
          console.log(error);
        }

        // return so it wont go below
        return;
      }

      // if the testing of the cookie value failed (req.cookies.loggedInHash != hash)
      console.log('testing of the cookie value failed');

      // redirect to login page
      res.redirect('/login');

      // return so it wont go below
      return;
    }

    // if there is no loggedInHash & userId cookie
    console.log('found no userId or loggedInHash cookies');

    // redirect to login page
    res.redirect('/login');

    // for axios requests
    // res.send(403);
  };
}
