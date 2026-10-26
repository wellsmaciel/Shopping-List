var express = require('express');
var path = require('path');
var logger = require('morgan');
const cors = require('cors');

const apiShoplistv2 = require('./routes/apiShoplistv2');
const { version } = require('./package.json');

var app = express();

app.use(cors());

if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/version', function (req, res) {
  res.status(200).json({ version });
});

app.use('/api/v2', apiShoplistv2);

// Unknown /api routes
app.use('/api', function (req, res) {
  res.status(404).json({ error: 'Route not found', code: 'not_found' });
});

// The single JSON error handler
app.use(function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body', code: 'invalid_json' });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: 'Internal server error', code: 'server_error' });
});

module.exports = app;
