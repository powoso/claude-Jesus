# ✝️ Daily Walk

**Your personal space to grow closer to Jesus, one day at a time.**

Daily Walk is a Jesus-centered devotional and spiritual growth web application designed to help believers nurture their relationship with God through daily Scripture, prayer, and reflection. Built with love, for the glory of God.

> *"I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life."* — John 8:12

## Live Sites

- **[daily-walk.com](https://daily-walk.com)**
- **[daily-walk.app](https://daily-walk.app)**

---

## Features Overview

- 📖 **Daily Devotionals** — Start each day with a curated Bible verse and thought-provoking reflection questions
- 🙏 **Prayer Journal** — Write prayer requests, track categories, and celebrate answered prayers with a beautiful testimony timeline
- 📚 **Bible Reading Plans** — Follow structured plans (Bible in a Year, Gospels in 30 Days, and more) with progress tracking
- 🧠 **Scripture Memory Studio** — Memorize verses with First Letter, Fill in the Blank, and Full Recall practice modes
- 💛 **Worship & Gratitude Wall** — Capture gratitude notes and praise reports in a beautiful masonry card layout
- 📈 **Spiritual Growth Tracker** — Weekly check-ins with visual charts showing your growth journey over time
- 🌙 **Dark Mode** — Beautiful deep navy theme with soft gold accents
- ♿ **Accessible** — Semantic HTML, keyboard navigable, screen reader friendly
- 🔒 **Private** — All data stored locally on your device. No accounts, no servers, no tracking.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Smooth animations and transitions |
| **Recharts** | Data visualization for growth tracking |
| **Lucide React** | Beautiful icon set |
| **React Context** | State management |
| **localStorage** | Client-side data persistence |

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **macOS** (compatible with Ventura, Sonoma, Sequoia) or any modern OS
- **Node.js** v18 or higher
- **npm** (comes with Node.js) or **yarn**
- **Git**

### Install Node.js via Homebrew (macOS)

```bash
brew install node
```

If you don't have Homebrew installed:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## Installation on macOS

Follow these steps to get Daily Walk running on your machine:

### Step 1: Install Homebrew (if not already installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Install Node.js

```bash
brew install node
```

### Step 3: Verify installations

```bash
node --version   # Should be v18+
npm --version    # Should be v9+
```

### Step 4: Clone the repository

```bash
git clone <repo-url>
cd daily-walk
```

### Step 5: Install dependencies

```bash
npm install
```

### Step 6: Run the development server

```bash
npm run dev
```

### Step 7: Open in your browser

Navigate to [http://localhost:3000](http://localhost:3000) and begin your walk!

---

## Building for Production

```bash
# Create an optimized production build
npm run build

# Start the production server
npm start
```

---

## Project Structure

```
daily-walk/
├── public/              # Static assets and favicon
│   └── favicon.svg      # Cross icon favicon
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── page.tsx     # Landing page
│   │   ├── layout.tsx   # Root layout with providers
│   │   ├── globals.css  # Global styles and design tokens
│   │   ├── devotional/  # Daily devotional page
│   │   ├── prayer/      # Prayer journal page
│   │   ├── reading/     # Bible reading plans page
│   │   ├── memory/      # Scripture memory studio
│   │   ├── gratitude/   # Worship & gratitude wall
│   │   ├── growth/      # Spiritual growth tracker
│   │   ├── settings/    # App settings page
│   │   └── about/       # About page
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Base design system (Button, Card, Modal, etc.)
│   │   └── navigation/  # Sidebar and layout components
│   ├── contexts/        # React Context providers
│   │   └── AppContext.tsx
│   ├── data/            # JSON datasets
│   │   ├── verses.ts    # 366 curated Bible verses
│   │   └── reading-plans.ts
│   ├── hooks/           # Custom React hooks
│   │   └── useLocalStorage.ts
│   └── lib/             # Utilities, constants, and types
│       ├── types.ts
│       └── utils.ts
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## Customization Guide

### Adding New Verses

Edit `src/data/verses.ts` to add or modify daily verses:

```typescript
{ id: 367, reference: "Psalm 23:1", text: "The Lord is my shepherd, I lack nothing.", theme: "Comfort" }
```

### Modifying Reading Plans

Edit `src/data/reading-plans.ts` to add new plans or modify existing ones. Each plan needs an `id`, `name`, `description`, `duration`, `totalDays`, and a `readings` array.

### Changing Colors

The color palette is defined in `src/app/globals.css` using CSS custom properties:

```css
:root {
  --bg-primary: #FFFDF7;    /* Cream background */
  --accent: #7C9070;         /* Sage green */
  --accent-gold: #C9A84C;   /* Warm gold */
}
```

---

## Troubleshooting

### Port 3000 is already in use

```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or run on a different port
npm run dev -- -p 3001
```

### Node version issues

```bash
# Check your Node version
node --version

# If below v18, update via Homebrew
brew upgrade node
```

### Build errors after pulling updates

```bash
# Clear Next.js cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

---

## Contributing

Contributions are welcome! If you'd like to help improve Daily Walk:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing patterns and includes appropriate TypeScript types.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

*Built with love for the glory of God*

> *"Whatever you do, work at it with all your heart, as working for the Lord, not for human masters."*
> — Colossians 3:23

</div>
