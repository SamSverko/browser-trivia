// dependencies
require('dotenv').config()

module.exports = {
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
          triviaId: currentTriviaId,
          host: req.body['host-index-name']
        }
        req.app.db.collection(process.env.DB_COLLECTION_NAME).insertOne(documentToInsert, (error, result) => {
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
  },
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
  updateExistingTrivia: async (req, res, next) => {
    const roundToInsert = {}
    roundToInsert.type = req.body.type
    roundToInsert.theme = (req.body.theme !== '') ? req.body.theme : 'none'
    roundToInsert.pointValue = (Number.isInteger(req.body.pointValue)) ? req.body.pointValue : 1
    if (req.query.addRound === 'multipleChoice') {
      roundToInsert.questions = req.body.questions
    } else if (req.query.addRound === 'picture') {
      roundToInsert.pictures = req.body.pictures
    } else if (req.query.addRound === 'lightning') {
      const fixedQuestionKeys = []
      for (let i = 0; i < req.body.questions.length; i++) {
        fixedQuestionKeys.push({
          question: req.body.questions[i].lightningQuestion,
          answer: req.body.questions[i].lightningAnswer
        })
      }
      roundToInsert.questions = fixedQuestionKeys
    } else if (req.query.addRound === 'tieBreaker') {
      const tieBreakerToInsert = {
        question: req.body.tieBreaker.question,
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
