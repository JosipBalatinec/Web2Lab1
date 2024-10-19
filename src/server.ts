import express, {Express} from 'express';
import path from 'path';
import dotenv from 'dotenv';
import {Client} from 'pg';
import indexRouter from './routes/index';
import generateRouter from './routes/generate-ticket';
import detailsRouter from './routes/ticket-details';
import axios from 'axios';
import fs from 'fs';
import https from 'https';

const app: Express = express();
dotenv.config();

app.set("views", path.join(__dirname, '../views'));
app.set("view engine", "ejs");
app.use('/scripts', express.static(path.join(__dirname, '/scripts')));
app.use('/styles', express.static(path.join(__dirname, '../styles')));
app.use(express.json());

const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: 5432,
    ssl: true
});

client.connect()
    .then(() => console.log("Spojena baza."))
    .catch(err => console.error("Greška: ", err));

const { auth } = require('express-openid-connect');


const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4080;


const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: externalUrl || `https://localhost:${port}`,
  clientID: process.env.AUTH0_CLIENT_ID1,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  routes: {
    login: false,
  },
};

app.use(auth(config));

if (externalUrl) {
  const hostname = '0.0.0.0'; //ne 127.0.0.1
  app.listen(port, hostname, () => {
  console.log(`Server locally running at http://${hostname}:${port}/ and from
  outside on ${externalUrl}`);
  });
}
else {
  https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
  }, app)
  .listen(port, function () {
  console.log(`Server running at https://localhost:${port}/`);
  });
}

async function getAccessToken() {
  const options = {
    method: 'POST',
    url: process.env.AUTH0_TOKEN_URL,
    headers: { 'content-type': 'application/json' },
    data: {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
      grant_type: 'client_credentials'
    }
  };

  try  {
    const response = await axios(options);
    return response.data.access_token;
  } catch (error) {
    console.error('Greška s tokenom: ', error);
    throw error;
  }
}  

app.use('/home', indexRouter);
app.use('/generate-ticket', generateRouter);
app.use('/ticket-details', detailsRouter);

app.get('/login', (req, res) => {
  res.oidc.login({ returnTo: '/home' }); 
});

app.get('/', (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    res.redirect('/home');  
  }
});

app.get('/get-token', async (req, res) => {
  try {
      const accessToken = await getAccessToken(); 
      res.json({ access_token: accessToken });
  } catch (error) {
      res.status(500).send('Greška s tokenom.');
  }
});

export {client};
export {getAccessToken};
