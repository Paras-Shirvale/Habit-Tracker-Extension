function createHabitOverlay() {
    // Check if overlay already exists
    if (document.getElementById('habit-tracker-overlay')) return;
  
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'habit-tracker-overlay';
    overlay.classList.add('habit-tracker-overlay');
  
    // Fetch habits and settings
    chrome.storage.sync.get(['habits', 'settings'], (data) => {
      const habits = data.habits || [];
      const settings = data.settings || {};
  
      // Set overlay position
      overlay.classList.add(settings.overlayPosition || 'bottom-right');
  
      // Populate habits
      const habitList = document.createElement('div');
      habitList.classList.add('habit-list');
  
      habits.forEach((habit, index) => {
        const habitItem = document.createElement('div');
        habitItem.classList.add('habit-item');
        habitItem.innerHTML = `
          <input type="checkbox" id="habit-${index}">
          <label for="habit-${index}">${habit.name}</label>
          <span class="streak">Streak: ${habit.streak} days</span>
        `;
  
        // Handle habit completion
        habitItem.querySelector('input').addEventListener('change', (e) => {
          chrome.storage.sync.get('habits', (data) => {
            const habits = data.habits;
            if (e.target.checked) {
              habits[index].streak++;
            } else {
              habits[index].streak = Math.max(0, habits[index].streak - 1);
            }
            chrome.storage.sync.set({ habits });
          });
        });
  
        habitList.appendChild(habitItem);
      });
  
      overlay.appendChild(habitList);
      document.body.appendChild(overlay);
    });
  }
  
  // Inject overlay on page load
  createHabitOverlay();
  
  // Re-inject if habits change
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.habits) {
      // Remove existing overlay and recreate
      const existingOverlay = document.getElementById('habit-tracker-overlay');
      if (existingOverlay) existingOverlay.remove();
      createHabitOverlay();
    }
  });