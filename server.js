// node
const path = require('path')

// dependencies
require('dotenv').config()
const HOST = process.env.APP_HOST
const PORT = process.env.APP_PORT || 3000
const express = require('express')
const app = express()
const compression = require('compression')
const helmet = require('helmet')
const exphbs = require('express-handlebars')
const MongoClient = require('mongodb').MongoClient
const dbUrl = process.env.DB_URI

// local files
const router = require(path.join(__dirname, './app/routes'))

// helmet
app.use(helmet())

// enable gzip compression and urlencoded (for form submits)
app.use(compression())
app.use(express.urlencoded({ extended: true }))

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
app.listen(PORT, () => {
  console.log(`Server successfully started app, listening at ${HOST}:${PORT}.`)
})
