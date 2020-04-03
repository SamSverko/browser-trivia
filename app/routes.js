// node
// const https = require('https')

// dependencies
require('dotenv').config()
// const NODE_ENV = process.env.NODE_ENV
// const apiGetProtocol = (NODE_ENV === 'production') ? require('https') : require('http')
// const HOST_PROTOCOL = (NODE_ENV === 'production') ? 'https' : 'http'
// const APP_HOST = process.env.APP_HOST
// const APP_PORT = process.env.APP_PORT
// const DB_COLLECTION_NAME = process.env.DB_COLLECTION_NAME
// const API_VERSION = process.env.API_VERSION
const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')

// local files
const DbController = require('./controllers/db.js')
// const constants = require('./constants.js')

// routes
router.get('/', (req, res) => {
  console.log(`${req.method} request for ${req.url}.`)

  res.render('index', {
    title: 'Home',
    currentPage: req.url,
    styles: [{ file: 'index' }]
  })
})

router.get('/host/:triviaId', (req, res, next) => {
  console.log(`${req.method} request for ${req.url}.`)

  DbController.findTrivia(req, res, next)
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

router.post('/host/:triviaId', [
  body('type').isString().isIn(['multipleChoice', 'picture', 'lightning']),
  body('theme').isString().trim().escape(),
  body('questions').isArray().notEmpty().optional(),
  body('questions.*.question').isString().notEmpty().trim().escape().optional(),
  body('questions.*.options.*').isString().notEmpty().trim().escape().optional(),
  body('questions.*.answer').toInt().isIn([0, 1, 2, 3]).optional(),
  body('pictures.*.url').isString().notEmpty().trim().escape().optional(),
  body('pictures.*.answer').isString().notEmpty().trim().escape().optional(),
  body('questions.*.lightningQuestion').isString().notEmpty().trim().escape().optional(),
  body('questions.*.lightningAnswer').isString().notEmpty().trim().escape().optional()
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

  if (req.query.addRound === 'multipleChoice' || req.query.addRound === 'picture' || req.query.addRound === 'lightning') {
    DbController.updateExistingTrivia(req, res, next)
  } else {
    res.send('unknown round type.')
  }
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