// on page load
document.addEventListener('DOMContentLoaded', () => { updateFormAction() }, false)

function updateFormAction (event) {
  if (event !== undefined) {
    document.querySelector('.form__player').action = (event.target.value !== '') ? `/join?roomCode=${event.target.value}` : '/'
  }
}
