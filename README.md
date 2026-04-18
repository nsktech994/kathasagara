# Kathasagara

A web application for reading and listening to stories with AI-powered features.

## Features

- Story reading and discovery
- Audio narration with read-along functionality
- AI-powered story generation using OpenRouter API
- AI-powered narration using Gemini API
- AI-powered chat assistance for stories
- User accounts with favorites and reading history
- Multi-language support
- Responsive design for mobile and desktop

## Technology Stack

- **Frontend**: React with Vite, Tailwind CSS, Radix UI components
- **Backend**: Node.js with Express, tRPC for type-safe APIs
- **Database**: MySQL with Drizzle ORM
- **Authentication**: JWT-based with OAuth support
- **File Storage**: AWS S3 integration
- **AI Features**: Integration with language models for chat assistance

## Getting Started

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Node.js server
- `/drizzle` - Database schema and migrations
- `/shared` - Shared types and utilities
- `/patches` - Dependency patches

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Create production build
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm format` - Format code with Prettier
- `pnpm db:push` - Run database migrations

### Environment Variables

See the `.env.example` file or INSTALL.md for required environment variables.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing-feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with ❤️ for story lovers everywhere