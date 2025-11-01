// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  const backButton = document.querySelector('.back-button');
  if (backButton) {
    backButton.addEventListener('click', function() {
      history.back();
    });
  }
});

