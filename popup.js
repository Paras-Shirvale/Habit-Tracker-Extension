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
            <button class="edit-btn" data-id="${habit.id}">Edit</button>
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

// Handle clicks on the habit list (Done, Reset, Delete, Edit buttons)
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
    chrome.storage.sync.get("habits", (data) => {
      const habits = data.habits || [];
      const habit = habits.find(h => h.id === habitId);

      if (habit) {
        const confirmReset = confirm(`Reset streak for "${habit.name}"?`);
        if (confirmReset) {
          habit.streak = 0;
          habit.lastCompletedDate = '';

          chrome.storage.sync.set({ habits }, renderHabits);
        }
      }
    });
  }

  if (event.target.classList.contains("delete-btn")) {
    chrome.storage.sync.get("habits", (data) => {
      const habits = data.habits || [];
      const updatedHabits = habits.filter(habit => habit.id !== habitId);

      chrome.storage.sync.set({ habits: updatedHabits }, renderHabits);
    });
  }

  if (event.target.classList.contains("edit-btn")) {
    chrome.storage.sync.get("habits", (data) => {
      const habits = data.habits || [];
      const habitToEdit = habits.find(habit => habit.id === habitId);

      if (habitToEdit) {
        const newName = prompt("Edit Habit Name:", habitToEdit.name);
        const newTime = prompt("Edit Reminder Time (HH:MM):", habitToEdit.time);

        if (newName && newTime) {
          habitToEdit.name = newName;
          habitToEdit.time = newTime;

          chrome.storage.sync.set({ habits }, () => {
            renderHabits();
            alert("Habit updated successfully!");

            // Update alarm
            chrome.runtime.sendMessage(
              { action: "updateAlarm", habit: habitToEdit },
              (response) => {
                if (!response.success) {
                  console.error("Failed to update alarm.");
                }
              }
            );
          });
        } else {
          alert("Habit name and time cannot be empty.");
        }
      }
    });
  }
});

// Handle double-click for inline editing
document.getElementById("habit-list").addEventListener("dblclick", (event) => {
  if (event.target.classList.contains("editable")) {
    const field = event.target.dataset.field;
    const habitId = event.target.dataset.id;
    const newValue = prompt(`Edit ${field}:`, event.target.innerText);

    if (field === "time") {
      const timeFormat = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!newValue.match(timeFormat)) {
        alert("Invalid time format. Use HH:MM.");
        return;
      }
    }

    if (newValue) {
      chrome.storage.sync.get("habits", (data) => {
        const habits = data.habits || [];
        const habit = habits.find(h => h.id === habitId);

        if (habit) {
          habit[field] = newValue;

          chrome.storage.sync.set({ habits }, renderHabits);
        }
      });
    }
  }
});

// Initial render when popup opens
document.addEventListener("DOMContentLoaded", () => {
  renderHabits();
});
