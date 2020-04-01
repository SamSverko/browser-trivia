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
      }
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
        }
        // redirect to host home page
        res.redirect(`/host/${result.ops[0].triviaId}`)
      })
    })
  },
  findTrivia: async (req, res, next) => {
    req.app.db.collection(process.env.DB_COLLECTION_NAME).find({ triviaId: req.params.triviaId }).toArray((error, result) => {
      if (error) {
        const error = new Error()
        error.statusCode = 400
        error.message = error
        next(error)
      }

      res.render('host', {
        title: 'Host (TEST)',
        triviaData: JSON.stringify(result[0]),
        scripts: [{ file: 'host' }],
        styles: [{ file: 'host' }]
      })
    })
  }
}
