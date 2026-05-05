import React, { useState } from 'react';
import AuthPanel from './components/AuthPanel';
import ClientDashboard from './components/ClientDashboard';
import ModeratorPanel from './components/ModeratorPanel';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="App">
      {!currentUser ? (
        <AuthPanel onLogin={(user) => setCurrentUser(user)} />
      ) : currentUser.role === 'MODERATOR' ? (
        <ModeratorPanel currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <ClientDashboard currentUser={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
