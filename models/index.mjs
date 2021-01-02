import { Sequelize } from 'sequelize';
import url from 'url';
import allConfig from '../config/config.js';

// import models
import gameModel from './game.mjs';
import userModel from './user.mjs';
import gamesUserModel from './gamesUser.mjs';

const env = process.env.NODE_ENV || 'development';

const config = allConfig[env];

const db = {};

let sequelize;

if (env === 'production') {
  // break apart the Heroku database url and rebuild the configs we need

  const { DATABASE_URL } = process.env;
  const dbUrl = url.parse(DATABASE_URL);
  const username = dbUrl.auth.substr(0, dbUrl.auth.indexOf(':'));
  const password = dbUrl.auth.substr(dbUrl.auth.indexOf(':') + 1, dbUrl.auth.length);
  const dbName = dbUrl.path.slice(1);

  const host = dbUrl.hostname;
  const { port } = dbUrl;

  config.host = host;
  config.port = port;

  sequelize = new Sequelize(dbName, username, password, config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// model definitions
db.Game = gameModel(sequelize, Sequelize.DataTypes);
db.User = userModel(sequelize, Sequelize.DataTypes);
db.GamesUser = gamesUserModel(sequelize, Sequelize.DataTypes);

// model associations
db.Game.belongsToMany(db.User, { through: db.GamesUser });
db.User.belongsToMany(db.Game, { through: db.GamesUser });

// provide access to gamesUser attributes from game and user instances
db.Game.hasMany(db.GamesUser);
db.GamesUser.belongsTo(db.Game);
db.User.hasMany(db.GamesUser);
db.GamesUser.belongsTo(db.User);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
