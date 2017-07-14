require('dotenv').config();

const PORT = process.env.PORT || 9015;
const http = require('http');

const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { initIndex, getQuoteByWord } = require('./word-index');

// init the express app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
initIndex();


// Do some logging
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Setup some endpoints
app.post('/', (req, res) => {
  // the request should have our slack verification token in it so we know it's coming from Slack
  if (req.body.token !== process.env.SLACK_VERIFICATION_TOKEN) {
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

function log(quoteObj, req) {
  console.log(`Team domain: "${req.body.team_domain}", Channel name: "${req.body.channel_name}", User: "${req.body.user_name}"`);
  console.log(JSON.stringify(quoteObj, null, 2));
}

http.createServer(app).listen(PORT);
console.log(`Server started on *:${PORT}`);
