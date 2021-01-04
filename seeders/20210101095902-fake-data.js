// require jssha lib
const jsSha = require('jssha');

// function to generate a hash for password
function getHash(input) {
  // environment variable to use as a secret word for hashing userId cookie
  // environment variable is currently stored in ~/.profile (see RA module 3.6.4)
  const myEnvVar = process.env.MY_ENV_VAR;

  // create new SHA object
  // eslint-disable-next-line new-cap
  const shaObj = new jsSha('SHA-512', 'TEXT', { encoding: 'UTF8' });

  // create an unhashed cookie string based on user ID and myEnVar
  const unhashedString = `${input}-${myEnvVar}`;

  // generate a hashed cookie string using SHA object
  shaObj.update(unhashedString);

  return shaObj.getHash('HEX');
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const usersList = [
      {
        username: 'kai',
        password: 'kai',
        hashedPassword: getHash('kai'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'alvin',
        password: 'alvin',
        hashedPassword: getHash('alvin'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'akira',
        password: 'akira',
        hashedPassword: getHash('akira'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert(
      'users',
      usersList,
      { returning: true },
    );
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.bulkDelete('users', null, {});
  },
};
