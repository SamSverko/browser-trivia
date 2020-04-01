/* global triviaData */

console.log('Welcome to the host page!')
console.log(triviaData)

// page title display
document.getElementById('hostName').innerHTML = triviaData.host
document.getElementById('hostTriviaId').innerHTML = triviaData.triviaId

// set form action
document.getElementById('hostForm').action = `/host/${triviaData.triviaId}`

// round display
if ('rounds' in triviaData) {
  console.log('You have at least one round')
} else {
  console.log('You have no rounds')
}
