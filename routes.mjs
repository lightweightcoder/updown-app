import { resolve } from 'path';
import db from './models/index.mjs';

// import checkAuth middleware
import checkAuthMiddleware from './lib/check-auth.mjs';

// import controllers
import users from './controllers/users.mjs';

export default function routes(app) {
  // pass in db for all callbacks in controllers
  const checkAuth = checkAuthMiddleware(db);
  const UsersController = users(db);

  // login page
  app.get('/login', (req, res) => {
    console.log('render a login form');

    res.render('login');
  });

  // accept login form request
  app.post('/login', UsersController.login);

  // main page, also the gameplay page
  // found bug where checkAuth does not run
  app.get('/', checkAuth, (req, res) => {
    res.sendFile(resolve('js/dist', 'index.html'));
  });
}
