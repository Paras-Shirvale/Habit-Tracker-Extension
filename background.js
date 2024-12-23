chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ habits: [], notificationsEnabled: true });
  console.log("Habit Tracker Extension installed.");
});

// Set an alarm for a new habit
function setAlarm(habit) {
  if (!habit || !habit.id || !habit.time) {
    console.error("Invalid habit data received for setting alarm.");
    return { success: false, error: "Invalid habit data." };
  }

  const [hours, minutes] = habit.time.split(":").map(Number);
  const now = new Date();
  const alarmTime = new Date();
  alarmTime.setHours(hours, minutes, 0, 0);

  // If the time has passed today, schedule for the next day
  if (alarmTime <= now) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }

  const delayInMinutes = (alarmTime.getTime() - now.getTime()) / 60000;

  chrome.alarms.create(habit.id, { delayInMinutes });
  console.log(`Alarm set for habit: ${habit.name} at ${alarmTime}`);
  return { success: true };
}

// Update an existing alarm
function updateAlarm(habit) {
  if (!habit || !habit.id || !habit.time) {
    console.error("Invalid habit data received for updating alarm.");
    return { success: false, error: "Invalid habit data." };
  }

  // Clear the existing alarm before setting a new one
  chrome.alarms.clear(habit.id, (wasCleared) => {
    if (wasCleared) {
      console.log(`Previous alarm for habit ${habit.name} cleared.`);
    }
    const result = setAlarm(habit);
    if (result.success) {
      console.log(`Alarm updated for habit: ${habit.name}`);
    } else {
      console.error("Failed to update alarm.", result.error);
    }
  });
  return { success: true };
}

// Handle messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setAlarm") {
    const result = setAlarm(message.habit);
    sendResponse(result);
  } else if (message.action === "updateAlarm") {
    const result = updateAlarm(message.habit);
    sendResponse(result);
  }
  return true; // Indicates async response
});

// Handle triggered alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.sync.get("habits", (data) => {
    const habit = (data.habits || []).find(h => h.id === alarm.name);
    if (habit) {
      chrome.notifications.create(alarm.name, {
        type: "basic",
        iconUrl: "icon.png", // Ensure an icon exists in your extension directory
        title: `Reminder for: ${habit.name}`,
        message: `Time: ${habit.time}`,
        priority: 1,
        buttons: [
          { title: "Mark as Done" }
        ]
      });
      console.log(`Notification triggered for habit: ${habit.name}`);
    }
  });
});

// Handle notification button click (Mark as Done)
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // "Mark as Done" button clicked
    chrome.storage.sync.get("habits", (data) => {
      const habits = data.habits || [];
      const habitIndex = habits.findIndex(h => h.id === notificationId);

      if (habitIndex !== -1) {
        const habit = habits[habitIndex];
        const today = new Date().toLocaleDateString();

        // Update habit streak if not done today
        if (habit.lastCompletedDate !== today) {
          habits[habitIndex].streak += 1;
          habits[habitIndex].lastCompletedDate = today;

          chrome.storage.sync.set({ habits }, () => {
            console.log(`Habit marked as done: ${habit.name}`);
          });
        } else {
          console.log("Habit already marked as done today.");
        }
      }
    });
  }
});
