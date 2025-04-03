# Autotune Chrome Extension

A Chrome extension that enhances your text using AI, making your writing more professional, engaging, and polished.

## Features

- **Text Enhancement**: Improve your writing with AI-powered suggestions
- **Customizable Parameters**: Fine-tune the enhancement style to match your needs
- **Easy to Use**: Simply select text and click the extension icon to enhance
- **Multiple Enhancement Modes**: Choose from various enhancement styles
- **Real-time Preview**: See how your text will look before applying changes

## Installation

### From Chrome Web Store (Recommended)
1. Visit the Chrome Web Store listing (coming soon)
2. Click "Add to Chrome"
3. Follow the prompts to install the extension

### Local Development Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/davidals/autotune-extension.git
   cd autotune-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `src` directory from this project

4. Configure your API key:
   - Click the extension icon
   - Go to Options
   - Enter your OpenAI API key
   - Save your settings

## Usage

1. Select any text on a webpage
2. Click the Autotune extension icon
3. Choose your desired enhancement style
4. Click "Enhance" to apply the changes
5. Review and accept or reject the suggested changes

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Chrome browser

### Running Tests
```bash
npm test
```

### Project Structure
```
autotune/
├── src/
│   ├── core/           # Core extension functionality
│   ├── services/       # External service integrations
│   ├── ui/            # User interface components
│   └── utils/         # Utility functions
├── tests/             # Test files
├── icons/             # Extension icons
└── manifest.json      # Extension configuration
```

## Development Process

This project was developed using Cursor AI Agent, an AI-powered development environment. The development process followed these principles:

- Most of the code was written with the assistance of Cursor AI Agent
- Commits marked with `no-vibes` indicate code that was written independently by a human developer without AI assistance
- The project follows test-driven development (TDD) practices
- All code changes are thoroughly tested before being committed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the AI capabilities
- The Chrome Extensions team for their excellent documentation
- Cursor AI Agent for assisting in the development process
- All contributors who have helped shape this project

## Support

If you encounter any issues or have suggestions, please open an issue in the [GitHub repository](https://github.com/davidals/autotune-extension). 