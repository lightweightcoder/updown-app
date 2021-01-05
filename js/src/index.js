import './styles.scss';
import axios from 'axios';

// game initialisation =============
// make request for all items for gameplay of the ongoing game
axios.get('/games')
  .then((res) => {
    const gameData = res.data;
  })
  .catch((error) => {
    // handle error
    console.log('get game error', error);
  });

console.log('hello');
