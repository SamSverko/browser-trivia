/* global triviaData */

// executed on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Welcome to the host page!')
  console.log(triviaData)

  // update page title display
  document.getElementById('hostName').innerHTML = triviaData.host
  document.getElementById('hostTriviaId').innerHTML = triviaData.triviaId

  // set form action
  document.getElementById('hostForm').action = `/host/${triviaData.triviaId}`

  // update rounds display
  if ('rounds' in triviaData && triviaData.rounds !== null) {
    console.log('You have at least one round')
  } else {
    console.log('You have no rounds')
  }
  document.querySelector('.rounds__select-type').style.display = 'flex'

  // add event listeners to add a round buttons
  document.getElementById('roundTypeMultiple').addEventListener('click', addRound)
  document.getElementById('roundTypePicture').addEventListener('click', addRound)
  document.getElementById('roundTypeLightning').addEventListener('click', addRound)
}, false)

function addRound () {
  document.querySelector('.rounds__select-type').style.display = 'none'
  document.querySelector('.rounds__to-add').style.display = 'flex'
  const roundTitle = document.querySelector('.rounds__to-add__title')
  if (this.id === 'roundTypeMultiple') {
    roundTitle.innerHTML += 'Multiple Choice round'
    document.querySelector('.rounds__to-add__multiple-choice').style.display = 'flex'
    document.querySelector('.rounds__to-add__multiple-choice__add-question').addEventListener('click', (event) => {
      event.preventDefault()
      console.log('add a question!')
      addMultipleChoiceQuestion()
    })
    document.querySelector('.rounds__to-add__multiple-choice').action = `/host/${triviaData.triviaId}?addRound=multipleChoice`
  } else if (this.id === 'roundTypePicture') {
    roundTitle.innerHTML += 'Picture round'
  } else {
    roundTitle.innerHTML += 'Lightning round'
  }
}

function addMultipleChoiceQuestion () {
  const roundNumber = 0
  const questionNumber = 1 + (document.getElementsByClassName('rounds__to-add__multiple-choice__questions__question').length)
  let htmlToInsert = (questionNumber === 1) ? '<input name="type" type="hidden" value="multipleChoice" />' : ''
  htmlToInsert += `
    <label class="rounds__to-add__multiple-choice__questions__question" for="multipleQuestion${questionNumber}">Question ${questionNumber}</label>
    <input id="multipleQuestion${questionNumber}" name="[questions][${questionNumber}][question]" required type="text">
    <p>Possible answers for question ${questionNumber}</p>
    <label for="question${questionNumber}ASelection">A</label>
    <input id="question${questionNumber}ASelection" name="[questions][${questionNumber}][options]" required type="text">
    <label for="question${questionNumber}BSelection">B</label>
    <input id="question${questionNumber}ABelection" name="[questions][${questionNumber}][options]" required type="text">
    <label for="rquestion${questionNumber}CSelection">C</label>
    <input id="question${questionNumber}CSelection" name="[questions][${questionNumber}][options]" required type="text">
    <label for="question${questionNumber}DSelection">D</label>
    <input id="question${questionNumber}DSelection" name="[questions][${questionNumber}][options]" required type="text">
    <p>Actual answer for question ${questionNumber}</p>
    <input id="question${questionNumber}AAnswer" name="[questions][${questionNumber}][answer]" required type="radio" value="0">
    <label for="question${questionNumber}AAnswer">A</label>
    <input id="question${questionNumber}BAnswer" name="[questions][${questionNumber}][answer]" type="radio" value="1">
    <label for="question${questionNumber}BAnswer">B</label>
    <input id="question${questionNumber}CAnswer" name="[questions][${questionNumber}][answer]" type="radio" value="2">
    <label for="question${questionNumber}CAnswer">C</label>
    <input id="question${questionNumber}DAnswer" name="[questions][${questionNumber}][answer]" type="radio" value="3">
    <label for="question${questionNumber}DAnswer">D</label>
    <br />
  `
  document.querySelector('.rounds__to-add__multiple-choice__questions').insertAdjacentHTML('beforeend', htmlToInsert)
}
