# AI Prompt Enhancement Frontend

A modern React application built with TypeScript and Material-UI for enhancing AI prompts through intelligent analysis and suggestions.

## Features

- 🎨 Clean and modern UI with Material-UI components
- 🔄 Real-time prompt analysis
- 📝 Detailed suggestions with easy-to-read formatting
- ✨ Enhanced prompt display with copy-to-clipboard functionality
- 📱 Responsive design for all screen sizes
- 🎯 Professional theme based on Material Design principles

## Tech Stack

- ⚛️ React 18 with TypeScript
- 🎨 Material-UI (MUI) for components and theming
- 🔌 Axios for API communication
- ⚡ Vite for fast development and building
- 📝 TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Backend service running (see [backend setup](../backend/README.md))

### Installation

1. Clone the repository (if not already done):
```bash
git clone https://github.com/HaoyangHan/ai-prompt-enhancement.git
cd ai-prompt-enhancement/frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - Run TypeScript type checking

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000  # Backend API URL
```

### Project Structure

```
frontend/
├── src/
│   ├── config/         # Configuration files
│   │   └── api.ts     # API configuration and endpoints
│   ├── components/     # Reusable React components
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
├── public/            # Static assets
└── index.html         # HTML template
```

### API Integration

The frontend communicates with the backend API running at `http://localhost:8000`. Key endpoints:

- `POST /api/v1/prompts/analyze` - Analyze and enhance prompts
  - Request: Prompt text with optional context and preferences
  - Response: Analysis metrics, suggestions, and enhanced version

### Code Style

The project follows these coding standards:
- ESLint for code linting
- Prettier for code formatting
- TypeScript strict mode enabled
- Material-UI theme customization

## Building for Production

Create a production build:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 