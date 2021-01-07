import { resolve } from 'path';
import db from './models/index.mjs';

// import checkAuth middleware
import checkAuthMiddleware from './lib/check-auth.mjs';

// import controllers
import users from './controllers/users.mjs';
import games from './controllers/games.mjs';

export default function routes(app) {
  // pass in db for all callbacks in controllers
  const checkAuth = checkAuthMiddleware(db);
  const UsersController = users(db);
  const GamesController = games(db);

  // login page
  app.get('/login', (req, res) => {
    console.log('render a login form');

    res.render('login');
  });

  // accept login form request
  app.post('/login', UsersController.login);

  // registration page
  app.get('/register', (req, res) => {
    console.log('render a registration form');

    res.render('register');
  });

  // register a user
  app.post('/register', UsersController.register);

  // home page
  app.get('/home', checkAuth, (req, res) => {
    // redirect user to gameplay page if user has an ongoing game
    if (req.user.hasOngoingGame === true) {
      console.log('user has ongoing game, redirecting to gameplay page...');
      res.redirect('/');
    } else {
      console.log('render home page');

      res.render('home');
    }
  });

  // create game page
  app.get('/games/new', checkAuth, GamesController.newGame);

  // create a game
  app.post('/games', checkAuth, GamesController.create);

  // gameplay page
  app.get('/', checkAuth, (req, res) => {
    // redirect user to home page if user has no ongoing game
    if (req.user.hasOngoingGame === false) {
      console.log('user has no ongoing game, redirecting to home...');
      res.redirect('/home');
    } else {
      console.log('sending html file');
      res.sendFile(resolve('js/dist', 'index.html'));
    }
  });

  // get game data of a user's ongoing game
  app.get('/games/one', checkAuth, GamesController.show);

  // update game when player plays cards
  app.put('/games/:id/playcards', checkAuth, GamesController.playCards);

  // logout a user
  app.get('/logout', UsersController.logout);
}
