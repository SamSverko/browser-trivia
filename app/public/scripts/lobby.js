/* global triviaData */

// on page load
document.addEventListener('DOMContentLoaded', () => {
  // update page title display
  document.getElementById('infoTriviaHost').innerHTML = triviaData.host
  document.getElementById('infoTriviaId').innerHTML = triviaData.triviaId
}, false)
