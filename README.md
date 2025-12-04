<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/kaylachenn/canvas-helper">
   <img width="125" height="126" alt="image" src="https://github.com/user-attachments/assets/fa95e8b1-135c-4a69-8f7f-af2d5b8cc273" />
  </a>
  
<h3 align="center">Canvas Helper</h3>

  <p align="center">
    A Chrome Extension that helps college students manage Canvas assignments with AI-powered time management recommendations.
    <br />
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Technology Stack</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

Canvas Helper is a Chrome Extension designed to reduce academic stress and improve time management for college students using Canvas. The extension automatically fetches upcoming assignments, intelligently recommends when to start working on each task, and provides a clean and organized interface for tracking coursework.

**Key Highlights:**

- **AI-Powered Analysis**: Optional integration with Google Gemini 2.0 Flash API to analyze assignment difficulty and suggest optimal start dates based on assignment type, point value, and typical time requirements
- **Smart Prioritization**: Four-tier urgency system (Urgeny, High, Medium, Low) that dynamically adjusts based on due dates and buffer preferences
- **Customizable Settings**: User-configurable buffer days setting and AI analysis toggle
- **Automatic Filtering**: Excludes completed assignments and focuses on upcoming work due within 30 days
- **Seamless Integration**: Works directly within Canvas pages using session-based authentication

This project was developed as a productivity tool to help students proactively manage their workload rather than reacting to last-minute deadlines. This is also a part of my WiCSE Shadowing Program experience! Shoutout to my mentor, Muning!

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Technology Stack

- [![Chrome Extension][Chrome]][Chrome-url]
- [![React][React.js]][React-url]
- [![Vite][Vite]][Vite-url]
- [![TailwindCSS][TailwindCSS]][Tailwind-url]
- [![Google Gemini][Gemini]][Gemini-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

- Node.js
- npm
- Google Chrome browser
- Canvas LMS account
- (Optional) Google Gemini API key for AI-powered analysis

### Installation

#### 1. Clone the Repository

```sh
git clone https://github.com/kaylachenn/canvas-helper.git
cd canvas-helper
```

#### 2. Install Dependencies

```sh
npm install
```

#### 3. Build the Extension

```sh
npm run build
```

This will create a `dist` folder with the compiled extension.

#### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `dist` folder from your project directory

#### 5. (Optional) Configure AI Analysis

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open the Canvas Helper extension popup
3. Click the settings icon (user icon in the top right)
4. Enable "AI Assignment Analyzer"
5. Enter your Gemini API key
6. Click "Save Preferences"

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE -->

## Usage

1. Navigate to any Canvas page (e.g., `https://yourschool.instructure.com`)
2. Click the Canvas Helper extension icon in your Chrome toolbar
3. The extension will automatically fetch your upcoming assignments
4. View assignments organized by priority and recommended start dates
5. Click any assignment title to open it directly in Canvas
6. Assignments marked "AI Analyzed" have personalized start date recommendations

**Settings Options:**

- **Buffer Days**: Number of days before due date to start working (default: 3)
- **AI Analysis**: Enable/disable Gemini AI-powered recommendations
- **API Key**: Store your Gemini API key securely in Chrome's sync storage

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FEATURES -->

## Features

 ★ **Automatic Assignment Fetching** - Retrieves assignments from all enrolled Canvas courses  
 ★ **Smart Filtering** - Excludes completed assignments and overdue items  
 ★ **AI-Powered Recommendations** - Optional Gemini API integration for intelligent start date suggestions  
 ★ **Urgency Classification** - Color-coded priority levels (Critical, High, Medium, Low)  
 ★ **Customizable Buffer Days** - Set your preferred preparation timeframe  
 ★ **Upcoming Assignments View** - Focus on assignments due within the next 30 days  
 ★ **Direct Canvas Links** - One-click access to assignment details  
 ★ **Persistent Preferences** - Settings sync across devices via Chrome storage  
 ★ **Rate Limiting Protection** - Built-in delays to prevent API throttling

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- [Canvas LMS API Documentation](https://canvas.instructure.com/doc/api/)
- [Google Gemini API](https://ai.google.dev/)
- [Chrome Extension Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [React Icons](https://react-icons.github.io/react-icons/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vite Chrome Extension Plugin](https://github.com/samrum/vite-plugin-web-extension)
- This README was adapted from a template provided by [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vite]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Chrome]: https://img.shields.io/badge/Chrome_Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white
[Chrome-url]: https://developer.chrome.com/docs/extensions/
[Gemini]: https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white
[Gemini-url]: https://ai.google.dev/
