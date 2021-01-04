import pkg from 'sequelize';
import getHash from '../lib/get-hash.mjs';

const { UniqueConstraintError, ValidationError, DatabaseError } = pkg;

export default function users(db) {
  const login = async (req, res) => {
    console.log('post request to login came in');

    // set object to store messages for invalid email or password input fields
    const templateData = {};

    try {
      const usernameInput = req.body.username;
      const passwordInput = req.body.password;
      const hashedPasswordInput = getHash(passwordInput);

      // try to find a user
      const user = await db.User.findOne(
        {
          where: { username: usernameInput, hashedPassword: hashedPasswordInput },
        },
      );

      // check if a user is found
      if (user === null) {
        console.log('user not found');

        // add message to inform user of invalid email/password
        templateData.invalidMessage = 'Sorry you have keyed in an incorrect username/password';

        // render the login form
        res.render('login', templateData);
      } else {
        console.log('found user, logged in!');

        // generate a hashed userId
        const loggedInHash = getHash(user.id);

        // set cookies with the userId and hashed userId
        res.cookie('userId', user.id);
        res.cookie('loggedInHash', loggedInHash);

        // if user has an ongoing game, redirect to gameplay (root) route
        // else user has no ongoing game, redirect to home route
        if (user.hasOngoingGame === true) {
          res.redirect('/');
        } else {
          res.redirect('/home');
        }
      }
    } catch (error) {
      console.log(error);
      // send error to browser
      res.status(500).send(error);
    }
  };

  const register = async (req, res) => {
    console.log('post request to register came in!');

    try {
      const usernameInput = req.body.username;
      const passwordInput = req.body.password;
      const hashedPasswordInput = getHash(passwordInput);

      // try to create a user
      const user = await db.User.create({
        username: usernameInput,
        password: passwordInput,
        hashedPassword: hashedPasswordInput,
      });

      // generate a hashed userId
      const loggedInHash = getHash(user.id);

      // set cookies with the userId and hashed userId
      res.cookie('userId', user.id);
      res.cookie('loggedInHash', loggedInHash);

      // redirect to home route
      res.redirect('/home');
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        // email is not unique
        console.log('SORRY UNIQUE ERROR');
        console.log(error);

        const invalidUsernameMsg = 'The username you entered already exists.';

        res.render('register', { invalidUsernameMsg });
      } else if (error instanceof ValidationError) {
        console.log('SORRY VALIDATION ERROR');
        console.log(error);
        console.log('THIS IS WHAT HAPPENED:');
        console.log(error.errors[0].message);
        res.status(500).send(error);
      } else if (error instanceof DatabaseError) {
        console.log('SORRY DB ERROR');
        console.log(error);
        res.status(500).send(error);
      }
      else {
        console.log(error);
        res.status(500).send(error);
      }
    }
  };

  return { login, register };
}
