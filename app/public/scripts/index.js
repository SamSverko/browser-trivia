document.addEventListener('DOMContentLoaded', () => {
  // create unique session key (to avoid duplicate player inserts into lobby collection)
  let playerId = ''
  if (window.localStorage.getItem('playerId') === null) {
    window.localStorage.setItem('playerId', generateUUID())
  }
  playerId = window.localStorage.getItem('playerId')
  console.log(playerId)
  insertIDToForms(playerId)
  updateFormAction()
  handleQueryParams()
}, false)

function generateUUID () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function handleQueryParams (test) {
  const urlParams = new URLSearchParams(window.location.search)

  const doesTriviaExist = urlParams.get('triviaNotFound')
  if (doesTriviaExist) {
    console.log('TRIVIA NOT FOUND!')
  }

  const isLobbyReady = urlParams.get('lobbyNotReady')
  if (isLobbyReady) {
    console.log('LOBBY IS NOT READY!')
  }
}

function insertIDToForms (uuid) {
  const htmlToInsert = `
    <input name="player-uuid" type="hidden" value="${uuid}" />
  `
  document.querySelector('.form__player').insertAdjacentHTML('beforeend', htmlToInsert)
}

function updateFormAction (event) {
  if (event !== undefined) {
    document.querySelector('.form__player').action = (event.target.value !== '') ? `/join?roomCode=${event.target.value}` : '/'
  }
}
