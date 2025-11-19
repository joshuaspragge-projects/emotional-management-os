Neural O.S. (Oh S***)

A Universal Stability Interface for Crisis Triage.
Deployed as a Single-File React Application (PWA Ready)

🧠 
The Mission

Neural O.S. is not a meditation app. 
It is a "Cockpit" for the autonomic nervous system. It is designed for moments when the Prefrontal Cortex (logic) is offline and the Amygdala (fear) is driving.
It serves two primary user groups:
The Individual in Crisis: Rapid biological overrides (haptics, visuals, audio) to ground the nervous system.

The Field Helper: Tools for peer support workers, outreach teams, and volunteers to co-regulate and navigate resources for others.

🎛️ The "Oh S***" Context Engine

The app features a Situation Selector on launch that reconfigures the entire UI for specific crisis states:

Use Case
Configured State"The 'Oh S*' Moment"**Mode: Self  Tool: Breath Pacer (Immediate Launch)  
AI: Grounding Persona"
"I'm a Helper"
Mode: Helper (Scripts change to "Ask them...")  Tab: Network (Resources)  

AI: Field Medic
"Housed but Hungry"
Mode: Self  Tab: Network (Filtered: Food, Low Effort) 

AI: Service Navigator
"Entering Detox"

Mode: Self  AI: The Cynic (Trauma Bonding Specialist)🚀 Quick Start (Replit / Local)PrerequisitesNode.js & npmA 
Google Gemini API Key (Free tier available at aistudio.google.com)
Installation Clone this repo. Install dependencies:npx create-react-app neural-os

cd neural-os
npm install lucide-react

Inject the Code:Replace src/App.js (or src/App.jsx) with the contents of neural_regulation_os.jsx.

Configure API:
Insert your Gemini API Key in the const apiKey = "" variable at the very top of the file.
Run:npm start

🛠️ Architecture
Single-File React: Designed to be "copy-paste" deployable.
Local Database: Resource data (calgary_resources.js logic) is embedded directly in the file for offline reliability.
PWA Strategy: CSS hides scrollbars and locks viewports (100dvh) to mimic a native app experience on mobile.
Haptic Bridge: Uses the navigator.vibrate API to provide physical feedback for breathing/grounding tools.🤝 
ContributingThis project uses a "Low Effort" design philosophy to ensure accessibility during distress.

Constraint 1: No login screens (Barriers kill engagement).
Constraint 2: No tracking (Safety is paramount).
Constraint 3: Offline first (Resources must load without data).
License: MIT
