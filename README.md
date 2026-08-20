# Social App

A React social media application built with Vite for managing user accounts, creating posts, commenting, and viewing personal profile information.

This project uses a public social backend API from Routemisr and demonstrates a modern frontend setup with React Router, React Query, Tailwind styling, and form validation.

## Features

- User registration and login
- Protected routes for authenticated users only
- Home feed with posts from the connected users
- Create new posts with optional image upload
- View a single post in detail
- Add comments to posts
- Edit and delete user-created posts and comments
- User profile page with profile data
- Update profile photo
- Change password from the profile page
- Sign out from the navigation bar
- Toast notifications and loading states for feedback

## Tech Stack

- React 19
- Vite
- React Router
- TanStack React Query
- Axios
- React Hook Form
- Zod validation
- Tailwind CSS
- Flowbite UI components
- Lucide icons
- React Hot Toast

## Project Structure

```text
src/
├── components/
│   ├── ChangePasswordModal/
│   ├── Comment/
│   ├── CreateCommentModal/
│   ├── CreatePost/
│   ├── DeleteComment/
│   ├── DeletePost/
│   ├── Home/
│   ├── Layout/
│   ├── Navbar/
│   ├── NotFound/
│   ├── PostDetails/
│   ├── Profile/
│   ├── UpdateComment/
│   ├── UpdatePost/
│   ├── UploadProfilePicture/
│   └── UserPosts/
├── context/
│   └── UserContext.jsx
├── pages/
│   └── Authentication/
│       ├── Login/
│       └── Register/
├── routing/
│   ├── AppRouting.jsx
│   └── ProtectedRoute/
├── App.jsx
├── main.jsx
├── index.css
└── ...
```

## API and Backend

This app communicates with the Linked Posts API from Routemisr:

- `https://linked-posts.routemisr.com/users/signup`
- `https://linked-posts.routemisr.com/users/signin`
- `https://linked-posts.routemisr.com/users/profile-data`
- `https://linked-posts.routemisr.com/posts`
- `https://linked-posts.routemisr.com/posts/:id`
- `https://linked-posts.routemisr.com/users/change-password`
- `https://linked-posts.routemisr.com/users/upload-photo`

Authentication uses a token stored in `localStorage` and passed through the request headers.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

Then open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Notes

- The app uses protected routing, so users must log in before accessing the feed, profile, and post detail pages.
- Some actions are tied to the backend API and may require valid credentials and a working network connection.
- The project is built as a frontend-only demo app and depends on the external social API for data persistence.

## License

This project is for educational/demo purposes.
