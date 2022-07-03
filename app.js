'use strict';

const express = require('express');
const timeout = require('connect-timeout');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const AV = require('leanengine');

const app = express();

// Configures default timeout.
app.use(timeout('15s'));

// Loads LeanEngine middleware.
app.use(AV.express());

app.enable('trust proxy');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', function(req, res) {
  res.send({
    msg: 'hello world',
  })
});

app.use('/api', require('./api'));

app.use(function(req, res, next) {
  // If there is no routing answering, throw a 404 exception to exception handlers.
  if (!res.headersSent) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use(function(err, req, res, next) {
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // Ignores websocket timeout.
    return;
  }

  const statusCode = err.status || 500;
  if (statusCode === 500) {
    console.error(err.stack || err);
  }
  if (req.timedout) {
    console.error('Request timeout: url=%s, timeout=%d, please check whether its execution time is too long, or the response callback is invalid.', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // Do not output exception details by default.
  let error = {};
  if (app.get('env') === 'development') {
    // Displays exception stack on page if running in the development enviroment.
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

module.exports = app;
