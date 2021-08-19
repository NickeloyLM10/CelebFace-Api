// const express = require('express');
// const bodyParser = require('body-parser');
// const bcrypt = require('bcrypt-nodejs');
// const cors = require('cors');
// const knex = require('knex');

// const register = require('./controller/register');
// const signin = require('./controller/signin');
// const profile = require('./controller/profile');
// const image = require('./controller/image');

// const db = knex({
//     client: 'pg',
//     connection: {
//       host : '127.0.0.1',
//       user : 'postgres',
//       password : '123',
//       database : 'CelebFace'
//     }
//   });


// const app = express();


// app.use(bodyParser.json());
// app.use(cors());

// app.get('/', (req , res)=> {
//     res.send(database.users);
// })

// app.post('/signin', (req, res) => {signin.handleSignin(req, res, db, bcrypt)})
// app.post('/register', (req, res) =>  {register.handleRegister(req, res, db, bcrypt)})
// app.get('/profile/:id', (req, res) => {profile.handleProfile(req, res, db)})
// app.put('/image', (req, res) => {image.handleImage(req, res, db)})
// app.post('/image', (req, res) => {image.handleApiCall(req, res)})


// app.listen(4000, ()=> {
//     console.log('app is running');
// })
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : '123',
    database : 'CelebFace'
  }
});

const app = express();

app.use(cors())
app.use(bodyParser.json());

app.get('/', (req, res)=> {
  res.send(database.userInfo);
})

app.post('/signin', (req, res) => {
  
  db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (isValid) {
        return db.select('*').from('userInfo')
          .where('email', '=', req.body.email)
          .then(user => {
            res.json(user[0])
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong credentials')
      }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
  const { email, name, password } = req.body;
  if(!email || !name || !password){
    return res.status(400).json('incorret form submission');
}
  const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
      trx.insert({
        hash: hash,
        email: email
      })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx('userInfo')
          .returning('*')
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
          })
          .then(user => {
            res.json(user[0]);
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  db.select('*').from('userInfo').where({id})
    .then(user => {
      if (user.length) {
        res.json(user[0])
      } else {
        res.status(400).json('Not found')
      }
    })
    .catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req, res) => {
  const { id } = req.body;
  db('userInfo').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    res.json(entries[0]);
  })
  .catch(err => res.status(400).json('unable to get entries'))
})

app.listen(4000, ()=> {
  console.log('app is running on port 4000');
})