import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Simulación de base de datos con usuarios y roles
const users = [
  { id: 1, userName: "Admin User", email: "admin@example.com", password: "admin123", role: "client" },
  { id: 2, userName: "Regular User", email: "user@example.com", password: "user123", role: "seller" },
  { id: 3, userName: "User", email: "user@example.com", password: "user123", role: "provider" }

];

export default NextAuth({
  providers: [
    CredentialsProvider({
      userName: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
        if (user) {
          return { id: user.id, userName: user.userName, email: user.email, role: user.role };
        }
        throw new Error("Invalid credentials");
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;  // Agregar el rol al token JWT
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;  // Agregar el rol a la sesión
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login"
  }
});