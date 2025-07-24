# TypeScript Project

A modern TypeScript project with comprehensive tooling, testing, and development setup.

## Features

- 🚀 **TypeScript 5.3** with strict type checking
- 📦 **Modern tooling** (ESLint, Prettier, Jest)
- 🧪 **Testing setup** with Jest and ts-jest
- 🔧 **Development scripts** for building, testing, and linting
- 📁 **Well-organized project structure**
- 🎯 **Path mapping** for clean imports
- 📝 **Comprehensive examples** demonstrating TypeScript features

## Project Structure

```
src/
├── index.ts              # Main application entry point
├── calculator.ts         # Example class with methods
├── types/
│   └── user.ts          # Type definitions and interfaces
├── utils/
│   └── logger.ts        # Utility classes
└── __tests__/
    └── calculator.test.ts # Unit tests
```

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run the application:
   ```bash
   npm start
   ```

## Development

### Available Scripts

- `npm run dev` - Run the application in development mode with ts-node
- `npm run build` - Build the TypeScript project to JavaScript
- `npm run watch` - Build the project in watch mode
- `npm start` - Run the compiled JavaScript application
- `npm run clean` - Remove the build directory
- `npm test` - Run the test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint the TypeScript code
- `npm run lint:fix` - Lint and automatically fix issues
- `npm run format` - Format code with Prettier

### Development Workflow

1. **Start development mode:**
   ```bash
   npm run dev
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Check code quality:**
   ```bash
   npm run lint
   npm run format
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## TypeScript Configuration

The project includes comprehensive TypeScript configuration with:

- **Strict type checking** enabled
- **Path mapping** for clean imports (`@/`, `@utils/`, `@types/`)
- **Modern ES2022** target
- **Source maps** and **declaration files** generation
- **Isolated modules** for better performance

## Code Quality

- **ESLint** with TypeScript-specific rules
- **Prettier** for consistent code formatting
- **Jest** for unit testing with TypeScript support
- **Strict TypeScript** configuration for type safety

## Examples

The project includes practical examples of:

- ✅ **Classes and methods** (Calculator)
- ✅ **Interfaces and types** (User types)
- ✅ **Enums** (UserRole, LogLevel)
- ✅ **Utility types** (Omit, Pick, Partial)
- ✅ **Async/await** patterns
- ✅ **Error handling**
- ✅ **Unit testing**
- ✅ **Path mapping** imports

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Run `npm run lint` and `npm test` before committing
4. Use meaningful commit messages

## License

MIT 