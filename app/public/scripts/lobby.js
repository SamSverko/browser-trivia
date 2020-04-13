/* global triviaData, lobbyData, playerName, io, fetch, XMLHttpRequest */

const socket = io()
let hostCurrentQuestionDisplaying = ''
let isLeaderboardVisible = false

document.addEventListener('DOMContentLoaded', () => {
  // console.log(triviaData)
  // console.log(lobbyData)
  console.log('DOMContentLoaded()')
  // update page title display
  document.getElementById('infoTriviaHost').innerHTML = lobbyData.host
  document.getElementById('infoTriviaId').innerHTML = lobbyData.triviaId

  // web socket
  socket.heartbeatTimeout = 10000

  // socket to everyone that this player has joined
  const playerId = window.localStorage.getItem('playerId')
  socket.emit('played joined', playerName, playerId)

  // post user to db in case user disconnected properly, but was not added back to the lobby db
  participantPostToDb(playerName, playerId)

  // when a player joins the lobby
  socket.on('player joined', (playerName, playerId) => {
    window.setTimeout(() => {
      console.log(`${playerName}, ${playerId} joined the lobby!`)
      getLobbyData()
      if (hostCurrentQuestionDisplaying !== 'test') {
        hostPerformAction(hostCurrentQuestionDisplaying)
      }
    }, 2000)
  })

  // when a player leaves the lobby
  socket.on('player disconnected', (playerName, playerId) => {
    console.log(`${playerName}, ${playerId} left the lobby!`)
    getLobbyData()
  })

  // when the player submits a response
  socket.on('player responded', (responseData) => {
    if (triviaData) {
      if (responseData.response.roundType === 'tieBreaker') {
        console.log(`${responseData.player.name} responded to the Tie Breaker`)
        document.getElementById('hostTieBreakerToggleDisplay').click()
      } else {
        console.log(`${responseData.player.name} responded to Round ${responseData.response.roundNumber}, question ${responseData.response.questionNumber}`)
        document.getElementById(`hostRound${responseData.response.roundNumber}Question${responseData.response.questionNumber}ToggleDisplay`).click()
      }
    }
  })

  // when the host updates something
  socket.on('host action', (data) => {
    playerDisplayHostAction(data)
  })

  // display content based on participant type (host or player)
  participantDisplayContent()

  // to fix stupid standard js linting error
  hostPerformAction('test')
  playerRecordResponse()
  hostMarkQuestion()
  toggleLeaderboardDisplay()
}, false)

function convertMultipleNumberResponseToLetter (responseNumber) {
  let returnedLetter = 'A'
  if (responseNumber === 1) {
    returnedLetter = 'B'
  } else if (responseNumber === 2) {
    returnedLetter = 'C'
  } else if (responseNumber === 3) {
    returnedLetter = 'D'
  }
  return returnedLetter
}

function getLobbyData (reason, roundNumber) {
  (async () => {
    fetch(`${window.location.origin}/lobby/${lobbyData.triviaId}`)
      .then((response) => {
        if (response.ok) { return response.json() }
        return Promise.reject(response)
      }).then((data) => {
        console.log('getLobbyData()')
        lobbyData = data
        if (reason === 'leaderboard') {
          populateLeaderboard()
        } else if (reason === 'marking') {
          hostMarkRound(roundNumber)
        } else {
          displayLobbyData(data)
        }
      }).catch((error) => {
        console.warn('Something went wrong.', error)
      })
  })()
}

function displayLobbyData (lobbyData) {
  console.log('displayLobbyData()')
  const lobbyList = document.querySelector('.lobby__players')
  lobbyList.innerHTML = ''
  let htmlToInsert = ''
  lobbyData.players.forEach((player) => {
    htmlToInsert += `
      <li>${player.name}</li>
    `
  })
  lobbyList.insertAdjacentHTML('beforeend', htmlToInsert)
}

function participantDisplayContent () {
  console.log('participantDisplayContent()')
  if (triviaData) {
    // display host content
    document.querySelector('.lobby__host').style.display = 'block'
    document.querySelector('.lobby__player').style.display = 'block'
    document.querySelector('.lobby__player__waiting').style.display = 'block'

    // populate round select display
    let htmlToInsert = ''
    for (let i = 0; i < triviaData.rounds.length; i++) {
      htmlToInsert += `
        <div class="lobby__host__round-play__round" id="hostPlayRound${i}">Play Round ${i + 1}</div>
        <div class="lobby__host__round-mark__round" id="hostMarkRound${i}">Mark Round ${i + 1}</div>
      `
    }
    htmlToInsert += `
      <div class="lobby__host__round-play__round" id="hostPlayTieBreaker">Play Tie Breaker</div>
      <div class="lobby__host__round-mark__round" id="hostMarkTieBreaker">Mark Tie Breaker</div>
      <div class="lobby__host__toggle-leaderboard" onClick="toggleLeaderboardDisplay(this, 'toggle')">Display Leaderboard</div>
    `
    document.querySelector('.lobby__host__round-select').insertAdjacentHTML('beforeend', htmlToInsert)
    const roundPlayButtons = document.querySelectorAll('.lobby__host__round-play__round')
    roundPlayButtons.forEach((button) => {
      button.addEventListener('click', hostDisplayPlayRoundButton)
    })
    const roundMarkButtons = document.querySelectorAll('.lobby__host__round-mark__round')
    roundMarkButtons.forEach((button) => {
      button.addEventListener('click', hostDisplayMarkRoundButton)
    })
  } else {
    playerDisplayHomeScreen()
  }
}

function participantPostToDb (name, uniqueId) {
  console.log('participantPostToDb()')
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      getLobbyData()
    }
  }
  xhttp.open('POST', '/lobby/addPlayer', true)
  xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8')
  xhttp.send(JSON.stringify({ name: name, uniqueId: uniqueId, triviaId: lobbyData.triviaId }))
}

function populateLeaderboard () {
  console.log('populateLeaderboard()')
  console.log(lobbyData)
}

function hostDisplayRound (roundNumber) {
  console.log('hostDisplayRound()')
  // hide marking round
  const roundMarkContainer = document.querySelector('.lobby__host__round-marking')
  roundMarkContainer.innerHTML = ''
  // display playing round
  const roundContainer = document.querySelector('.lobby__host__round-display')
  roundContainer.innerHTML = ''
  let htmlToInsert = ''
  if (triviaData.rounds[roundNumber].type === 'multipleChoice') {
    htmlToInsert += `
    <p>Round ${roundNumber + 1}</p>
    <p>Type: Multiple Choice</p>
    <p>Theme: ${triviaData.rounds[roundNumber].theme}</p>
    <p>Point Value: ${triviaData.rounds[roundNumber].pointValue}</p>
    <p>Select a question to show the players.</p>
    <div class="lobby__host__round-display__questions">
    `
    for (let i = 0; i < triviaData.rounds[roundNumber].questions.length; i++) {
      htmlToInsert += `
        <div class="lobby__host__round-display__questions__question">
          <div class="lobby__host__round-display__questions__question__left">
            <p>${i + 1}) ${triviaData.rounds[roundNumber].questions[i].question}</p>
            <ul>
              <li>A) ${triviaData.rounds[roundNumber].questions[i].options[0]}</li>
              <li>B) ${triviaData.rounds[roundNumber].questions[i].options[1]}</li>
              <li>C) ${triviaData.rounds[roundNumber].questions[i].options[2]}</li>
              <li>D) ${triviaData.rounds[roundNumber].questions[i].options[3]}</li>
            </ul>
            <p>Answer: ${triviaData.rounds[roundNumber].questions[i].answer}</p>
          </div>
          <div class="lobby__host__round-display__questions__question__right" id="hostRound${roundNumber}Question${i}ToggleDisplay" onClick="hostPerformAction(this)">
            Hidden
          </div>
          <div class="lobby__host__round-display__questions__question__player-responses">
            <p>Players left to respond:</p>
            <p id="hostPlayersYetToResponseRound${roundNumber}Question${i}"></p>
          </div>
        </div>
      `
    }
    htmlToInsert += `
      </div>
    `
  } else if (triviaData.rounds[roundNumber].type === 'picture') {
    htmlToInsert += `
    <p>Round ${roundNumber + 1}</p>
    <p>Type: Picture</p>
    <p>Theme: ${triviaData.rounds[roundNumber].theme}</p>
    <p>Point Value: ${triviaData.rounds[roundNumber].pointValue}</p>
    <p>Select a picture to show the players.</p>
    <div class="lobby__host__round-display__questions">
    `
    for (let i = 0; i < triviaData.rounds[roundNumber].pictures.length; i++) {
      htmlToInsert += `
        <div class="lobby__host__round-display__questions__question">
          <div class="lobby__host__round-display__questions__question__left">
            <p>${i + 1})</p>
            <img src="${triviaData.rounds[roundNumber].pictures[i].url}" />
            <p>Answer: ${triviaData.rounds[roundNumber].pictures[i].answer}</p>
          </div>
          <div class="lobby__host__round-display__questions__question__right" id="hostRound${roundNumber}Question${i}ToggleDisplay" onClick="hostPerformAction(this)">
            Hidden
          </div>
          <div class="lobby__host__round-display__questions__question__player-responses">
            <p>Players left to respond:</p>
            <p id="hostPlayersYetToResponseRound${roundNumber}Question${i}"></p>
          </div>
        </div>
      `
    }
    htmlToInsert += `
      </div>
    `
  } else if (triviaData.rounds[roundNumber].type === 'lightning') {
    htmlToInsert += `
    <p>Round ${roundNumber + 1}</p>
    <p>Type: Lightning</p>
    <p>Theme: ${triviaData.rounds[roundNumber].theme}</p>
    <p>Point Value: ${triviaData.rounds[roundNumber].pointValue}</p>
    <p>Select a question to show the players.</p>
    <div class="lobby__host__round-display__questions">
    `
    for (let i = 0; i < triviaData.rounds[roundNumber].questions.length; i++) {
      htmlToInsert += `
        <div class="lobby__host__round-display__questions__question">
          <div class="lobby__host__round-display__questions__question__left">
            <p>${i + 1}) ${triviaData.rounds[roundNumber].questions[i].question}</p>
            <p>Answer: ${triviaData.rounds[roundNumber].questions[i].answer}</p>
          </div>
          <div class="lobby__host__round-display__questions__question__right" id="hostRound${roundNumber}Question${i}ToggleDisplay" onClick="hostPerformAction(this)">
            Hidden
          </div>
          <div class="lobby__host__round-display__questions__question__player-responses">
            <p>Players left to respond:</p>
            <p id="hostPlayersYetToResponseRound${roundNumber}Question${i}"></p>
          </div>
        </div>
      `
    }
    htmlToInsert += `
      </div>
    `
  } else {
    htmlToInsert += `
      <p>Error</p>
    `
  }
  roundContainer.insertAdjacentHTML('beforeend', htmlToInsert)
}

function hostDisplayMarkRoundButton (event) {
  console.log('hostDisplayMarkRoundButton()')
  // update round display button style
  const roundPlayButtons = document.querySelectorAll('.lobby__host__round-play__round')
  roundPlayButtons.forEach((button) => {
    button.classList.remove('lobby__host__round-play__round--active')
  })
  const roundMarkButtons = document.querySelectorAll('.lobby__host__round-mark__round')
  roundMarkButtons.forEach((button) => {
    button.classList.remove('lobby__host__round-play__round--active')
  })
  toggleLeaderboardDisplay('hide')
  document.getElementById(event.target.id).classList.add('lobby__host__round-play__round--active')
  // display round
  if (event.target.id === 'hostMarkTieBreaker') {
    hostMarkTieBreaker()
  } else {
    const round = parseInt(event.target.id.charAt(event.target.id.length - 1))
    getLobbyData('marking', round)
  }
}

function hostDisplayPlayRoundButton (event) {
  console.log('hostDisplayPlayRoundButton()')
  // update round display button style
  const roundPlayButtons = document.querySelectorAll('.lobby__host__round-play__round')
  roundPlayButtons.forEach((button) => {
    button.classList.remove('lobby__host__round-play__round--active')
  })
  const roundMarkButtons = document.querySelectorAll('.lobby__host__round-mark__round')
  roundMarkButtons.forEach((button) => {
    button.classList.remove('lobby__host__round-play__round--active')
  })
  toggleLeaderboardDisplay('hide')
  document.getElementById(event.target.id).classList.add('lobby__host__round-play__round--active')
  // display round
  if (event.target.id === 'hostPlayTieBreaker') {
    hostDisplayTieBreaker()
  } else {
    const round = parseInt(event.target.id.charAt(event.target.id.length - 1))
    hostDisplayRound(round)
  }
}

function hostDisplayTieBreaker () {
  console.log('hostDisplayTieBreaker()')
  const roundContainer = document.querySelector('.lobby__host__round-display')
  roundContainer.innerHTML = ''
  const htmlToInsert = `
    <p>Tie Breaker</p>
    <div class="lobby__host__round-display__questions__question">
      <div class="lobby__host__round-display__questions__question__left">
        <p>Q) ${triviaData.tieBreaker.question}</p>
        <p>A) ${triviaData.tieBreaker.answer}</p>
      </div>
      <div class="lobby__host__round-display__questions__question__right" id="hostTieBreakerToggleDisplay" onClick="hostPerformAction(this)">
        Hidden
      </div>
      <div class="lobby__host__round-display__questions__question__player-responses">
        <p>Players left to respond:</p>
        <p id="hostPlayersYetToResponseRoundTieBreaker"></p>
      </div>
    </div>
  `
  roundContainer.insertAdjacentHTML('beforeend', htmlToInsert)
}

function hostMarkRound (roundNumber) {
  console.log('hostMarkRound()')
  // hide playing round
  const roundPlayContainer = document.querySelector('.lobby__host__round-display')
  roundPlayContainer.innerHTML = ''
  // display marking round
  const roundMarkContainer = document.querySelector('.lobby__host__round-marking')
  roundMarkContainer.innerHTML = ''
  let htmlToInsert = `
    <table>
      <tr>
        <th>Player answer</th>
        <th>Mark</th>
      </tr>
  `
  const roundReponses = []
  lobbyData.responses.forEach((response) => {
    if (response.roundNumber === roundNumber) {
      roundReponses.push(response)
    }
  })
  console.log(roundReponses)
  const questionsOrPictures = (triviaData.rounds[roundNumber].type === 'multipleChoice' || triviaData.rounds[roundNumber].type === 'lightning') ? 'questions' : 'pictures'
  for (let i = 0; i < triviaData.rounds[roundNumber][questionsOrPictures].length; i++) {
    if (triviaData.rounds[roundNumber].type === 'multipleChoice') {
      htmlToInsert += `
        <tr>
          <th>Q${i + 1}: ${triviaData.rounds[roundNumber][questionsOrPictures][i].question}</th>
          <th>A: ${convertMultipleNumberResponseToLetter(triviaData.rounds[roundNumber][questionsOrPictures][i].answer)}</th>
        </tr>
      `
    } else if (triviaData.rounds[roundNumber].type === 'picture') {
      htmlToInsert += `
        <tr>
          <th>Image ${i + 1}</th>
          <th>A: ${triviaData.rounds[roundNumber][questionsOrPictures][i].answer}</th>
        </tr>
      `
    } else if (triviaData.rounds[roundNumber].type === 'lightning') {
      htmlToInsert += `
        <tr>
          <th>Q${i + 1}: ${triviaData.rounds[roundNumber][questionsOrPictures][i].question}</th>
          <th>A: ${triviaData.rounds[roundNumber][questionsOrPictures][i].answer}</th>
        </tr>
      `
    }
    for (let j = 0; j < roundReponses.length; j++) {
      if (roundReponses[j].questionNumber === i) {
        if (triviaData.rounds[roundNumber].type === 'multipleChoice') {
          htmlToInsert += `
            <tr>
              <td>${convertMultipleNumberResponseToLetter(roundReponses[j].response)}</td>
              <td class="text-align__center"><span class="lobby__host__round-marking__mark-button" onClick="hostMarkQuestion(this, '${triviaData.rounds[roundNumber].type}', ${roundReponses[j].roundNumber}, ${roundReponses[j].questionNumber}, '${roundReponses[j].name}', '${roundReponses[j].uniqueId}', ${triviaData.rounds[roundNumber].pointValue})">${triviaData.rounds[roundNumber].pointValue}</span><span class="lobby__host__round-marking__mark-button lobby__host__round-marking__mark-button--half" onClick="hostMarkQuestion(this, '${triviaData.rounds[roundNumber].type}', ${roundReponses[j].roundNumber}, ${roundReponses[j].questionNumber}, '${roundReponses[j].name}', '${roundReponses[j].uniqueId}', ${triviaData.rounds[roundNumber].pointValue / 2})">${triviaData.rounds[roundNumber].pointValue / 2}</span> <span class="lobby__host__round-marking__mark-button lobby__host__round-marking__mark-button--wrong" onClick="hostMarkQuestion(this, '${triviaData.rounds[roundNumber].type}', ${roundReponses[j].roundNumber}, ${roundReponses[j].questionNumber}, '${roundReponses[j].name}', '${roundReponses[j].uniqueId}', 0)">0</span></td>
            </tr>
          `
        } else if (triviaData.rounds[roundNumber].type === 'picture' || triviaData.rounds[roundNumber].type === 'lightning') {
          htmlToInsert += `
            <tr>
              <td>${roundReponses[j].response}</td>
              <td class="text-align__center"><span class="lobby__host__round-marking__mark-button" onClick="hostMarkQuestion(this, '${triviaData.rounds[roundNumber].type}', ${roundReponses[j].roundNumber}, ${roundReponses[j].questionNumber}, '${roundReponses[j].name}', '${roundReponses[j].uniqueId}', ${triviaData.rounds[roundNumber].pointValue})">${triviaData.rounds[roundNumber].pointValue}</span><span class="lobby__host__round-marking__mark-button lobby__host__round-marking__mark-button--half" onClick="hostMarkQuestion(this, '${triviaData.rounds[roundNumber].type}', ${roundReponses[j].roundNumber}, ${roundReponses[j].questionNumber}, '${roundReponses[j].name}', '${roundReponses[j].uniqueId}', ${triviaData.rounds[roundNumber].pointValue / 2})">${triviaData.rounds[roundNumber].pointValue / 2}</span> <span class="lobby__host__round-marking__mark-button lobby__host__round-marking__mark-button--wrong" onClick="hostMarkQuestion(this, '${triviaData.rounds[roundNumber].type}', ${roundReponses[j].roundNumber}, ${roundReponses[j].questionNumber}, '${roundReponses[j].name}', '${roundReponses[j].uniqueId}', 0)">0</span></td>
            </tr>
          `
        }
      }
    }
  }
  htmlToInsert += '</table>'
  roundMarkContainer.insertAdjacentHTML('beforeend', htmlToInsert)
}

function hostMarkTieBreaker () {
  console.log('hostMarkTieBreaker()')
  // hide playing round
  const roundPlayContainer = document.querySelector('.lobby__host__round-display')
  roundPlayContainer.innerHTML = ''
  // display marking round
  const roundMarkContainer = document.querySelector('.lobby__host__round-marking')
  roundMarkContainer.innerHTML = ''
  const roundReponses = []
  lobbyData.responses.forEach((response) => {
    if (response.roundType === 'tieBreaker') {
      roundReponses.push(response)
    }
  })
  let htmlToInsert = `
    <table>
      <tr>
        <th>Player answer</th>
        <th>Mark</th>
      </tr>
      <tr>
        <th>Q: ${triviaData.tieBreaker.question}</th>
        <th>A: ${triviaData.tieBreaker.answer}</th>
      </tr>
  `
  roundReponses.forEach((response) => {
    const differenceFromResponse = response.response - triviaData.tieBreaker.answer
    const diffSymbol = (differenceFromResponse >= 0) ? '+' : ''
    htmlToInsert += `
      <tr>
        <td>${response.response} (${diffSymbol}${differenceFromResponse})</td>
        <td class="text-align__center"><span class="lobby__host__round-marking__mark-button" onClick="hostMarkQuestion(this, 'tieBreaker', 0, 0, '${response.name}', '${response.uniqueId}', 1)">Winner</span></td>
      </tr>
    `
  })
  htmlToInsert += '</table>'
  roundMarkContainer.insertAdjacentHTML('beforeend', htmlToInsert)
}

function hostPerformAction (element) {
  console.log('hostPerformAction()')
  hostCurrentQuestionDisplaying = element
  const questionToSend = {}
  if (element !== 'test' && element.id !== 'hostTieBreakerToggleDisplay') {
    // update host display
    document.querySelectorAll('.lobby__host__round-display__questions__question__right').forEach((element) => {
      element.innerHTML = 'Hidden'
      element.classList.remove('active')
    })
    element.classList.add('active')
    element.innerHTML = 'Showing for players'
    // compile question data to send to players
    const roundNumber = parseInt(element.id.replace('hostRound', '').charAt(0))
    const questionString = element.id.replace('ToggleDisplay', '')
    const questionNumber = parseInt(questionString.charAt(questionString.length - 1))
    questionToSend.roundNumber = roundNumber
    questionToSend.questionNumber = questionNumber
    questionToSend.type = triviaData.rounds[roundNumber].type
    questionToSend.theme = triviaData.rounds[roundNumber].theme
    questionToSend.pointValue = triviaData.rounds[roundNumber].pointValue
    if (triviaData.rounds[roundNumber].type === 'multipleChoice') {
      questionToSend.question = triviaData.rounds[roundNumber].questions[questionNumber].question
      questionToSend.options = triviaData.rounds[roundNumber].questions[questionNumber].options
    } else if (triviaData.rounds[roundNumber].type === 'picture') {
      questionToSend.url = triviaData.rounds[roundNumber].pictures[questionNumber].url
    } else if (triviaData.rounds[roundNumber].type === 'lightning') {
      questionToSend.question = triviaData.rounds[roundNumber].questions[questionNumber].question
    }
  } if (element.id === 'hostTieBreakerToggleDisplay') {
    // update host display
    element.classList.add('active')
    element.innerHTML = 'Showing for players'
    // compile question data to send to players
    questionToSend.type = 'tieBreaker'
    questionToSend.question = triviaData.tieBreaker.question
  }
  if (Object.keys(questionToSend).length !== 0) {
    socket.emit('host action', questionToSend)
  }
  // update display of players yet to respond
  if (element !== 'test') {
    const roundNumber = parseInt(element.id.replace('hostRound', '').charAt(0))
    const questionString = element.id.replace('ToggleDisplay', '')
    const questionNumber = parseInt(questionString.charAt(questionString.length - 1))
    hostGetAllResponsesForQuestion(questionToSend.type, roundNumber, questionNumber)
  }
}

function playerDisplayHomeScreen () {
  console.log('playerDisplayHomeScreen()')

  document.querySelector('.lobby__player').style.display = 'block'
  document.querySelector('.lobby__player__waiting').style.display = 'block'
}

function playerDisplayHostAction (data) {
  console.log('playerRecordedResponse()')
  const questionContainer = document.querySelector('.lobby__player__round-display')
  questionContainer.innerHTML = ''
  let htmlToInsert = ''
  if (data.type !== 'tieBreaker') {
    htmlToInsert += `
      <p>Round ${data.roundNumber + 1}</p>
      <p>Round Type: ${data.type}</p>
      <p>Round Theme: ${data.theme}</p>
      <p>Point Value: ${data.pointValue}</p>
    `
    if (data.type === 'multipleChoice') {
      htmlToInsert += `
      <p>Question ${data.questionNumber + 1}</p>
      <p>${data.question}</p>
      <ul class="lobby__player__round-display__multiple__options">
        <li onClick="playerRecordResponse(${data.roundNumber}, '${data.type}', ${data.questionNumber}, 0)">A) ${data.options[0]}</li>
        <li onClick="playerRecordResponse(${data.roundNumber}, '${data.type}', ${data.questionNumber}, 1)">B) ${data.options[1]}</li>
        <li onClick="playerRecordResponse(${data.roundNumber}, '${data.type}', ${data.questionNumber}, 2)">C) ${data.options[2]}</li>
        <li onClick="playerRecordResponse(${data.roundNumber}, '${data.type}', ${data.questionNumber}, 3)">D) ${data.options[3]}</li>
      </ul>
      `
    } else if (data.type === 'picture') {
      htmlToInsert += `
      <p>Picture ${data.questionNumber + 1}</p>
      <img src="${data.url}" />
      <input id="playerPictureResponse" type="text" />
      <button onClick="playerRecordResponse(${data.roundNumber}, '${data.type}', ${data.questionNumber}, 'playerPictureResponse')">Submit response</button>
      `
    } else if (data.type === 'lightning') {
      htmlToInsert += `
      <p>Question ${data.questionNumber + 1}</p>
      <p>${data.question}</p>
      <input id="playerLightningResponse" type="text" />
      <button onClick="playerRecordResponse(${data.roundNumber}, '${data.type}', ${data.questionNumber}, 'playerLightningResponse')">Submit response</button>
      `
    }
  } else if (data.type === 'tieBreaker') {
    htmlToInsert += `
      <p>Tie Breaker Question</p>
      <p>${data.question}</p>
      <input id="playerTieBreakerResponse" type="number" />
      <button onClick="playerRecordResponse(${data.roundNumber}, '${data.type}', ${data.questionNumber}, 'playerTieBreakerResponse')">Submit response</button>
    `
  }
  htmlToInsert += `
    <p id="playerRecordedResponse">Your response:</p>
  `
  questionContainer.insertAdjacentHTML('beforeend', htmlToInsert)

  // get player's current response
  playerGetRecordedResponse(data, data.type)
}

function playerGetRecordedResponse (data, roundType) {
  console.log('playerGetRecordedResponse()')
  // hide player waiting display
  document.querySelector('.lobby__player__waiting').style.display = 'none'
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      const playerResponse = (this.response !== 'Response not found.') ? JSON.parse(this.responseText) : false
      if (playerResponse) {
        let displayResponse = ''
        if (roundType === 'multipleChoice') {
          if (playerResponse.response === 0) {
            displayResponse = 'A'
          } else if (playerResponse.response === 1) {
            displayResponse = 'B'
          } else if (playerResponse.response === 2) {
            displayResponse = 'C'
          } else if (playerResponse.response === 3) {
            displayResponse = 'D'
          }
        } else {
          displayResponse = playerResponse.response
        }
        document.getElementById('playerRecordedResponse').innerHTML += ` ${displayResponse}`
      }
    }
  }
  if (roundType === 'tieBreaker') {
    xhttp.open('POST', '/getPlayerResponse', true)
    xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8')
    xhttp.send(JSON.stringify({ triviaId: lobbyData.triviaId, name: playerName, uniqueId: window.localStorage.getItem('playerId'), roundType: roundType }))
  } else {
    xhttp.open('POST', '/getPlayerResponse', true)
    xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8')
    xhttp.send(JSON.stringify({ triviaId: lobbyData.triviaId, name: playerName, uniqueId: window.localStorage.getItem('playerId'), roundNumber: data.roundNumber, questionNumber: data.questionNumber }))
  }
}

function playerPostResponseToDb (roundNumber, roundType, questionNumber, response) {
  console.log('playerPostResponseToDb()')
  const dataToSend = {
    player: {
      name: playerName,
      triviaId: lobbyData.triviaId,
      uniqueId: window.localStorage.getItem('playerId')
    },
    response: {
      roundType: roundType,
      response: response
    }
  }
  if (roundType !== 'tieBreaker') {
    dataToSend.response.roundNumber = roundNumber
    dataToSend.response.questionNumber = questionNumber
    dataToSend.response.roundNumber = roundNumber
  }

  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      const responseData = JSON.parse(this.responseText)
      console.log(responseData)
      socket.emit('player responded', responseData)
    }
  }
  xhttp.open('POST', '/lobby/recordPlayerResponse', true)
  xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8')
  xhttp.send(JSON.stringify(dataToSend))
}

function playerRecordResponse (roundNumber, roundType, questionNumber, response) {
  if (!roundNumber && !roundType && !questionNumber && !response) {
    return
  }
  console.log('playerRecordResponse()')
  // local response display
  const responseLocation = document.getElementById('playerRecordedResponse')
  if (roundType === 'multipleChoice') {
    let displayResponse = ''
    if (response === 0) {
      displayResponse = 'A'
    } else if (response === 1) {
      displayResponse = 'B'
    } else if (response === 2) {
      displayResponse = 'C'
    } else if (response === 3) {
      displayResponse = 'D'
    }
    responseLocation.innerHTML = `Your response: ${displayResponse}`
    playerPostResponseToDb(roundNumber, roundType, questionNumber, response)
  } else if (roundType === 'picture' || roundType === 'lightning' || roundType === 'tieBreaker') {
    const playerResponse = document.getElementById(response).value
    if (playerResponse.length > 0) {
      responseLocation.innerHTML = `Your response: ${playerResponse}`
      playerPostResponseToDb(roundNumber, roundType, questionNumber, playerResponse)
    }
  }
}

function hostGetAllResponsesForQuestion (roundType, roundNumber, questionNumber) {
  console.log('hostGetAllResponsesForQuestion()')
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      const questionResponses = JSON.parse(this.responseText)
      const playersToRespondDisplay = (roundType === 'tieBreaker') ? document.getElementById('hostPlayersYetToResponseRoundTieBreaker') : document.getElementById(`hostPlayersYetToResponseRound${roundNumber}Question${questionNumber}`)
      if (Array.isArray(questionResponses)) {
        const playersWhoAnswered = []
        questionResponses.forEach((response) => {
          playersWhoAnswered.push({ name: response.name, uniqueId: response.uniqueId })
        })
        const playersLeft = lobbyData.players.filter(user => {
          return questionResponses.findIndex(owner => (owner.name === user.name && owner.uniqueId === user.uniqueId)) === -1
        })
        let stringOfPlayers = ''
        playersLeft.forEach((player) => {
          stringOfPlayers += `${player.name}, `
        })
        const fixedStringOfPlayers = stringOfPlayers.slice(0, -2)
        if (fixedStringOfPlayers.length > 0) {
          playersToRespondDisplay.innerHTML = fixedStringOfPlayers
        } else {
          playersToRespondDisplay.innerHTML = 'all players have responded'
        }
      }
    }
  }
  if (roundType === 'tieBreaker') {
    xhttp.open('POST', '/getAllResponsesForQuestion', true)
    xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8')
    xhttp.send(JSON.stringify({ triviaId: lobbyData.triviaId, roundType: roundType }))
  } else {
    xhttp.open('POST', '/getAllResponsesForQuestion', true)
    xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8')
    xhttp.send(JSON.stringify({ triviaId: lobbyData.triviaId, roundNumber: roundNumber, questionNumber: questionNumber }))
  }
}

function hostMarkQuestion (element, roundType, roundNumber, questionNumber, playerName, playerUniqueId, score) {
  if (!element && !roundType && !roundNumber && !questionNumber && !playerName && !playerUniqueId && !score) {
    return
  }
  console.log('hostMarkQuestion()')
  // update button displays
  element.parentNode.querySelectorAll('.lobby__host__round-marking__mark-button').forEach((button) => {
    button.style.opacity = 0.33
  })
  element.style.opacity = 1
  // post data to db
  console.log(roundType, roundNumber, questionNumber, playerName, playerUniqueId, score)
  const dataToSend = {
    triviaId: triviaData.triviaId,
    name: playerName,
    uniqueId: playerUniqueId,
    roundType: roundType,
    roundNumber: roundNumber,
    questionNumber: questionNumber,
    score: score
  }
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      // console.log(this.responseText)
      const responseData = JSON.parse(this.responseText)
      console.log(responseData)
      // socket.emit('player responded', responseData)
    }
  }
  xhttp.open('POST', '/markPlayerResponse', true)
  xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8')
  xhttp.send(JSON.stringify(dataToSend))
}

function toggleLeaderboardDisplay (toggle) {
  if (!toggle) {
    return
  }
  console.log('toggleLeaderboardDisplay()')

  if (toggle === 'hide') {
    const leaderboardContainer = document.querySelector('.all__leaderboard')
    const toggleButton = document.querySelector('.lobby__host__toggle-leaderboard')

    leaderboardContainer.style.display = 'none'
    toggleButton.innerHTML = 'Display Leaderboard'
    toggleButton.classList.remove('active')
    isLeaderboardVisible = false
  } else {
    const leaderboardContainer = document.querySelector('.all__leaderboard')
    const toggleButton = this.event.target
    if (isLeaderboardVisible) {
      leaderboardContainer.style.display = 'none'
      toggleButton.innerHTML = 'Display Leaderboard'
      toggleButton.classList.remove('active')
      isLeaderboardVisible = false
    } else {
      getLobbyData('leaderboard')
      leaderboardContainer.style.display = 'block'
      toggleButton.innerHTML = 'Hide Leaderboard'
      toggleButton.classList.add('active')
      isLeaderboardVisible = true
    }
  }
}
