// dependencies
require('dotenv').config()
const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')

// local files
const DbController = require('./controllers/db.js')

// view routes (they return page views + data)
router.get('/', (req, res) => {
  console.log(`${req.method} request for ${req.url}.`)

  res.render('index', {
    title: 'Home',
    currentPage: req.url,
    styles: [{ file: 'index' }],
    scripts: [{ file: 'index' }]
  })
})

router.post('/join', [
  body('player-name').isString().notEmpty().trim().escape(),
  body('room-code').isString().notEmpty().trim().escape().isLength(4),
  body('player-uuid').isString().notEmpty().trim().escape().isLength(36)
], (req, res, next) => {
  console.log(`${req.method} request for ${req.url}.`)

  // return any errors
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const error = new Error()
    error.statusCode = 422
    error.message = `Form validation failed:<br /><pre><code>${JSON.stringify(validationErrors.array(), undefined, 2)}</code></pre>`
    return next(error)
  }

  DbController.joinTrivia(req, res, next)
})

router.get('/host', (req, res) => {
  console.log(`${req.method} request for ${req.url}.`)

  res.redirect('/')
})

router.post('/host', [
  body('host-index-name').isString().notEmpty().trim().escape(),
  body('host-index-submit').isString().notEmpty().trim().escape()
], (req, res, next) => {
  console.log(`${req.method} request for ${req.url}.`)

  // return any errors
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const error = new Error()
    error.statusCode = 422
    error.message = `Form validation failed:<br /><pre><code>${JSON.stringify(validationErrors.array(), undefined, 2)}</code></pre>`
    return next(error)
  }

  DbController.insertNewTrivia(req, res, next)
})

router.get('/host/:triviaId', (req, res, next) => {
  console.log(`${req.method} request for ${req.url}.`)

  if (req.query.removeRound) {
    DbController.removeRound(req, res, next)
  } else {
    DbController.findTrivia(req, res, next)
  }
})

router.post('/host/:triviaId', [
  body('type').isString().isIn(['multipleChoice', 'picture', 'lightning']).optional(),
  body('theme').isString().trim().escape().optional(),
  body('pointValue').toInt().optional(),
  body('questions').isArray().notEmpty().optional(),
  body('questions.*.question').isString().notEmpty().trim().escape().optional(),
  body('questions.*.options.*').isString().notEmpty().trim().escape().optional(),
  body('questions.*.answer').toInt().isIn([0, 1, 2, 3]).optional(),
  body('pictures.*.url').isString().notEmpty().trim().escape().optional(),
  body('pictures.*.answer').isString().notEmpty().trim().escape().optional(),
  body('questions.*.lightningQuestion').isString().notEmpty().trim().escape().optional(),
  body('questions.*.lightningAnswer').isString().notEmpty().trim().escape().optional(),
  body('tieBreaker.question').isString().notEmpty().trim().escape().optional(),
  body('tieBreaker.answer').trim().escape().toInt().notEmpty().optional(),
  body('triviaId').isString().notEmpty().trim().escape().isLength(4).optional()
], (req, res, next) => {
  console.log(`${req.method} request for ${req.url}.`)

  // return any errors
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const error = new Error()
    error.statusCode = 422
    error.message = `Form validation failed:<br /><pre><code>${JSON.stringify(validationErrors.array(), undefined, 2)}</code></pre>`
    return next(error)
  }

  if (req.query.addRound === 'multipleChoice' || req.query.addRound === 'picture' || req.query.addRound === 'lightning' || req.query.addRound === 'tieBreaker') {
    DbController.updateExistingTrivia(req, res, next)
  } else {
    res.redirect('/')
  }
})

// API routes (they return only data)
router.get('/lobby/:triviaId', (req, res, next) => {
  console.log(`${req.method} request for ${req.url}.`)

  DbController.getLobbyData(req, res, next)
})

router.post('/lobby/addPlayer', [
  body('name').isString().notEmpty().trim().escape(),
  body('uniqueId').isString().notEmpty().trim().escape().isLength(36),
  body('triviaId').isString().notEmpty().trim().escape().isLength(4)
], (req, res, next) => {
  console.log(`${req.method} request for ${req.url}.`)

  // return any errors
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const error = new Error()
    error.statusCode = 422
    error.message = `Form validation failed:<br /><pre><code>${JSON.stringify(validationErrors.array(), undefined, 2)}</code></pre>`
    return next(error)
  }

  DbController.addLobbyPlayer(req, res, next)
})

router.post('/lobby/removePlayer', [
  body('name').isString().notEmpty().trim().escape(),
  body('uniqueId').isString().notEmpty().trim().escape().isLength(36),
  body('triviaId').isString().notEmpty().trim().escape().isLength(4)
], (req, res, next) => {
  console.log(`${req.method} request for ${req.url}.`)

  // return any errors
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const error = new Error()
    error.statusCode = 422
    error.message = `Form validation failed:<br /><pre><code>${JSON.stringify(validationErrors.array(), undefined, 2)}</code></pre>`
    return next(error)
  }

  DbController.removeLobbyPlayer(req, res, next)
})

// server error handler test page
router.get('/error', (req, res, next) => {
  const error = new Error()
  error.statusCode = 418
  error.message = `User visited the secret ${req.url} test page.`
  next(error)
})

// 404 handler
router.get('*', (req, res) => {
  console.error(`GET request for nonexistent '${req.path}', resulting in a 404.`)

  res.render('error-404', {
    title: '404'
  })
})

module.exports = router
