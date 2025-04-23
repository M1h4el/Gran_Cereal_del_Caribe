import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { queryDB } from "@/lib/dbUtils";
import bcrypt from "bcrypt";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const [user] = await queryDB("SELECT * FROM users WHERE email = ?", [
          credentials.email,
        ]);

        if (!user || user.length === 0) {
          throw new Error("Usuario no encontrado");
        }

        try {
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            throw new Error("Contraseña incorrecta");
          }

          return {
            id: user.user_id,
            userName: user.userName,
            email: user.email,
            role: user.role,
            codeCollaborator: user.codeCollaborator,
            status: user.status, // 👈 añadimos el campo status aquí
          };
        } catch (error) {
          throw new Error("Error interno al validar la contraseña");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12,
    updateAge: 60 * 5,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.codeCollaborator = user.codeCollaborator;
        token.status = user.status; // 👈 añadimos el status al token
      }
      return token;
      
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.codeCollaborator = token.codeCollaborator;
        session.user.status = token.status; // 👈 pasamos status a la sesión
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
