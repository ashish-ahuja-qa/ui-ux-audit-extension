# UI/UX Audit Extension

A browser extension that helps you quickly audit web interfaces for UI/UX issues and get actionable recommendations.

## Features

- **Instant UI/UX Audits**: Take a screenshot of any webpage and get specific, actionable feedback
- **Detailed Analysis**: Identifies exact elements, measurements, and technical details that need improvement
- **Actionable Recommendations**: Provides specific solutions with color values, pixel measurements, and more
- **PDF Export**: Download audit reports as PDF for sharing or documentation
- **Easy to Use**: Simple one-click interface with clean, modern design

## Installation

### Prerequisites
- Node.js and npm installed
- Chrome or Edge browser

### Backend Setup
1. Clone this repository
```bash
git clone https://github.com/yourusername/ui-ux-audit-extension.git
cd ui-ux-audit-extension
```

2. Set up the backend
```bash
cd backend
npm install
```

3. Create a `.env` file in the backend directory with your OpenAI API key
```
OPENAI_API_KEY=your_api_key_here
```

4. Start the backend server
```bash
npm start
```

### Extension Setup
1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `extension` folder from this repository
4. The extension icon should appear in your browser toolbar

## Usage

1. Navigate to any webpage you want to audit
2. Click the UI/UX Audit Tool extension icon
3. Click the "Audit This Page" button
4. Review the specific UI/UX issues and recommendations
5. Download the report as PDF if needed

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-4o API
- **PDF Generation**: html2pdf.js

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with OpenAI's GPT-4o API
- Icon from [Material Design Icons](https://material.io/resources/icons/) 