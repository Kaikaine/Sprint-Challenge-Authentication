const axios = require('axios');
const bcrypt = require('bcryptjs');
const knex = require('knex')
const express = require('express');
const dbConfig = require('../knexfile')
const db = knex(dbConfig.development);
const server = express();
const jwt = require('jsonwebtoken')

const { authenticate } = require('./middlewares');
server.use(express.json());

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

const secret = 'Yonce'

function generateToken(user) {
  const payload = {
    username: user.username
  }

  const options = {
    expiresIn: '1h',
    jwtid: '54321'
  }

  const token = jwt.sign(payload, secret, options)
  return token
}

function register(req, res) {
  // implement user registration
  const creds = req.body

  const hash = bcrypt.hashSync(creds.password, 10)

  creds.password = hash

  db('users')
  .insert(creds)
  .then(ids => {
    const id = ids[0]

    db('users')
    .where({id})
    .first()
    .then(user => {
      const token = generateToken(user)
      res.status(201).json({id: user.id, token})
    }).catch(err => res.stats(500).send(err))

  }).catch(err => res.staus(500).json(err))
}

function login(req, res) {
  // implement user login
  const creds = req.body
  
  db('users')
  .where({username: creds.username})
  .first()
  .then(user => {
    if (user || bcrypt.compareSync(creds.password, user.password)) {
      const token = generateToken(user)
       res.status(200).json(`${name}, ${token}`)
    } else {
       res.status(401).json({error: 'Error'})
    }

  }).catch(err => res.status(500).json(err))
}

function getJokes(req, res) {
  axios
    .get(
      'https://08ad1pao69.execute-api.us-east-1.amazonaws.com/dev/random_ten'
    )
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
