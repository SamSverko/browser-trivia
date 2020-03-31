// dependencies
require('dotenv').config()

module.exports = {
  insertNewTrivia: async (req, res, next) => {
    req.app.db.collection(process.env.DB_COLLECTION_NAME).find({}).project({ _id: 0, triviaId: 1 }).toArray((error, result) => {
      if (error) {
        const error = new Error()
        error.statusCode = 400
        error.message = error
        next(error)
      }

      const existingTriviaIds = []
      result.forEach((item) => {
        existingTriviaIds.push(item.triviaId)
      })

      let currentTriviaId = ''
      const characters = 'abcdefghijklmnopqrstuvwxyz'
      const charactersLength = characters.length
      do {
        currentTriviaId = ''
        for (let i = 0; i < 4; i++) {
          currentTriviaId += characters.charAt(Math.floor(Math.random() * charactersLength))
        }
      } while (existingTriviaIds.includes(currentTriviaId))

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

        const returnedData = {
          triviaId: result.ops[0].triviaId,
          host: result.ops[0].host
        }

        res.render('host', {
          title: 'Host',
          data: returnedData,
          scripts: [{ file: 'host' }],
          styles: [{ file: 'host' }]
        })
      })
    })
  }
}
