# 🖼️ BrutViz

**BrutViz** is a high-performance, **Neo-Brutalist** data visualization and analysis platform powered by **Gemini AI**. It transforms raw datasets into beautiful, actionable insights with a focus on speed, clarity, and bold design.

[![BrutViz Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://brutviz.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20|%20TypeScript%20|%20Tailwind-blue)](#-tech-stack)
[![AI Power](https://img.shields.io/badge/AI-Gemini%20Flash-orange)](#-ai-intelligence)

---

## ✨ Features

### 🧠 AI Intelligence (BrutViz AI)
- **Deep Context Analysis**: Injects statistical truths (outliers, distributions) directly into the LLM context.
- **Natural Language Querying**: Ask questions like *"Who is our top performer?"* or *"Compare sales by region"* and get instant charts.
- **Automated Charting**: Generates Recharts configurations on the fly based on your data structure.

### 🎨 Neo-Brutalist Design
- **High-Contrast Interface**: Bold black borders, vibrant primary colors, and a clean, raw aesthetic.
- **Glassmorphism & Motion**: Subtle backdrop blurs and fluid Framer Motion animations.
- **Responsive Layout**: Optimized for every screen size, from mobile to ultra-wide monitors.

### 📊 Data Operations
- **Privacy First**: All data processing happens locally in your browser (IndexedDB).
- **Interactive Stickers**: Annotate your charts with drag-and-drop "Stickers" for presentations.
- **PDF Export**: Generate high-fidelity analysis reports with a single click.
- **History Shelf**: Automatically saves your recent sessions for easy retrieval.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI**: [Google Gemini Flash 1.5](https://ai.google.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Storage**: [idb-keyval](https://github.com/jakearchibald/idb-keyval) (IndexedDB)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Iam-samyog/BrutViz.git
cd BrutViz
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development
```bash
npm run dev
```

---

## 📁 Project Structure

- `/components`: Modular UI components (Dashboard, ChartGenerator, ChatInterface, etc.)
- `/lib`: Core logic for data transformations and AI insight generation.
- `/public`: Static assets and demo data.
- `/app`: Next.js App Router pages and layouts.

---

## 🤖 Daily Improvement Agent

BrutViz includes an intelligent **Daily Improvement Agent** that automatically:
- 📦 Updates dependencies and security patches
- 🔒 Runs security audits and fixes vulnerabilities
- ✨ Improves code quality with linting and formatting
- ⚡ Optimizes performance and detects unused code
- 📚 Keeps documentation up-to-date
- 🤖 Provides AI-powered code review suggestions using Gemini

**The agent runs automatically every day** and creates pull requests with improvements. It takes the project to the next level by continuously maintaining and enhancing code quality, security, and performance.

[📖 Learn more about the Daily Improvement Agent](.github/AGENT_README.md)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

Developed with 🖤 by the **BrutViz Team**.
