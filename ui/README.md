# TOEFL Test Platform

A React-based test platform for TOEFL exams with support for multiple sections (Reading, Listening, Speaking, Writing) and various question types.

## Features

- **Setup Page**: Instructions and browser permission checks (camera and microphone)
- **Module-based Structure**: Organized test sections with navigation
- **Reading Section**: Support for passage-based and notice-based questions
- **Question Navigation**: Previous/Next navigation within modules
- **Material UI & Tailwind CSS**: Modern, responsive UI components

## Tech Stack

- React 18
- Vite
- Material UI
- Tailwind CSS
- React Router

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
  ├── components/
  │   ├── SetupPage.jsx          # Setup page with instructions and permissions
  │   ├── ModuleView.jsx         # Main module view with navigation
  │   └── questions/
  │       ├── PassageQuestion.jsx    # Passage-based question component
  │       └── NoticeQuestion.jsx     # Notice-based question component
  ├── data/
  │   └── testData.json          # Test structure and questions data
  ├── App.jsx                    # Main app component
  ├── main.jsx                   # Entry point
  └── index.css                  # Global styles
```

## Data Structure

Test data is stored in `src/data/testData.json` with the following structure:

- **Platform**: Contains setup information and modules
- **Modules**: Each module represents a section (Reading, Listening, etc.)
- **Questions**: Questions can be bundled (e.g., passage with multiple sub-questions)

## Question Types

### Reading Section

1. **Passage Questions**: A passage with 5 related questions
2. **Notice Questions**: A notice with 2 related questions

More question types can be added following the same pattern.


