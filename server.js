// node
const path = require('path')
const httpPost = require('http')
const bodyParser = require('body-parser')

// dependencies
require('dotenv').config()
const HOST = process.env.APP_HOST
const PORT = process.env.APP_PORT || 3000
const express = require('express')
const app = express()
const cors = require('cors')
const http = require('http').createServer(app)
const io = require('socket.io')(http, { pingTimeout: 10000, pingInterval: 5000 })
const compression = require('compression')
const MongoClient = require('mongodb').MongoClient
const dbUrl = process.env.DB_URI
const helmet = require('helmet')
const exphbs = require('express-handlebars')

// local files
const router = require(path.join(__dirname, './app/routes'))

// helmet and cors
app.use(helmet())
app.use(cors())

// enable gzip compression, urlencoded (for form submits), and bodyParser for JSON posts
app.use(compression())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())

// web socket connection | socket.to = send to all but not sender | io.to = send to all including sender
io.on('connection', (socket) => {
  // join room based on triviaId
  const roomUrl = new URL(socket.handshake.headers.referer)
  const roomCode = roomUrl.searchParams.get('roomCode')
  socket.join(roomCode)
  // emitting events
  // a player joins the lobby
  socket.on('played joined', (player, playerId) => {
    console.log(`A player joined room ${roomCode}.`)
    io.to(roomCode).emit('player joined', player, playerId)
    // a player disconnects from the lobby
    socket.on('disconnect', (event) => {
      console.log(`${player} left room ${roomCode}.`)
      // send POST request to remove player from lobby db
      const postData = JSON.stringify({
        name: player,
        uniqueId: playerId,
        triviaId: roomCode
      })
      const filteredHost = socket.handshake.headers.host.substring(0, socket.handshake.headers.host.indexOf(':'))
      const options = {
        hostname: filteredHost,
        port: 3000,
        path: '/lobby/removePlayer',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      }
      const req = httpPost.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`)
        res.on('data', (d) => {
          process.stdout.write(d)
          io.to(roomCode).emit('player disconnected', player, playerId)
        })
        req.on('error', (error) => {
          console.error(error)
        })
      })
      req.write(postData)
      req.end()
    })
  })
  socket.on('host action', (data) => {
    io.to(roomCode).emit('host action', data) // CHANGE TO socket.to for actual testing
  })
  socket.on('player responded', (data) => {
    io.to(roomCode).emit('player responded', data) // CHANGE TO socket.to for actual testing
  })
})

// database connection
MongoClient.connect(dbUrl, {
  poolSize: 25, useUnifiedTopology: true, wtimeout: 2500
})
  .catch(error => {
    console.error(error.stack)
    process.exit(1)
  })
  .then(async client => {
    app.db = client.db(process.env.DB_NAME)
  })

// static files
app.use('/static', express.static(path.join(__dirname, 'app/public')))
app.set('views', path.join(__dirname, 'app/views'))

// view engine
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'app/views/layouts'),
  partialsDir: path.join(__dirname, 'app/views/partials'),
  helpers: {
    times: (n, block) => {
      let accum = ''
      for (var i = 0; i < n; ++i) {
        accum += block.fn(i)
      }
      return accum
    }
  }
})
app.engine('.hbs', hbs.engine)
app.set('view engine', '.hbs')

// routes
app.use('/', router)

// server error handler
app.use((error, req, res, next) => {
  if (!error.statusCode) error.statusCode = 500

  console.error(error)

  res.render('error-server', {
    layout: 'main',
    title: 'Server Error',
    errorData: error
  })
})

// app graceful stop
process.on('SIGINT', function () {
  console.log('SIGINT')
  process.exit(0)
})

// turn app listening on
http.listen(PORT, () => {
  console.log(`Server successfully started app, listening at ${HOST}:${PORT}.`)
})
