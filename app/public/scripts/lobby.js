/* global triviaData, playerName, io */

// on page load
document.addEventListener('DOMContentLoaded', () => {
  // update page title display
  document.getElementById('infoTriviaHost').innerHTML = triviaData.host
  document.getElementById('infoTriviaId').innerHTML = triviaData.triviaId

  // web socket
  const socket = io()
  document.getElementById('socketEvent').addEventListener('click', (event) => {
    socket.emit('player event', `${playerName} says hi!`)
  })
  socket.on('player event', (message) => {
    console.log(message)
  })
}, false)
