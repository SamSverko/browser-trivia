/* global triviaData, lobbyData, playerName, io, fetch, XMLHttpRequest */

// on page load
document.addEventListener('DOMContentLoaded', () => {
  // update page title display
  document.getElementById('infoTriviaHost').innerHTML = lobbyData.host
  document.getElementById('infoTriviaId').innerHTML = lobbyData.triviaId

  // web socket
  const socket = io()
  socket.heartbeatTimeout = 10000

  // socket to everyone that this player has joined
  const playerId = window.localStorage.getItem('playerId')
  socket.emit('played joined', playerName, playerId)

  // post user to db in case user disconnected properly, but was not added back to the lobby db
  postPlayerToDb(playerName, playerId)

  // when a player joins the lobby
  socket.on('player joined', (playerName, playerId) => {
    window.setTimeout(() => {
      console.log(`${playerName}, ${playerId} joined the lobby!`)
      getLobbyData()
    }, 2000)
  })

  // when a player leaves the lobby
  socket.on('player disconnected', (playerName, playerId) => {
    console.log(`${playerName}, ${playerId} left the lobby!`)
    getLobbyData()
  })

  // display content based on participant type (host or player)
  displayParticipantContent()
}, false)

function getLobbyData () {
  (async () => {
    fetch(`http://localhost:3000/lobby/${lobbyData.triviaId}`)
      .then((response) => {
        if (response.ok) { return response.json() }
        return Promise.reject(response)
      }).then((data) => {
        displayLobbyData(data)
      }).catch((error) => {
        console.warn('Something went wrong.', error)
      })
  })()
}

function displayLobbyData (lobbyData) {
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

function postPlayerToDb (name, uniqueId) {
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

function displayParticipantContent () {
  console.log(triviaData)
  // console.log(lobbyData)
  if (triviaData) {
    // display host content
    document.querySelector('.lobby__host').style.display = 'block'
    document.querySelector('.lobby__player').style.display = 'block'
    document.querySelector('.lobby__player__waiting').style.display = 'block'

    // populate round select display
    let htmlToInsert = ''
    for (let i = 0; i < triviaData.rounds.length; i++) {
      htmlToInsert += `
        <div class="lobby__host__round-select__round" id="hostSelectRound${i}">Round ${i + 1}</div>
      `
    }
    htmlToInsert += `
      <div class="lobby__host__round-select__round" id="hostSelectTieBreaker">Tie Breaker</div>
    `
    document.querySelector('.lobby__host__round-select').insertAdjacentHTML('beforeend', htmlToInsert)
    const roundButtons = document.querySelectorAll('.lobby__host__round-select__round')
    roundButtons.forEach((button) => {
      button.addEventListener('click', hostDisplayRoundButton)
    })
  } else {
    document.querySelector('.lobby__player').style.display = 'block'
    document.querySelector('.lobby__player__waiting').style.display = 'block'
  }
}

function hostDisplayRound (roundNumber) {
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
    <div class="lobby__host__round-display__multiple">
    `
    for (let i = 0; i < triviaData.rounds[roundNumber].questions.length; i++) {
      htmlToInsert += `
        <div class="lobby__host__round-display__multiple__question">
          <div class="lobby__host__round-display__multiple__question__left">
            <p>${i + 1}) ${triviaData.rounds[roundNumber].questions[i].question}</p>
            <ul>
              <li>A) ${triviaData.rounds[roundNumber].questions[i].options[0]}</li>
              <li>B) ${triviaData.rounds[roundNumber].questions[i].options[1]}</li>
              <li>C) ${triviaData.rounds[roundNumber].questions[i].options[2]}</li>
              <li>D) ${triviaData.rounds[roundNumber].questions[i].options[3]}</li>
            </ul>
            <p>Answer: ${triviaData.rounds[roundNumber].questions[i].answer}</p>
          </div>
          <div class="lobby__host__round-display__multiple__question__right" id="hostRound${roundNumber}Question${i}toggleDisplay">
            Hidden
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
    <div class="lobby__host__round-display__picture">
    `
    for (let i = 0; i < triviaData.rounds[roundNumber].pictures.length; i++) {
      htmlToInsert += `
        <div class="lobby__host__round-display__picture__question">
          <div class="lobby__host__round-display__picture__question__left">
            <p>${i + 1})</p>
            <img src="${triviaData.rounds[roundNumber].pictures[i].url}" />
            <p>Answer: ${triviaData.rounds[roundNumber].pictures[i].answer}</p>
          </div>
          <div class="lobby__host__round-display__picture__question__right" id="hostRound${roundNumber}Question${i}toggleDisplay">
            Hidden
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
    <div class="lobby__host__round-display__lightning">
    `
    for (let i = 0; i < triviaData.rounds[roundNumber].questions.length; i++) {
      htmlToInsert += `
        <div class="lobby__host__round-display__lightning__question">
          <div class="lobby__host__round-display__lightning__question__left">
            <p>${i + 1}) ${triviaData.rounds[roundNumber].questions[i].question}</p>
            <p>Answer: ${triviaData.rounds[roundNumber].questions[i].answer}</p>
          </div>
          <div class="lobby__host__round-display__lightning__question__right" id="hostRound${roundNumber}Question${i}toggleDisplay">
            Hidden
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

function hostDisplayTieBreaker () {
  const roundContainer = document.querySelector('.lobby__host__round-display')
  roundContainer.innerHTML = ''
  const htmlToInsert = `
    <p>Tie Breaker</p>
    <div class="lobby__host__tie-breaker-display">
      <div class="lobby__host__tie-breaker-display__left">
        <p>Q) ${triviaData.tieBreaker.question}</p>
        <p>A) ${triviaData.tieBreaker.answer}</p>
      </div>
      <div class="lobby__host__tie-breaker-display__right">
        Hidden
      </div>
    </div>
  `
  roundContainer.insertAdjacentHTML('beforeend', htmlToInsert)
}

function hostDisplayRoundButton (event) {
  // update round display button style
  const roundButtons = document.querySelectorAll('.lobby__host__round-select__round')
  roundButtons.forEach((button) => {
    button.classList.remove('lobby__host__round-select__round--active')
  })
  document.getElementById(event.target.id).classList.add('lobby__host__round-select__round--active')
  // display round
  if (event.target.id === 'hostSelectTieBreaker') {
    hostDisplayTieBreaker()
  } else {
    const round = parseInt(event.target.id.charAt(event.target.id.length - 1))
    hostDisplayRound(round)
  }
}
