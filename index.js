require('dotenv').config();

const PORT = process.env.PORT || 9015;
const http = require('http');
const https = require('https');
const querystring = require('querystring');

const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const axios = require('axios').create({
  //60 sec timeout
  timeout: 60000,
  //keepAlive pools and reuses TCP connections, so it's faster
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  //follow up to 10 HTTP 3xx redirects
  maxRedirects: 10
});
const { initIndex, getQuoteByWord } = require('./word-index');
const isProd = process.env.NODE_ENV === 'production';

// init the express app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression())
app.use(express.static('./public'));
initIndex();


// Do some logging
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Setup some endpoints
app.post('/ron', (req, res) => {
  // the request should have our slack verification token in it so we know it's coming from Slack
  if (isProd && req.body.token !== process.env.SLACK_VERIFICATION_TOKEN) {
    res.status(400).send(`Invalid request.`);
    return;
  }

  const quoteObj = getQuoteByWord(req.body.text);
  log(quoteObj, req);
  
  res.json({ 
    response_type: 'in_channel',
    text: quoteObj.quote
  });
});

// If the user authorizes your app, Slack will redirect back to your specified redirect_uri with a temporary code in a code GET parameter
app.get('/slack-oauth', (req, res) => {
  if(!req.query.code) {
    res.status(403).send(`Access denied.`);
    return;
  }

  // exchange temp auth code for access token that does not expires (unless user revokes it)
  getToken(req.query.code)
    .then(getTeamDomain)
    // redirect to their team slack
    .then(teamDomain => res.redirect(`http://${teamDomain}.slack.com`))
    .catch(err => {
      console.error(err.message);
      res.status(500).send(`Uh oh.`);
    });
  
});

function getToken(authCode) {
  const data = {
    client_id: process.env.SLACK_CLIENT_ID,
    client_secret: process.env.SLACK_CLIENT_SECRET,
    code: authCode
  };

  return axios.get(`https://slack.com/api/oauth.access?${querystring.stringify(data)}`)
    .then(response => {
      if (response.status === 200 && response.data.ok) {
        return response.data.access_token;
      } else {
        throw new Error(`Unable to get token: ${response.data.error}`);
      }
    });
}

function getTeamDomain(token) {
  return axios.get(`https://slack.com/api/team.info?token=${token}`)
    .then(response => {
      if (response.data.ok && response.data.team) {
        return response.data.team.domain;
      } else {
        throw new Error(`Unable to get team domain: ${response.data.error}`);
      }
    });
}

function log(quoteObj, req) {
  console.log(`Team domain: "${req.body.team_domain}", Channel name: "${req.body.channel_name}", User: "${req.body.user_name}", Date: ${new Date().toLocaleString()}`);
  console.log(JSON.stringify(quoteObj, null, 2));
}


// Start the server
http.createServer(app).listen(PORT);
console.log(`Server started on *:${PORT}`);
