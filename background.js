chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ habits: [], notificationsEnabled: true });
  console.log('Habit Tracker Extension installed.');
});

// Set the alarm for the habit
function updateNotification() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "setAlarm") {
      const habit = message.habit;
      const reminderTime = habit.time;
      
      const [hours, minutes] = reminderTime.split(":").map(Number);
      const now = new Date();
      const alarmTime = new Date();
      alarmTime.setHours(hours, minutes, 0, 0);
      
      // If the alarm time is in the past, set it for the next day
      if (alarmTime <= now) {
        alarmTime.setDate(now.getDate() + 1);
      }
      
      const delayInMinutes = (alarmTime - now) / 1000 / 60;
      
      // Set the alarm with the calculated delay
      chrome.alarms.create(habit.id, { delayInMinutes });
      
      console.log(`Alarm set for habit: ${habit.name} at ${alarmTime}`);
      sendResponse({ success: true });
    }
  
    // Update alarm when the habit time is changed
    if (message.action === "updateAlarm") {
      const habit = message.habit;
      
      // First, cancel the previous alarm
      chrome.alarms.clear(habit.id, () => {
        console.log(`Previous alarm for habit ${habit.name} cleared.`);
        
        // Now, set the new alarm for the updated time
        const reminderTime = habit.time;
        const [hours, minutes] = reminderTime.split(":").map(Number);
        const now = new Date();
        const alarmTime = new Date();
        alarmTime.setHours(hours, minutes, 0, 0);
      
        // If the alarm time is in the past, set it for the next day
        if (alarmTime <= now) {
          alarmTime.setDate(now.getDate() + 1);
        }
      
        const delayInMinutes = (alarmTime - now) / 1000 / 60;
      
        // Set the new alarm with the updated time
        chrome.alarms.create(habit.id, { delayInMinutes }, () => {
          console.log(`New alarm set for habit: ${habit.name} at ${alarmTime}`);
          sendResponse({ success: true });
        });
      });
    }
  });
}

updateNotification();

// Display notification when the alarm goes off
chrome.alarms.onAlarm.addListener((alarm) => {
chrome.storage.sync.get("habits", (data) => {
  const habit = data.habits.find(h => h.id === alarm.name);
  if (habit) {
    chrome.notifications.create(alarm.name, {
      type: "basic",
      iconUrl: "icon.png", // Make sure to have an icon in your extension directory
      title: `Reminder for: ${habit.name}`,
      message: `Time: ${habit.time}`,
      priority: 1,
      buttons: [
        {
          title: "Mark as Done"
        }
      ]
    });
  }
});
});

// Handle the "Done" button click in the notification
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
if (buttonIndex === 0) { // "Mark as Done" button clicked
  chrome.storage.sync.get("habits", (data) => {
    const habits = data.habits || [];
    const habitIndex = habits.findIndex(h => h.id === notificationId);
    if (habitIndex !== -1) {
      const habit = habits[habitIndex];
      const today = new Date().toLocaleDateString();

      // If the habit was not completed today, mark it as done
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
