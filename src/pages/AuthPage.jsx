// src/pages/AuthPage.jsx
// Page de connexion et inscription

import React, { useState } from 'react';
import { BookOpen, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await authService.signIn(email, password);
      } else {
        if (!name.trim()) {
          setError('Le prénom est requis');
          setLoading(false);
          return;
        }
        result = await authService.signUp(email, password, name);
      }

      if (result.success) {
        onAuthSuccess(result.user);
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo et Titre */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white/10 backdrop-blur-lg rounded-full p-6 mb-4">
            <BookOpen className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Mon Parcours Coranique
          </h1>
          <p className="text-white/70">
            Mémorise le Coran avec la répétition espacée
          </p>
        </div>

        {/* Formulaire */}
        <div style={{
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(16px)',
  borderRadius: '1rem',
  padding: '2rem',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
}}>
  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
    <button
      onClick={() => {
        setIsLogin(true);
        setError('');
      }}
      style={{
        flex: 1,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        fontWeight: '600',
        transition: 'all 0.3s',
        backgroundColor: isLogin ? 'white' : 'transparent',
        color: isLogin ? '#581c87' : 'rgba(255, 255, 255, 0.7)',
        border: 'none',
        cursor: 'pointer',
        boxShadow: isLogin ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isLogin) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        if (!isLogin) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      Connexion
    </button>
    <button
      onClick={() => {
        setIsLogin(false);
        setError('');
      }}
      style={{
        flex: 1,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        fontWeight: '600',
        transition: 'all 0.3s',
        backgroundColor: !isLogin ? 'white' : 'transparent',
        color: !isLogin ? '#581c87' : 'rgba(255, 255, 255, 0.7)',
        border: 'none',
        cursor: 'pointer',
        boxShadow: !isLogin ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (isLogin) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        if (isLogin) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      Inscription
    </button>
  </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Prénom
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ahmed, Fatima..."
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="exemple@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Lock className="inline w-4 h-4 mr-2" />
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                'Chargement...'
              ) : (
                <>
                  {isLogin ? 'Se connecter' : "S'inscrire"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {!isLogin && (
            <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm">
              <strong>📝 Astuce :</strong> Utilise un email réel pour pouvoir récupérer ton compte plus tard !
            </div>
          )}
        </div>

        {/* Demo Account */}
        <div className="mt-6 text-center">
          <button
  onClick={() => {
    setEmail('demo@exemple.com');
    setPassword('demo123');
    setIsLogin(true);
  }}
  style={{
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.875rem',
    textDecoration: 'underline',
    transition: 'color 0.3s',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem'
  }}
  onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 1)'}
  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
>
  Utiliser le compte de démonstration
</button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;