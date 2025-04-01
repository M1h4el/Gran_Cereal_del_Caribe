import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {pool as db} from "@/lib/db";
import bcrypt from "bcrypt";

export default NextAuth({
  providers: [
    CredentialsProvider({
      userName: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const [users] = await db.query("SELECT * FROM users WHERE email = ?", [credentials.email]);
          if (users.length === 0) {
            throw new Error("Usuario no encontrado");
          }

          const user = users[0];

          // Comparar contraseña encriptada
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          if (!isValidPassword) {
            throw new Error("Contraseña incorrecta");
          }

          return { id: user.id, userName: user.userName, email: user.email, role: user.role };
        } catch (error) {
          throw new Error(error.message);
        }
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

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };