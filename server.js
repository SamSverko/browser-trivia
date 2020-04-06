// node
const path = require('path')
const querystring = require('querystring')

// dependencies
require('dotenv').config()
const HOST = process.env.APP_HOST
const PORT = process.env.APP_PORT || 3000
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const compression = require('compression')
const MongoClient = require('mongodb').MongoClient
const dbUrl = process.env.DB_URI
const helmet = require('helmet')
const exphbs = require('express-handlebars')

// local files
const router = require(path.join(__dirname, './app/routes'))

// helmet
app.use(helmet())

// enable gzip compression and urlencoded (for form submits)
app.use(compression())
app.use(express.urlencoded({ extended: true }))

// web socket connection
io.on('connection', (socket) => {
  // join room based on triviaId
  const roomUrl = new URL(socket.handshake.headers.referer)
  const roomCode = roomUrl.searchParams.get('roomCode')
  socket.join(roomCode)
  console.log(`A player connected to room ${roomCode}.`)
  // emitting events
  socket.on('player event', (message) => {
    // socket.to = send to all but not sender | io.to = send to all including sender
    socket.to(roomCode).emit('player event', message)
  })
  // disconnect
  socket.on('disconnect', () => {
    console.log(`A player disconnected from room ${roomCode}.`)
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
