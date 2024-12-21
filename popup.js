// Render the habits list based on a given sorting criteria
function renderHabits(sortBy = "name", searchQuery = "") {
  chrome.storage.sync.get("habits", (data) => {
    const habitList = document.getElementById("habit-list").getElementsByTagName('tbody')[0];
    habitList.innerHTML = ""; // Clear the habit list

    if (data.habits && data.habits.length > 0) {
      // Filter the habits by the search query
      const filteredHabits = data.habits.filter(habit => 
        habit.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Sort the habits based on the selected criterion
      filteredHabits.sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name); // Sort by name alphabetically
        } else if (sortBy === "time") {
          return a.time.localeCompare(b.time); // Sort by time
        } else if (sortBy === "streak") {
          return b.streak - a.streak; // Sort by streak (highest first)
        }
        return 0;
      });

      // Render the sorted and filtered habits
      filteredHabits.forEach((habit) => {
        const row = document.createElement("tr");

        // Check if the habit was done today
        const lastCompletedDate = habit.lastCompletedDate || '';
        const today = new Date().toLocaleDateString();
        const isDoneToday = lastCompletedDate === today;

        row.innerHTML = `
          <td class="editable" data-field="name" data-id="${habit.id}">${habit.name}</td>
          <td class="editable" data-field="time" data-id="${habit.id}">${habit.time}</td>
          <td>${habit.streak || 0} days</td>
          <td>
            <button class="done-btn" data-id="${habit.id}" ${isDoneToday ? 'disabled' : ''} style="${isDoneToday ? 'background-color: grey;' : ''}">
              ${isDoneToday ? 'Done Today' : 'Mark as Done'}
            </button>
            <button class="reset-streak-btn" data-id="${habit.id}">Reset</button>
            <button class="delete-btn" data-id="${habit.id}">Delete</button>
          </td>
        `;
        habitList.appendChild(row);
      });
    }
  });
}

// Add new habit
function addHabit() {
  const newHabitInput = document.getElementById("new-habit");
  const reminderTime = document.getElementById("reminder-time").value;
  const habitName = newHabitInput.value;

  if (habitName && reminderTime) {
    chrome.storage.sync.get("habits", (data) => {
      const habits = data.habits || [];
      const id = `habit_${Date.now()}`; // Unique ID for the habit
      const newHabit = {
        id,
        name: habitName,
        time: reminderTime,
        streak: 0,
        lastCompletedDate: ''
      };
      habits.push(newHabit);

      chrome.storage.sync.set({ habits }, () => {
        // Send message to background script to set the alarm
        chrome.runtime.sendMessage(
          { action: "setAlarm", habit: newHabit },
          (response) => {
            if (response.success) {
              console.log(`Alarm set for: ${habitName}`);
            } else {
              console.error("Failed to set alarm.");
            }
          }
        );
        renderHabits(); // Re-render the habit list
      });
    });

    // Clear input fields after adding the habit
    newHabitInput.value = "";
    document.getElementById("reminder-time").value = "";
  } else {
    alert("Please enter both a habit name and a reminder time.");
  }
}

// Add event listener for the "Add Habit" button
document.getElementById("add-habit").addEventListener("click", addHabit);

// Handle sorting changes
document.getElementById("sort-select").addEventListener("change", (event) => {
  const sortBy = event.target.value;
  const searchQuery = document.getElementById("search-habit").value; // Get current search query
  renderHabits(sortBy, searchQuery); // Re-render with sorting and search query
});

// Handle search input
document.getElementById("search-habit").addEventListener("input", (event) => {
  const searchQuery = event.target.value;
  const sortBy = document.getElementById("sort-select").value; // Get current sorting criteria
  renderHabits(sortBy, searchQuery); // Re-render with search query and selected sort
});

// Handle clicks on the habit list (Done, Reset, Delete buttons)
document.getElementById("habit-list").addEventListener("click", (event) => {
  const habitId = event.target.dataset.id;

  if (event.target.classList.contains("done-btn")) {
    const today = new Date().toLocaleDateString();
    chrome.storage.sync.get("habits", (data) => {
      const habits = data.habits || [];
      const habit = habits.find(h => h.id === habitId);

      if (habit && habit.lastCompletedDate !== today) {
        habit.streak += 1;
        habit.lastCompletedDate = today;

        chrome.storage.sync.set({ habits }, renderHabits);
      } else {
        alert("You have already marked this habit as done today.");
      }
    });
  }

  if (event.target.classList.contains("reset-streak-btn")) {
    const habitName = event.target.closest("tr").querySelector('[data-field="name"]').innerText;
    const habitStreak = event.target.closest("tr").querySelector('td:nth-child(3)').innerText.split(' ')[0];
    const confirmReset = confirm(`Your current streak for "${habitName}" is ${habitStreak} days. Are you sure you want to reset the streak? This action can't be undone. 😱`);
    if (confirmReset) {
      chrome.storage.sync.get("habits", (data) => {
        const habits = data.habits || [];
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
          habit.streak = 0;
          habit.lastCompletedDate = '';

          chrome.storage.sync.set({ habits }, renderHabits);
        }
      });
    }
  }

  if (event.target.classList.contains("delete-btn")) {
    const habitName = event.target.closest("tr").querySelector('[data-field="name"]').innerText;
    const confirmDelete = confirm(`Are you sure you want to delete the habit "${habitName}"? This action cannot be undone. 😱`);
    if (confirmDelete) {
      chrome.storage.sync.get("habits", (data) => {
        const habits = data.habits || [];
        const habitIndex = habits.findIndex(h => h.id === habitId);
        if (habitIndex !== -1) {
          habits.splice(habitIndex, 1); // Remove the habit by id

          chrome.storage.sync.set({ habits }, renderHabits);
        }
      });
    }
  }
});

// Handle double-click for editing habit name and time
document.getElementById("habit-list").addEventListener("dblclick", (event) => {
  if (event.target.classList.contains("editable")) {
    const field = event.target.dataset.field;
    const habitId = event.target.dataset.id;
    const newValue = prompt(`Edit ${field.charAt(0).toUpperCase() + field.slice(1)}:`, event.target.innerText);

    // Validate the time format for time field
    if (field === "time") {
      const timeFormat = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/; // HH:MM format
      if (!newValue.match(timeFormat)) {
        alert("Invalid time format. Please enter time in the format HH:MM (e.g., 14:30).");
        return;
      }
    }

    if (newValue && newValue !== event.target.innerText) {
      chrome.storage.sync.get("habits", (data) => {
        const habits = data.habits || [];
        const habit = habits.find(h => h.id === habitId);

        if (habit) {
          habit[field] = newValue;

          chrome.storage.sync.set({ habits }, () => {
            renderHabits(); // Re-render the habit list
            alert(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
          });

          // Update alarm for time change if the field edited was 'time'
          if (field === "time") {
            chrome.runtime.sendMessage({ action: "updateNotification", habit: habit }, (response) => {
              if (response.success) {
                console.log(`Alarm updated for: ${habit.name}`);
              } else {
                console.error("Failed to update alarm.");
              }
            });
          }
        }
      });
    }
  }
});

// Render habits when the popup is opened
document.addEventListener("DOMContentLoaded", () => {
  renderHabits(); // Initial render with default sorting
});




  // Reset Streak to zero if the Done is not clicked for the day.
  // Editable or Customizable Name and Time for the habit. Notification at edited time.
  // If there are tow habits at the same time, the notification should be shown for both the habits.
  // If habit is done, the notification should not be shown.