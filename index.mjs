import express from 'express';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';

import routes from './routes.mjs';

const app = express();

app.use(cookieParser());

app.set('view engine', 'ejs');

// allow express to recognise incoming request object as strings or arrays
app.use(express.urlencoded({ extended: false }));

// allow express to recognise incoming request object as a JSON object
app.use(express.json());

app.use(express.static('public'));

app.use(methodOverride('_method'));

// set the routes
routes(app);

app.use(express.static('js/dist'));

const PORT = process.env.PORT || 3004;

app.listen(PORT);
