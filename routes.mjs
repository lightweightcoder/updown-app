import { resolve } from 'path';
import db from './models/index.mjs';

// import controllers
import games from './controllers/games.mjs';
import users from './controllers/users.mjs';

// import checkAuth middleware
import checkAuthMiddleware from './lib/check-auth.mjs';

export default function routes(app) {
  // pass in db for all callbacks in controllers
  const checkAuth = checkAuthMiddleware(db);

  // login page
  app.get('/login');

  // main page, also the gameplay page
  app.get('/', checkAuth, (request, response) => {
    response.sendFile(resolve('js/dist', 'index.html'));
  });
}
