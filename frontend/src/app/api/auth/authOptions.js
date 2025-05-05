import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { queryDB } from "@/lib/dbUtils";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const [user] = await queryDB("SELECT * FROM users WHERE email = ?", [credentials.email]);
          if (!user || user.length === 0) throw new Error("Usuario no encontrado");

          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          if (!isValidPassword) throw new Error("Contraseña incorrecta");

          return {
            id: user.user_id,
            userName: user.userName,
            email: user.email,
            role: user.role,
            codeCollaborator: user.codeCollaborator,
            status: user.status,
          };
        } catch (error) {
          console.error("Error en authorize:", error);
          throw new Error("Error durante la autenticación");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12, // 12 horas
    updateAge: 60 * 5, // Cada 5 minutos
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.codeCollaborator = user.codeCollaborator;
          token.status = user.status;
        }
        return token;
      } catch (error) {
        console.error("Error en jwt callback:", error);
        throw error;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id;
          session.user.email = token.email;
          session.user.role = token.role;
          session.user.codeCollaborator = token.codeCollaborator;
          session.user.status = token.status;
        }
        return session;
      } catch (error) {
        console.error("Error en session callback:", error);
        throw error;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "1234",
};
