import React, { useState } from 'react';

const AuthPanel = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', passwordHash: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const user = await response.json();
        onLogin(user); // Pasamos el usuario logueado a App.jsx
      } else {
        const errText = await response.text();
        setError(errText || 'Error en la autenticación');
      }
    } catch (err) {
      setError('Error conectando al servidor');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Usuario" 
            required
            className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
          />
          
          {!isLogin && (
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              required
              className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          )}

          <input 
            type="password" 
            placeholder="Contraseña" 
            required
            className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.passwordHash}
            onChange={e => setFormData({...formData, passwordHash: e.target.value})}
          />

          <button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition mt-2">
            {isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'} 
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-blue-600 font-semibold ml-2 hover:underline"
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPanel;
