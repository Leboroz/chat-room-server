'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const session = require('express-session');
const passport = require('passport');

const app = express();

app.set('view engine', 'pug')
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.route('/').get((req, res) => {
  res.render(__dirname + '/views/pug', {title: 'Hello', message: 'Please login'});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
