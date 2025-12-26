# Typewriter Diary

A distraction-free, vintage mechanical typewriter web application designed for focused writing.

![Typewriter Diary Preview](./public/vite.svg)

## Features

- **Authentic Mechanical Sounds**: Physically modeled sound engine featuring "zip" carriage returns, thudding spacebars, and random mechanical key variations.
- **Visual Immersion**:
  - Realistic wood desk background (Ghibli-inspired).
  - Detailed SVG typewriter illustration.
  - Paper grain texture and "ink bleed" font rendering.
  - Custom blinking block caret.
- **Distraction-Free Interface**: UI controls fade away when not in use.
- **Functionality**:
  - **Multi-Entry System**: Save, load, and delete multiple diary entries locally.
  - **Snapshot**: Capture high-resolution images of your writing.
  - **Local Storage**: Your data stays private in your browser.
  - **Export**: Download entries as `.txt` files.

## tech Stack

- **React** (TypeScript)
- **Vite**
- **Web Audio API** (for low-latency procedural sound)
- **html2canvas** (for snapshots)
- **Pure CSS** (no heavy UI frameworks)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kalpveer/Typewriter.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Credits

**Made by Kalp Veer**
