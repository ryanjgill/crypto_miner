const express = require('express')
const app = express()
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const ip = require('ip')
const Request = require('request-promise')
const config = require('./config')
const PORT = 3030
const SAVE_DELAY = 1000 * 10 // every 10 seconds
const serverIP = `${ip.address()}:${PORT}`
const r = require('rethinkdbdash')({
  host: config.rethinkdb.url, 
  port: config.rethinkdb.port,
  db: 'crypto_miner_monitor',
  user: config.rethinkdb.user,
  password: config.rethinkdb.password
})

let lastSaveTime = 0
let hashRates = {
  gill: 0,
  mdt: 0
}
let lastReading = {}

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(morgan('tiny'))

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public/index.html'))
  next()
})

app.get('/lastReading', (req, res, next) => {
  res.json(lastReading)
  next()
})

io.on('connection', client => {
  console.log('New client connected.')
  console.log('Total clients: ', io.engine.clientsCount)
  
  r.table('temperatures')
    .orderBy({ index: r.desc('date') })
    .limit(30)
    .run()
    .then(results => {
      client.emit('lastReadings', results)
    })
    .catch(err => {
      console.log(err)
      next()
    })

  client.on('resetRig', data => {
    console.log('resetRig: ', data)
  });

  client.on('disconnect', () => {
    console.log('client left.')
  });
});

// POST temperatures
app.post('/temperatures', (req, res, next) => {
  let body = JSON.parse(JSON.stringify(req.body))
  let reading = {
    case_temp: body.case_temp,
    date: new Date(),
    gpu_1_temp: body.gpu_1_temp,
    gpu_2_temp: body.gpu_2_temp,
    radiator_temp: body.radiator_temp,
    rig_name: body.rig_name,
    room_temp: body.room_temp,
    hashRate: hashRates.gill,
    gill_hash_rate: hashRates.gill,
    mdt_hash_rate: hashRates.mdt
  }

  lastReading = reading

  io.sockets.emit('reading', reading)

  if (new Date().getTime() - lastSaveTime > SAVE_DELAY) {
    r.table('temperatures').insert(reading).run()
      .then(function(result) {
        lastSaveTime = new Date().getTime()
        res.sendStatus(200)
        console.log('Reading saved.')
        next()
      })
      .catch(err => {
        console.log(err)
        res.sendStatus(500)
        next()
      });
  } else {
    res.sendStatus(200)
    next()
  }
})

let updateHashRate = (address, name) => {
  let options = {
    uri: `https://api.ethermine.org/miner/${address}/currentStats`,
    json: true
  };

  Request(options)
    .then(res => {
      // convert hash rate to Megahashes/second (Mh/s)
      hashRate = res.data.currentHashrate
        ? ((res.data.currentHashrate / 1000000).toFixed(1))
        : 0

      hashRates[name] = hashRate
      console.log(`${name} hashRate: ${hashRate} Mh/s`)
    })
    .catch(err => console.log(err))
}

// update hashrates every minute
setInterval(() => {
  updateHashRate(config.minerAddresses.gill, 'gill')
  updateHashRate(config.minerAddresses.mdt, 'mdt')
}, 1000 * 60)

updateHashRate(config.minerAddresses.gill, 'gill')
updateHashRate(config.minerAddresses.mdt, 'mdt')

server.listen(PORT, () => console.log(`API listening on ${serverIP}`))