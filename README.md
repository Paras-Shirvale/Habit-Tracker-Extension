# Habit Tracker: A Chrome Extension

The **Habit Tracker** is a browser extension designed to help users develop and maintain positive habits by integrating interactive features and helpful visuals into their daily routines. This extension provides users with tools to track their habits and receive gentle reminders to stay on track.

## Features

- **Overlay**: Displays habit-related overlays using `overlay.js` to help users stay motivated and engaged.
- **Popup Interface**: Offers a user-friendly interface (`popup.html` and `popup.js`) for users to interact with and track their habits.
- **Background Scripts**: Uses `background.js` for managing background events and maintaining state across sessions.
- **Custom Styling**: Aesthetic design implemented through `style.css` for a polished and cohesive user experience.
- **Custom Icon**: A custom extension icon (`icon.png`) for easy identification in the browser toolbar.

## File Structure

Here is a breakdown of the files in the project:

- **`overlay.js`**: Contains the logic for displaying overlays related to habit-building functionality.
- **`popup.html`**: Defines the structure and layout of the extension's popup interface.
- **`manifest.json`**: The configuration file that defines the extension's metadata and permissions.
- **`icon.png`**: The icon used for the browser extension.
- **`background.js`**: Handles background events, manages persistent data, and maintains the extension's state.
- **`popup.js`**: Adds interactivity and dynamic behavior to the popup interface.
- **`style.css`**: Styles the popup interface for a smooth and enjoyable user experience.

## Installation

Follow these steps to install the **Habit Extension** in your browser:

1. **Clone or Download the Repository**
   - Clone the repository using Git:
     ```bash
     git clone https://github.com/yourusername/habit-extension.git
     ```
   - Or download the ZIP file and extract it to a folder on your computer.

2. **Open Your Chrome Browser**
   - Go to `chrome://extensions/`

3. **Enable Developer Mode**
   - Toggle **Developer mode** on (usually found in the top-right corner).

4. **Load the Extension**
   - Click **Load unpacked** and select the folder containing the extracted files.

5. The **Habit Extension** will now be installed and visible in your browser's extension bar.

---

## Usage

1. **Open the Popup**
   - Click on the **Habit Extension** icon in the browser toolbar to open the popup interface.

2. **Track Your Habits**
   - Interact with the features to add, track, and maintain your habits.

3. **Additional Options**
   - Additional options or overlays will appear based on your configuration and preferences.

---

## Development

To contribute or modify this project, follow these steps:

1. **Set Up Your Development Environment**
   - Ensure you have a **text editor** or **IDE** installed (e.g., [Visual Studio Code](https://code.visualstudio.com/)).

2. **Modify the Source Files**
   - Modify the source code files as needed to add features or make changes.

3. **Reload the Extension**
   - After modifying the source files, go to the **Extensions** page in your browser and click the **Reload** button next to the Habit Extension to apply your changes.
