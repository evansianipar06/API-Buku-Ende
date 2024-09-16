# 📘 Buku Ende API

![Buku Ende API](https://via.placeholder.com/800x400?text=Buku+Ende+API)

## 🌟 Overview

Buku Ende API is a powerful and flexible RESTful service designed to digitize and provide easy access to the Ende Hymnal, a cornerstone of Indonesian Christian worship especially Huria Kristen Batak Protestan(HKBP). This API opens up a world of possibilities for developers looking to integrate hymn data into their applications, websites, or services.

## ✨ Features

- 🔐 **Secure Authentication**: User registration and JWT-based authentication system.
- 📚 **Comprehensive Hymn Access**: Retrieve full list of hymns or specific hymn details.
- 🎵 **Lyrics on Demand**: Fetch complete lyrics for any hymn in the collection.
- 🤖 **Automated Data Insertion**: Capability to insert new hymn titles and lyrics from external sources.
- 🚀 **Batch Processing**: Efficient handling of multiple hymn insertions for streamlined data management.
- 🔍 **Search Functionality**: Find hymns by number, title, or lyrics (coming soon).

## 🛠 Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL with optimized stored procedures
- **Authentication**: JSON Web Tokens (JWT)
- **API Documentation**: Swagger/OpenAPI (coming soon)

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
- MySQL (v5.7 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/buku-ende-api.git
   ```

2. Install dependencies:
   ```
   cd buku-ende-api
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and JWT secret.

4. Run database migrations (if applicable):
   ```
   npm run migrate
   ```

5. Start the server:
   ```
   npm start
   ```

The API will be available at `http://localhost:3002` by default.

## 📚 API Documentation

Detailed API documentation is available via Swagger UI at `/api-docs` when running the server locally. (Coming soon)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details. (Coming soon)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Ende Hymnal publishers for their invaluable contribution to Indonesian Christian worship.
- All contributors and supporters of this digitization effort.

---

Made with ❤️ for the Indonesian Christian community and developers worldwide.
