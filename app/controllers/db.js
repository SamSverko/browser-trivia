// dependencies
require('dotenv').config()

module.exports = {
  findTrivia: async (req, res, next) => {
    req.app.db.collection(process.env.DB_COLLECTION_NAME).find({ triviaId: req.params.triviaId }).toArray((error, result) => {
      if (error) {
        const error = new Error()
        error.statusCode = 400
        error.message = error
        next(error)
      } else if (result.length !== 1) {
        const error = new Error()
        error.statusCode = 400
        error.message = 'Trivia not found, please try a different room code.'
        next(error)
      } else {
        res.render('host', {
          title: 'Host (TEST)',
          triviaData: JSON.stringify(result[0]),
          scripts: [{ file: 'host' }],
          styles: [{ file: 'host' }]
        })
      }
    })
  },
  getAllResponsesForQuestion: async (req, res, next) => {
    req.app.db.collection(process.env.DB_COLLECTION_NAME_2).find({ triviaId: req.body.triviaId }).toArray((error, result) => {
      if (error) {
        const error = new Error()
        error.statusCode = 400
        error.message = error
        next(error)
      } else if (result.length !== 1) {
        res.send('Responses not found')
      } else {
        const filteredQuestions = []
        result[0].responses.forEach((response) => {
          if (response.roundNumber === req.body.roundNumber && response.questionNumber === req.body.questionNumber) {
            filteredQuestions.push(response)
          }
        })
        res.send(filteredQuestions)
      }
    })
  },
  getLobbyData: async (req, res, next) => {
    req.app.db.collection(process.env.DB_COLLECTION_NAME_2).find({ triviaId: req.params.triviaId }).toArray((error, result) => {
      if (error) {
        const error = new Error()
        error.statusCode = 400
        error.message = error
        next(error)
      } else if (result.length !== 1) {
        const error = new Error()
        error.statusCode = 400
        error.message = 'Lobby not found, please try a different room code.'
        next(error)
      } else {
        res.send(result[0])
      }
    })
  },
  getPlayerQuestionResponse: async (req, res, next) => {
    req.app.db.collection(process.env.DB_COLLECTION_NAME_2).find({
      triviaId: req.body.triviaId,
      'responses.name': req.body.name.toLowerCase(),
      'responses.uniqueId': req.body.uniqueId.toLowerCase(),
      'responses.roundNumber': req.body.roundNumber,
      'responses.questionNumber': req.body.questionNumber
    }).toArray((error, result) => {
      if (error) {
        const error = new Error()
        error.statusCode = 400
        error.message = error
        next(error)
      } else if (result.length !== 1) {
        res.send('Response not found.')
      } else {
        result[0].responses.forEach((response) => {
          if (response.name === req.body.name && response.uniqueId === req.body.uniqueId && response.roundNumber === req.body.roundNumber && response.questionNumber === req.body.questionNumber) {
            res.send({ response: response.response })
          }
        })
      }
    })
  },
  insertNewTrivia: async (req, res, next) => {
    // retrieve all existing triviaIds
    req.app.db.collection(process.env.DB_COLLECTION_NAME).find({}).project({ _id: 0, triviaId: 1 }).toArray((error, result) => {
      if (error) {
        const error = new Error()
        error.statusCode = 400
        error.message = error
        next(error)
      } else {
        // push result array of objects into array of triviaIds
        const existingTriviaIds = []
        result.forEach((item) => {
          existingTriviaIds.push(item.triviaId)
        })
        // generate a triviaId that does not match any already-existing triviaIds
        let currentTriviaId = ''
        const characters = 'abcdefghijklmnopqrstuvwxyz'
        const charactersLength = characters.length
        do {
          currentTriviaId = ''
          for (let i = 0; i < 4; i++) {
            currentTriviaId += characters.charAt(Math.floor(Math.random() * charactersLength))
          }
        } while (existingTriviaIds.includes(currentTriviaId))
        // insert new trivia into database
        const documentToInsert = {
          createdAt: new Date().toISOString(),
          triviaId: currentTriviaId.toLowerCase(),
          host: req.body['host-index-name'].toLowerCase()
        }
        // insert new trivia document
        req.app.db.collection(process.env.DB_COLLECTION_NAME).insertOne(documentToInsert, (error, result) => {
          if (error) {
            const error = new Error()
            error.statusCode = 400
            error.message = error
            next(error)
          } else {
            // insert associated lobby with newly inserted trivia document
            const lobbyToInsert = {
              createdAt: new Date().toISOString(),
              triviaId: currentTriviaId.toLowerCase(),
              host: req.body['host-index-name'].toLowerCase(),
              players: [],
              responses: []
            }
            req.app.db.collection(process.env.DB_COLLECTION_NAME_2).insertOne(lobbyToInsert, (error, result) => {
              if (error) {
                const error = new Error()
                error.statusCode = 400
                error.message = error
                next(error)
              } else {
                res.redirect(`/host/${result.ops[0].triviaId}`)
              }
            })
          }
        })
      }
    })
  },
  joinTrivia: async (req, res, next) => {
    const triviaToJoin = req.body['room-code'].toLowerCase()
    const playerName = req.body['player-name'].toLowerCase()
    const playerUuid = req.body['player-uuid'].toLowerCase()
    const isHost = (req.body['is-host'] === 'true')
    req.app.db.collection(process.env.DB_COLLECTION_NAME_2).find({ triviaId: triviaToJoin }).toArray((error, result) => {
      if (error) {
        const error = new Error()
        error.statusCode = 400
        error.message = error
        next(error)
      } else if (result.length !== 1) {
        res.redirect('/?triviaNotFound=true')
      } else {
        const lobbyData = JSON.stringify(result[0])
        if (!isHost && result[0].players.length > 0) {
          req.app.db.collection(process.env.DB_COLLECTION_NAME_2).updateOne({ triviaId: triviaToJoin },
            {
              $addToSet: {
                players: {
                  name: playerName,
                  uniqueId: playerUuid
                }
              }
            }, (error, result) => {
              if (error) {
                const error = new Error()
                error.statusCode = 400
                error.message = error
                next(error)
              } else {
                res.render('lobby', {
                  title: 'Lobby',
                  triviaData: false,
                  lobbyData: lobbyData,
                  playerName: playerName,
                  scripts: [{ file: 'lobby' }],
                  styles: [{ file: 'lobby' }]
                })
              }
            })
        } else if (isHost) {
          req.app.db.collection(process.env.DB_COLLECTION_NAME).find({ triviaId: triviaToJoin }).toArray((error, result) => {
            if (error) {
              const error = new Error()
              error.statusCode = 400
              error.message = error
              next(error)
            } else if (result.length !== 1) {
              const error = new Error()
              error.statusCode = 400
              error.message = 'Trivia not found, please try a different room code.'
              next(error)
            } else {
              res.render('lobby', {
                title: 'Lobby',
                triviaData: JSON.stringify(result[0]),
                lobbyData: lobbyData,
                playerName: playerName,
                scripts: [{ file: 'lobby' }],
                styles: [{ file: 'lobby' }]
              })
            }
          })
        } else {
          res.redirect('/?lobbyNotReady=true')
        }
      }
    })
  },
  addLobbyPlayer: async (req, res, next) => {
    const triviaToJoin = req.body.triviaId.toLowerCase()
    const playerName = req.body.name.toLowerCase()
    const playerUuid = req.body.uniqueId.toLowerCase()
    req.app.db.collection(process.env.DB_COLLECTION_NAME_2).find({
      triviaId: triviaToJoin,
      'players.name': playerName,
      'players.uniqueId': playerUuid
    }).toArray((error, result) => {
      if (error) {
        const error = new Error()
        error.statusCode = 400
        error.message = error
        next(error)
      } else if (result.length !== 1) {
        // insert player that was removed
        req.app.db.collection(process.env.DB_COLLECTION_NAME_2).updateOne({ triviaId: triviaToJoin },
          {
            $addToSet: {
              players: {
                name: playerName,
                uniqueId: playerUuid
              }
            }
          }, (error, result) => {
            if (error) {
              const error = new Error()
              error.statusCode = 400
              error.message = error
              next(error)
            } else {
              res.send('Ok')
            }
          })
      } else {
        // do not insert player because they already exist
        res.send('ok')
      }
    })
  },
  removeLobbyPlayer: async (req, res, next) => {
    req.app.db.collection(process.env.DB_COLLECTION_NAME_2).updateOne({ triviaId: req.body.triviaId },
      {
        $pull: { players: { name: req.body.name.toLowerCase(), uniqueId: req.body.uniqueId.toLowerCase() } }
      }, (error, result) => {
        if (error) {
          const error = new Error()
          error.statusCode = 400
          error.message = error
          next(error)
        } else {
          res.send('ok')
        }
      })
  },
  removeRound: async (req, res, next) => {
    const roundToRemove = `rounds.${req.query.removeRound}`
    req.app.db.collection(process.env.DB_COLLECTION_NAME).updateOne({ triviaId: req.params.triviaId },
      {
        $unset: {
          [roundToRemove]: 1
        }
      }, (error, result) => {
        if (error) {
          const error = new Error()
          error.statusCode = 400
          error.message = error
          next(error)
        } else {
          req.app.db.collection(process.env.DB_COLLECTION_NAME).updateOne({ triviaId: req.params.triviaId },
            {
              $pull: {
                rounds: null
              }
            }, (error, result) => {
              if (error) {
                const error = new Error()
                error.statusCode = 400
                error.message = error
                next(error)
              } else {
                res.redirect(`/host/${req.params.triviaId}`)
              }
            })
        }
      })
  },
  savePlayerResponse: async (req, res, next) => {
    const playerResponse = (isNaN(req.body.response.response)) ? req.body.response.response.toLowerCase() : parseInt(req.body.response.response)
    req.app.db.collection(process.env.DB_COLLECTION_NAME_2).updateOne({ triviaId: req.body.player.triviaId },
      {
        $pull: {
          responses: {
            name: req.body.player.name.toLowerCase(),
            uniqueId: req.body.player.uniqueId.toLowerCase(),
            roundNumber: req.body.response.roundNumber,
            questionNumber: req.body.response.questionNumber
          }
        }
      }, (error, result) => {
        if (error) {
          const error = new Error()
          error.statusCode = 400
          error.message = error
          next(error)
        } else {
          req.app.db.collection(process.env.DB_COLLECTION_NAME_2).updateOne({ triviaId: req.body.player.triviaId },
            {
              $addToSet: {
                responses: {
                  name: req.body.player.name.toLowerCase(),
                  uniqueId: req.body.player.uniqueId.toLowerCase(),
                  roundNumber: req.body.response.roundNumber,
                  questionNumber: req.body.response.questionNumber,
                  response: playerResponse
                }
              }
            }, (error, result) => {
              if (error) {
                const error = new Error()
                error.statusCode = 400
                error.message = error
                next(error)
              } else {
                res.send(req.body)
              }
            })
        }
      })
  },
  updateExistingTrivia: async (req, res, next) => {
    const roundToInsert = {}
    roundToInsert.type = req.body.type
    roundToInsert.pointValue = (Number.isInteger(req.body.pointValue)) ? req.body.pointValue : 1
    if (req.query.addRound === 'multipleChoice') {
      roundToInsert.questions = []
      for (let i = 0; i < req.body.questions.length; i++) {
        const options = []
        for (let j = 0; j < req.body.questions[i].options.length; j++) {
          options.push(req.body.questions[i].options[j].toLowerCase())
        }
        roundToInsert.questions.push({
          question: req.body.questions[i].question.toLowerCase(),
          options: options,
          answer: req.body.questions[i].answer
        })
      }
    } else if (req.query.addRound === 'picture') {
      roundToInsert.pictures = []
      for (let i = 0; i < req.body.pictures.length; i++) {
        roundToInsert.pictures.push({
          url: req.body.pictures[i].url,
          answer: req.body.pictures[i].answer.toLowerCase()
        })
      }
    } else if (req.query.addRound === 'lightning') {
      const fixedQuestionKeys = []
      for (let i = 0; i < req.body.questions.length; i++) {
        fixedQuestionKeys.push({
          question: req.body.questions[i].lightningQuestion.toLowerCase(),
          answer: req.body.questions[i].lightningAnswer.toLowerCase()
        })
      }
      roundToInsert.questions = fixedQuestionKeys
    } else if (req.query.addRound === 'tieBreaker') {
      const tieBreakerToInsert = {
        question: req.body.tieBreaker.question.toLowerCase(),
        answer: req.body.tieBreaker.answer
      }
      req.app.db.collection(process.env.DB_COLLECTION_NAME).updateOne({ triviaId: req.params.triviaId },
        {
          $set: {
            tieBreaker: tieBreakerToInsert
          }
        }, (error, result) => {
          if (error) {
            const error = new Error()
            error.statusCode = 400
            error.message = error
            next(error)
          } else {
            res.redirect(`/host/${req.params.triviaId}`)
          }
        })
    }

    if (req.query.addRound !== 'tieBreaker') {
      roundToInsert.theme = (req.body.theme !== '') ? req.body.theme.toLowerCase() : 'none'
      req.app.db.collection(process.env.DB_COLLECTION_NAME).updateOne({ triviaId: req.params.triviaId },
        {
          $push: {
            rounds: roundToInsert
          }
        }, (error, result) => {
          if (error) {
            const error = new Error()
            error.statusCode = 400
            error.message = error
            next(error)
          } else {
            res.redirect(`/host/${req.params.triviaId}`)
          }
        })
    }
  }
}
