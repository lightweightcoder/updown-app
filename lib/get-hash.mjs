import jsSha from 'jssha';

// helper functions ===============
/**
 * converts a string + myEnvVar to hash
 * @param {string} input - string to be converted
 */
// eslint-disable-next-line import/prefer-default-export
export default function getHash(input) {
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
