# Trend Tripper 🌍✈️

**Trend Tripper** is a modern, production-ready travel and experience platform that connects travelers with amazing destinations, monuments, events, and local experiences.

## 🌟 Features

### 🏛️ **Discover (Circle-to-Search)**
Upload or circle a monument image to instantly identify it. Get detailed information including:
- Historical timeline
- Old vs. new images comparison
- Rich historical context

### 🎭 **Mood Recommender**
Select your current mood and receive personalized recommendations:
- Food spots matching your vibe
- Activities and outings
- Swipeable card interface

### 🆘 **SOS Runner**
Emergency assistance at your fingertips:
- Floating SOS button
- Automatic location capture
- Instant emergency alert system

### 🎉 **Events**
Discover nearby events and experiences:
- Grid layout with beautiful cards
- Date, location, and pricing information
- Category filtering
- One-click booking

### 💰 **Budget Planner**
Plan your perfect trip within budget:
- Detailed cost breakdown
- Visual charts and summaries
- Customizable preferences
- Money-saving tips

### 🏨 **Hotels**
Find your ideal accommodation:
- Comprehensive hotel listings
- Rating and amenity filters
- Beautiful image galleries
- Instant booking

### 🚆 **Travel Booking**
Book all your travel needs:
- Flights, trains, and cabs
- Comparison interface
- Detailed schedules and pricing
- Multi-modal booking options

## 🎨 Design System

Trend Tripper features a carefully crafted design system inspired by modern travel platforms:

- **Primary Color**: Deep teal (ocean/adventure theme)
- **Secondary Color**: Sunset coral
- **Accent Color**: Golden amber
- **Typography**: Clean, modern sans-serif
- **Components**: Card-based layouts with smooth animations
- **Responsive**: Fully responsive design for all devices

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: shadcn/ui
- **Routing**: React Router v6
- **State Management**: React Query
- **Build Tool**: Vite
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Navbar.tsx      # Navigation bar
│   ├── Footer.tsx      # Footer component
│   ├── SOSButton.tsx   # Emergency SOS button
│   └── LoadingSpinner.tsx
├── pages/              # Page components
│   ├── Home.tsx        # Landing page
│   ├── Discover.tsx    # Monument identification
│   ├── Mood.tsx        # Mood-based recommendations
│   ├── Events.tsx      # Events listing
│   ├── Budget.tsx      # Budget planner
│   ├── Hotels.tsx      # Hotel listings
│   └── Travel.tsx      # Travel booking
├── lib/                # Utilities and helpers
│   ├── api.ts          # API integration layer
│   ├── mockData.ts     # Mock data for demo
│   └── utils.ts        # Utility functions
├── assets/             # Images and static assets
└── index.css           # Global styles and design tokens
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd trend-tripper
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your API base URL in `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 🔌 Backend Integration

The application is designed to work with a Python REST API backend. API integration points are configured in `src/lib/api.ts`.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/monument` | POST | Identify monument from image |
| `/api/mood` | GET | Get mood-based recommendations |
| `/api/sos` | POST | Send emergency SOS |
| `/api/events` | GET | Fetch nearby events |
| `/api/budget` | POST | Calculate trip budget |
| `/api/hotel` | GET | List available hotels |
| `/api/travel` | GET | Get travel options |

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🎯 Key Features

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interactions

### Smooth Animations
- Fade-in effects
- Scale transitions
- Hover states
- Loading animations

### Performance
- Code splitting
- Lazy loading
- Optimized images
- Fast page transitions

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

## 📦 Build and Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Docker Support (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "preview"]
```

Build and run:
```bash
docker build -t trend-tripper .
docker run -p 8080:8080 trend-tripper
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses:
- ESLint for code linting
- TypeScript for type safety
- Prettier-compatible formatting

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Design inspiration from Netflix, BookMyShow, and Airbnb
- UI components from shadcn/ui
- Icons from Lucide React
- Images from Unsplash

## 📞 Support

For support, email support@trendtripper.com or join our Discord community.

---

Built with ❤️ by the Trend Tripper team
