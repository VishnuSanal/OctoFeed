# Octo Feed

A Next.js application that displays your GitHub activity feed with GitHub OAuth authentication.

## Features

- **GitHub OAuth Authentication** - Secure login using NextAuth.js
- **Activity Feed** - View events from `https://api.github.com/users/<username>/received_events`
- **Real-time Updates** - Refresh your feed with a single click
- **Event Types Supported**:
  - 📝 Push Events (commits)
  - 🔀 Pull Requests
  - 📋 Issues
  - 💬 Comments
  - ⭐ Stars
  - 🍴 Forks
  - ✨ Repository Creation
  - 🚀 Releases
  - And more!
- **Modern UI** - Responsive design with Tailwind CSS
- **Dark Mode** - Automatic dark mode support

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Your app name (e.g., "Octo Feed")
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**

### 3. Environment Variables

1. Copy the environment variables template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your GitHub OAuth credentials:
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   GITHUB_ID=your-github-client-id
   GITHUB_SECRET=your-github-client-secret
   ```

   **Note**: Generate a secure `NEXTAUTH_SECRET` using:
   ```bash
   openssl rand -base64 32
   ```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Sign In** - Click "Sign in with GitHub" on the homepage
2. **Authorize** - Grant permissions to the OctoFeed app
3. **View Feed** - Your GitHub activity feed will load automatically
4. **Refresh** - Click the refresh button to get the latest events
5. **Sign Out** - Click "Sign out" in the header when done

### What You'll See

The feed displays events from your GitHub network, including:
- Recent commits from repositories you follow
- Pull requests opened or merged
- Issues created or updated
- Stars and forks
- New repository creations
- And other activities from people you follow

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.js  # NextAuth.js API routes
│   ├── layout.js                        # Root layout with AuthProvider
│   └── page.js                         # Main page with feed and login
├── components/
│   ├── AuthProvider.js                 # Session provider wrapper
│   ├── LoginButton.js                  # Login/logout component
│   └── GitHubFeed.js                   # GitHub activity feed component
```

## Technologies Used

- **Next.js 13+** - React framework with App Router
- **NextAuth.js** - Authentication library
- **Tailwind CSS** - Styling framework
- **GitHub OAuth** - Authentication provider

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
