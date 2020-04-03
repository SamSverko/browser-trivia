/* global triviaData */

// on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log(triviaData)

  // update page title display
  document.getElementById('hostName').innerHTML = triviaData.host
  document.getElementById('hostTriviaId').innerHTML = triviaData.triviaId

  // set host trivia form actions
  document.querySelector('.tie-breaker__add__form').action = `/host/${triviaData.triviaId}?addRound=tieBreaker`
  document.getElementById('hostForm').action = `/host/${triviaData.triviaId}`

  // update rounds display
  if ('rounds' in triviaData && triviaData.rounds !== null) {
    displayExistingRounds()
  }

  // add event listeners to add a round buttons
  document.getElementById('roundTypeMultiple').addEventListener('click', addRound)
  document.getElementById('roundTypePicture').addEventListener('click', addRound)
  document.getElementById('roundTypeLightning').addEventListener('click', addRound)

  // toggle tie breaker display
  checkTieBreakerStatus()
  document.querySelector('.tie-breaker__edit').addEventListener('click', () => {
    // hide existing tie breaker and show tie breaker form
    document.querySelector('.tie-breaker__add').style.display = 'block'
    document.querySelector('.tie-breaker').style.display = 'none'
    document.getElementById('tieBreakerQuestion').value = triviaData.tieBreaker.question
    document.getElementById('tieBreakerAnswer').value = triviaData.tieBreaker.answer
  })

  // check trivia status
  checkTriviaStatus()

  // test image validation script
  validateImageUrl()
}, false)

// adding a new round
function addRound () {
  // hide add a round selection and display current round you are adding
  document.querySelector('.rounds__select-type').style.display = 'none'
  document.querySelector('.rounds__to-add').style.display = 'flex'
  document.querySelector('.rounds__to-add__form').style.display = 'flex'

  // save round title element
  const roundTitle = document.querySelector('.rounds__to-add__title')

  // Round cancel button
  document.querySelector('.rounds__to-add__form__cancel-round').addEventListener('click', (event) => {
    event.preventDefault()
    window.location.reload(false)
  })

  if (this.id === 'roundTypeMultiple') {
    // update round title
    roundTitle.innerHTML += 'Multiple Choice round'
    // insert relevant add a round form data
    const htmlToInsert = `
      <input name="type" type="hidden" value="multipleChoice" />
      <label for="multipleTheme">Theme (can leave blank if none)</label>
      <input id="multipleTheme" name="theme" type="text">
      <br />
    `
    document.querySelector('.rounds__to-add__form__questions').insertAdjacentHTML('beforeend', htmlToInsert)
    // add additional question button
    document.querySelector('.rounds__to-add__form__add-question').addEventListener('click', (event) => {
      event.preventDefault()
      addAdditionalQuestion('multipleChoice')
    })
    // update add a round form action
    document.querySelector('.rounds__to-add__form').action = `/host/${triviaData.triviaId}?addRound=multipleChoice`
  } else if (this.id === 'roundTypePicture') {
    // update round title
    roundTitle.innerHTML += 'Picture round'
    // insert relevant add a round form data
    const htmlToInsert = `
      <input name="type" type="hidden" value="picture" />
      <label for="pictureTheme">Theme (can leave blank if none)</label>
      <input id="pictureTheme" name="theme" type="text">
      <br />
    `
    document.querySelector('.rounds__to-add__form__questions').insertAdjacentHTML('beforeend', htmlToInsert)
    // change from 'answer' to 'picture'
    document.querySelector('.rounds__to-add__form__add-question').innerHTML = 'Add a picture'
    // add additional question button
    document.querySelector('.rounds__to-add__form__add-question').addEventListener('click', (event) => {
      event.preventDefault()
      addAdditionalQuestion('picture')
    })
    // update add a round form action
    document.querySelector('.rounds__to-add__form').action = `/host/${triviaData.triviaId}?addRound=picture`
  } else if (this.id === 'roundTypeLightning') {
    // update round title
    roundTitle.innerHTML += 'Lightning round'
    // insert relevant add a round form data
    const htmlToInsert = `
      <input name="type" type="hidden" value="lightning" />
      <label for="lightningTheme">Theme (can leave blank if none)</label>
      <input id="lightningTheme" name="theme" type="text">
      <br />
    `
    document.querySelector('.rounds__to-add__form__questions').insertAdjacentHTML('beforeend', htmlToInsert)
    // add additional question button
    document.querySelector('.rounds__to-add__form__add-question').addEventListener('click', (event) => {
      event.preventDefault()
      addAdditionalQuestion('lightning')
    })
    // update add a round form action
    document.querySelector('.rounds__to-add__form').action = `/host/${triviaData.triviaId}?addRound=lightning`
  }
  document.querySelector('.rounds__to-add__form__add-question').click()
}

// adding additional questions to round
function addAdditionalQuestion (roundType) {
  // save number of existing questions
  const questionNumber = 1 + (document.getElementsByClassName('rounds__to-add__form__questions__question').length)
  let htmlToInsert = ''
  if (roundType === 'multipleChoice') {
    // new question form fields
    htmlToInsert += `
      <label class="rounds__to-add__form__questions__question" for="multipleQuestion${questionNumber}">Question ${questionNumber}</label>
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
  } else if (roundType === 'picture') {
    // new question form fields
    htmlToInsert = `
      <p>Picture ${questionNumber}</p>
      <label class="rounds__to-add__form__questions__question" for="pictureUrl${questionNumber}">URL</label>
      <input id="pictureUrl${questionNumber}" name="[pictures][${questionNumber}][url]" onBlur="validateImageUrl(event)" required type="text">
      <label for="pictureAnswer${questionNumber}">Answer</label>
      <input id="pictureAnswer${questionNumber}" name="[pictures][${questionNumber}][answer]" required type="text">
    `
  } else if (roundType === 'lightning') {
    // new question form fields
    htmlToInsert += `
      <p>Question ${questionNumber}</p>
      <label class="rounds__to-add__form__questions__question" for="lightningQuestion${questionNumber}">Question</label>
      <input id="lightningQuestion${questionNumber}" name="[questions][${questionNumber}][lightningQuestion]" required type="text">
      <label for="lightningAnswer${questionNumber}">Answer</label>
      <input id="lightningAnswer${questionNumber}" name="[questions][${questionNumber}][lightningAnswer]" required type="text">
    `
  }
  document.querySelector('.rounds__to-add__form__questions').insertAdjacentHTML('beforeend', htmlToInsert)
}

// display/hide saved tie breaker
function checkTieBreakerStatus () {
  const addTieBreakerContainer = document.querySelector('.tie-breaker__add')
  const tieBreakerContainer = document.querySelector('.tie-breaker')
  if (triviaData.tieBreaker && triviaData.tieBreaker !== null) {
    addTieBreakerContainer.style.display = 'none'
    tieBreakerContainer.style.display = 'block'
    document.querySelector('.tie-breaker__question').innerHTML = `Question: ${triviaData.tieBreaker.question}`
    document.querySelector('.tie-breaker__answer').innerHTML = `Answer: ${triviaData.tieBreaker.answer}`
  } else {
    addTieBreakerContainer.style.display = 'block'
    tieBreakerContainer.style.display = 'none'
  }
}

// check if trivia is ready to be hosted
function checkTriviaStatus () {
  // initialize as showing all items
  const hostTriviaButton = document.querySelector('.host-trivia-form__submit')
  const helpContainer = document.querySelector('.host-trivia-form__submit-help')
  const help1Round = document.getElementById('submitHelp1Round')
  const helpTieBreaker = document.getElementById('submitHelpTieBreaker')
  hostTriviaButton.disabled = true
  helpContainer.style.display = 'block'
  // hide form host submit if rounds exist, display if no rounds exist
  if ('rounds' in triviaData && triviaData.rounds !== null) {
    help1Round.style.display = (triviaData.rounds.length > 0) ? 'none' : 'block'
  }
  helpTieBreaker.style.display = (triviaData.tieBreaker) ? 'none' : 'block'

  helpContainer.style.display = (help1Round.style.display === 'none' && helpTieBreaker.style.display === 'none') ? 'none' : 'block'
  hostTriviaButton.disabled = (helpContainer.style.display !== 'none')
}

// display saved rounds
function displayExistingRounds () {
  let htmlToInsert = ''
  for (let i = 0; i < triviaData.rounds.length; i++) {
    const roundType = (triviaData.rounds[i].type === 'multipleChoice') ? 'multiple choice' : triviaData.rounds[i].type
    const questionOrPicture = (triviaData.rounds[i].type === 'picture') ? 'pictures' : 'questions'
    const numberOfQuestions = (triviaData.rounds[i].type === 'picture') ? triviaData.rounds[i].pictures.length : triviaData.rounds[i].questions.length
    htmlToInsert += `
      <div class="rounds__existing__round">
        <p>Round ${i + 1}</p>
        <p>Type: ${roundType}</p>
        <p>Number of ${questionOrPicture}: ${numberOfQuestions}</p>
        <details>
          <summary>${questionOrPicture}</summary>
    `
    for (let j = 0; j < triviaData.rounds[i][questionOrPicture].length; j++) {
      if (triviaData.rounds[i].type === 'multipleChoice') {
        htmlToInsert += `
          <p>Question: ${triviaData.rounds[i][questionOrPicture][j].question}</p>
          <p>Answer: ${triviaData.rounds[i][questionOrPicture][j].options[triviaData.rounds[i][questionOrPicture][j].answer]}</p>
          <p>Options:</p>
          <ul>
            <li>${triviaData.rounds[i][questionOrPicture][j].options[0]}</li>
            <li>${triviaData.rounds[i][questionOrPicture][j].options[1]}</li>
            <li>${triviaData.rounds[i][questionOrPicture][j].options[2]}</li>
            <li>${triviaData.rounds[i][questionOrPicture][j].options[3]}</li>
          </ul>
        `
      } else if (triviaData.rounds[i].type === 'picture') {
        htmlToInsert += `
          <a href="${triviaData.rounds[i][questionOrPicture][j].url}" target="_blank">
            <img class="rounds__existing__round__image" rel="noopener noreferrer" src="${triviaData.rounds[i][questionOrPicture][j].url}" />
          </a>
          <p>Answer: ${triviaData.rounds[i][questionOrPicture][j].answer}</p>
        `
      } else if (triviaData.rounds[i].type === 'lightning') {
        htmlToInsert += `
          <p>Question: ${triviaData.rounds[i][questionOrPicture][j].question}</p>
          <p>Answer: ${triviaData.rounds[i][questionOrPicture][j].answer}</p>
        `
      }
    }
    htmlToInsert += `
        </details>
      </div>
    `
  }
  document.querySelector('.rounds__existing').insertAdjacentHTML('beforeend', htmlToInsert)
}

function validateImageUrl (event) {
  if (event) {
    if (event.target.value.length > 0) {
      imageValidation(event.target.value, event.target)
    }
  }
}

function imageValidation (url, htmlElement, timeoutT) {
  const inputLabel = htmlElement.previousElementSibling
  return new Promise((resolve, reject) => {
    var timeout = timeoutT || 5000
    var timer
    const img = new window.Image()
    img.onerror = img.onabort = () => {
      clearTimeout(timer)
      // Promise.reject(new Error('Error loading image source.'))
      console.log('bad img src')
      inputLabel.innerHTML = 'URL <span class="color--red">(invalid image source)<span>'
    }
    img.onload = () => {
      clearTimeout(timer)
      resolve('success')
      inputLabel.innerHTML = 'URL <span class="color--green">(valid)<span>'
    }
    timer = setTimeout(() => {
      // reset .src to invalid URL so it stops previous
      // loading, but doens't trigger new load
      img.src = '//!!!!/noexist.jpg'
      // Promise.reject(new Error('Timeout loading image source.'))
      inputLabel.innerHTML = 'URL (invalid!)'
    }, timeout)
    img.src = url
  })
}
