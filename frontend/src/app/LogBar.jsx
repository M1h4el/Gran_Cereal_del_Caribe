'use client';

import React, { useState } from 'react';
import '@/styles/LogBar.scss';
import { useRouter } from 'next/navigation';
import { fetchData } from '../../utils/api';
import { signIn } from 'next-auth/react';

const LoginForm = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleForm = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Por favor, complete todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Evita redirección automática
        email,
        password,
      });

      if (result.error) {
        setError('Usuario o contraseña incorrectos.');
      } else {
        router.push('/dashboard'); // Redirige al dashboard tras login exitoso
      }
    } catch (err) {
      console.error('Error en el login:', err);
      setError('Hubo un error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
   /* router.push('/dashboard') */
  };

  return (
    <header className="header-container">
      <div className="Logo">LOGO</div>
      <div className="login-wrapper">
        <form className="login-form" onSubmit={handleForm}>
          <input
            type="text"
            placeholder="Email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error-message">{error}</p>}
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? 'Cargando...' : 'Login'}
          </button>
        </form>
      </div>
    </header>
  );
};

export default LoginForm;
