# BookTrackr

BookTrackr is a modern React-powered web application designed for book enthusiasts to discover, track, and organize their reading experiences. Built with React 19, Vite, and Tailwind CSS, it offers a clean, responsive interface for managing personal libraries, rating books, and engaging with reviews and comments.

## Live Demo

Try out the live version of BookTrackr:  
**[BookTrackr Live](https://booktrackr-ecc20.web.app/)**

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@abv.bg | admin |
| **User** | user@abv.bg | 123456 |

## Features

- **Book Catalog**: Browse and explore a comprehensive collection of books with details including author, genre, publication year, page count, and cover images.
- **Personal Library**: Organize your books across multiple shelves:
  - Currently Reading
  - Read
  - To Read
  - Favorites
  - DNF (Did Not Finish)
- **Ratings & Reviews**: Rate books with a 5-star system and leave detailed reviews to share your thoughts with other readers.
- **Comments**: Engage with the community by commenting on reviews and participating in discussions.
- **Search Functionality**: Search for books by title or author with real-time filtering and debounced input.
- **User Authentication**: Secure registration and login system with "Remember Me" functionality and session management.
- **Staff Picks**: Discover curated staff recommendations and the monthly "Pick of the Month" with featured reviews.
- **Admin Panel**: Staff users can manage book entries, set staff recommendations, and curate the Pick of the Month.
- **Public Libraries**: View other users' libraries and see what they're reading.
- **Responsive Design**: Fully responsive interface that works seamlessly across desktop and mobile devices.

## Tech Stack

- **Frontend**: React 19, React Router 7, Tailwind CSS 4
- **Build Tool**: Vite 7
- **Backend**: Firebase Functions with a custom REST API server
- **Hosting**: Firebase Hosting
- **Testing**: Vitest, React Testing Library
- **Code Quality**: ESLint, Prettier

## Local Installation

Follow these steps to set up BookTrackr locally:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/mitkomitevv/BookTrackr.git
   cd BookTrackr
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Start the backend server (in a separate terminal):**

   ```bash
   npm run server
   ```

   > Note: This requires Firebase CLI to be installed (`npm install -g firebase-tools`)

5. **Open in browser:**
   
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run server` | Start Firebase emulators for local backend |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests with Vitest |
| `npm run coverage` | Run tests with coverage report |
| `npm run deploy:client` | Build and deploy to Firebase Hosting |
| `npm run deploy:server` | Deploy Firebase Functions |

## Usage

- **Browse Books**: Explore the catalog to discover new reads.
- **Create an Account**: Register to unlock personal library features.
- **Build Your Library**: Add books to your shelves and track your reading progress.
- **Rate & Review**: Share your opinions with star ratings and detailed reviews.
- **Engage**: Comment on reviews and connect with fellow readers.
- **Contribute**: Add new books to the catalog for everyone to discover.

## Project Structure

```
BookTrackr/
├── src/
│   ├── components/       # React components organized by feature
│   │   ├── admin-panel/  # Admin dashboard
│   │   ├── auth/         # Login, Register, Logout
│   │   ├── book-card/    # Book display cards
│   │   ├── books/        # Book form for add/edit
│   │   ├── catalog/      # Book browsing
│   │   ├── details/      # Book details, reviews, comments
│   │   ├── guards/       # Route protection
│   │   ├── home/         # Homepage components
│   │   ├── layout/       # Header, Footer
│   │   ├── my-library/   # Personal library management
│   │   ├── search/       # Search component
│   │   ├── shelf-preview/# Shelf preview cards
│   │   └── ui/           # Reusable UI components
│   ├── contexts/         # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── tests/            # Test setup
├── functions/            # Firebase Functions (backend)
└── public/               # Static assets
```

## Future Plans

- **Social Features**: Follow other users and see their reading activity in a personalized feed.
- **Reading Goals**: Set and track annual reading goals with progress visualization.
- **Book Clubs**: Create or join book clubs for group reading experiences.
- **Advanced Recommendations**: Personalized book suggestions based on reading history and preferences.
- **Reading Statistics**: Detailed analytics on reading habits, genres, and page counts.
- **Mobile App**: Native mobile applications for iOS and Android.
