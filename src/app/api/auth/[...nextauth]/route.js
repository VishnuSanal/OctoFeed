import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  ],
  callbacks: {
    async session({ session, token }) {
      // Add additional user info to the session
      session.user.id = token.sub
      session.user.login = token.login // GitHub username
      return session
    },
    async jwt({ token, account, profile }) {
      // Add additional info to the JWT token
      if (account) {
        token.accessToken = account.access_token
      }
      if (profile) {
        token.login = profile.login // GitHub username
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
})

export { handler as GET, handler as POST }