document.addEventListener('DOMContentLoaded', () => {
  const greetBtn = document.getElementById('greet-btn');
  const message = document.getElementById('message');

  const greetings = [
    '👋 Hello from your extension!',
    '🚀 You\'re doing great!',
    '✨ Welcome aboard!',
    '🌟 Nice to see you!',
    '🎉 Extension is alive!',
    '💡 Let\'s build something awesome!',
    '🔥 You\'re on fire!',
    '🌈 Have a wonderful day!'
  ];

  let lastIndex = -1;

  greetBtn.addEventListener('click', () => {
    // Pick a random greeting, avoid repeats
    let index;
    do {
      index = Math.floor(Math.random() * greetings.length);
    } while (index === lastIndex);
    lastIndex = index;

    // Animate the message
    message.classList.remove('show');
    
    setTimeout(() => {
      message.textContent = greetings[index];
      message.classList.add('show');
    }, 150);
  });
});
