<div align="center">

# 🌌 Neuralis
### *The Ultimate Cyber-Noir Student Companion & Productivity Center*

[![Try Web Version](https://img.shields.io/badge/Web_Version-Try_Online-0070f3?style=for-the-badge&logo=vercel&logoColor=white)](https://neuralis-iota.vercel.app/)
[![Landing Page](https://img.shields.io/badge/Landing_Page-Visit-7928ca?style=for-the-badge&logo=googlechrome&logoColor=white)](https://brief-theta-blush.vercel.app)
[![Download APK](https://img.shields.io/badge/Android_APK-Download-3ddc84?style=for-the-badge&logo=android&logoColor=white)](https://brief-theta-blush.vercel.app/Neuralis.apk)

</div>

---

**Neuralis** is a premium, high-end student productivity app designed to keep you on top of your college schedule, class attendance, and daily tasks with a stunning cyber-noir aesthetic. Built with React, Capacitor, and Tailwind CSS, Neuralis features deep customizability, interactive gamification, audio-haptic feedback, and a seamless Over-The-Air (OTA) hot-update pipeline.

---

## 🚀 Key Features

### 📅 Attendance Tracker
* **Stats Overview:** Keep tabs on your attendance status with interactive progress rings, custom targets, and warning status indicators if you drop below critical thresholds.
* **Monthly Calendar View:** Easily log your daily attendance (Present, Absent, Cancelled, Holiday) with a single tap.
* **Target Customizer:** Tailor your attendance goals to your college requirements (e.g., minimum 75% limit).

### 📝 Task & Homework Board
* **XP & Gamification:** Gain experience points (XP) and level up as you complete tasks.
* **Priority Sorting:** Sort your studies and personal tasks into High, Medium, and Low priorities.
* **Reminders:** Integrates local push notifications to alert you of pending tasks.

### 🏛️ College & Timetable Portal
* **Class Schedule:** Keep your weekly class timetable organized by day and hour.
* **Course Info:** Store details about your subjects, professors, and exam dates.

### 🎨 Premium Design & Customization
* **Cyber Aesthetic:** Sleek glassmorphism, responsive hover animations, and dark modes powered by Framer Motion.
* **Theme Presets:** Neon, Synthwave, Cyber-Noir, Midnight, and more.
* **Custom Backgrounds:** Pick from your local device storage, adjust zoom, and apply custom backdrop blur filters.
* **Sound & Haptic Feedback:** Play sounds for level-ups, successes, errors, and button clicks.

### 💾 Backup & Restore (Web + Native Mobile)
* **Web Browser:** Instantly exports your data as a `.json` file to your Downloads folder.
* **Native Android App:** Copy and paste your backup JSON code directly via clipboard to bypass WebView file restriction limitations.

---

## 🛠️ Technology Stack

* **Frontend Framework:** React 18 (Vite)
* **Styling:** Tailwind CSS (Fluid responsive design)
* **Animations:** Framer Motion (Transitions, modals, drag physics)
* **Native Bridge:** CapacitorJS (Android native platform)
* **OTA Updates:** Capgo Capacitor Updater (Deploy updates instantly without APK reinstalls)
* **Notifications:** Capacitor Local Notifications

---

## 💻 Local Development

### Prerequisites
* **Node.js** (v18+)
* **Android Studio** (for compiling APKs)

### Setup & Launch
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abhinav-RM/neuralis.git
   cd neuralis
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run in development server (Web Browser):**
   ```bash
   npm run dev
   ```

---

## 📱 Mobile App (Android)

To compile, sync, and deploy the application onto your Android device:

### Sync Web Assets to Android Project
Whenever you change your React frontend code, run:
```bash
npm run build && npx cap sync
```

### Build & Run the APK
1. **Open the Android project in Android Studio:**
   ```bash
   npx cap open android
   ```
2. **Build the Debug APK:**
   * In the top menu, go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   * Locate the generated APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🌐 OTA Update Engine

Neuralis uses an **Over-The-Air (OTA) hot-update pipeline** mapped through `device_targets.json`. Updates are queried on launch and applied instantly.

To release an OTA hot-update:
1. Increment the version in `constants.ts`.
2. Package the compiled web assets:
   ```bash
   npm run build && cd dist && zip -r ../dist.zip * && cd ..
   ```
3. Create a GitHub Release with the tag (e.g., `v1.0.8`) and upload the `dist.zip`.
4. Point the target configuration in `device_targets.json` to the new release link.
