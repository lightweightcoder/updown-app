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
        email: 'kai@kai.com',
        password: 'kai',
        hashedPassword: getHash('kai'),
        name: 'kai',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'alvin@alvin.com',
        password: 'alvin',
        hashedPassword: getHash('alvin'),
        name: 'alvin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'akira@akira.com',
        password: 'akira',
        hashedPassword: getHash('akira'),
        name: 'akira',
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
