# AuctionArc Frontend

A modern, responsive web application for online auction management built with React and contemporary web technologies.

## Overview

AuctionArc Frontend is the client-side application for the AuctionArc platform, providing users with an intuitive interface to browse, bid on, and manage auctions in real-time.

## Features

- 🔍 **Auction Discovery** - Browse and search active auctions
- 🏷️ **Real-time Bidding** - Place and track bids with live updates
- 👤 **User Authentication** - Secure login and registration
- 📊 **Auction Management** - Create and monitor your listings
- 💰 **Payment Integration** - Secure payment processing
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🔔 **Notifications** - Get updates on auction status and bids

## Tech Stack

- **Framework**: React
- **State Management**: Redux/Context API
- **Styling**: CSS3 / Tailwind CSS
- **HTTP Client**: Axios
- **Build Tool**: Webpack / Vite
- **Testing**: Jest / React Testing Library

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Saima535/AuctionArc.git
cd AuctionArc/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with required environment variables:
```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run eject` - Eject from create-react-app (irreversible)

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components
│   ├── services/       # API services and utilities
│   ├── store/          # Redux store (if applicable)
│   ├── styles/         # Global styles
│   ├── App.js          # Main App component
│   └── index.js        # Entry point
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## API Integration

The frontend communicates with the AuctionArc backend API. Ensure the backend server is running before starting the frontend application.

Base API URL can be configured in `.env` file.

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on the [GitHub repository](https://github.com/Saima535/AuctionArc/issues).

---

**Note**: This is the frontend repository. For backend code, visit the [main repository](https://github.com/Saima535/AuctionArc).
