import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import VoiceLogin from './components/VoiceLogin';
import Dashboard from './components/Dashboard';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);

  // ✅ Restore session from localStorage on page load
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const loginMethod = localStorage.getItem('loginMethod');

    if (token && email && name) {
      setUser({ name, email, loginMethod });
      setCurrentView('dashboard');
    }
  }, []);

  // Email/Password Login
  const handleEmailLogin = async (email, password) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('name', data.name);
      localStorage.setItem('email', email);
      localStorage.setItem('loginMethod', 'email');

      setUser({
        name: data.name,
        email: email,
        loginMethod: 'email'
      });
      setCurrentView('dashboard');
    } catch (err) {
      console.error('❌ Email Login Error:', err);
      alert(err.message);
    }
  };

  // Email Registration
  const handleSignup = async (userData) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');

      localStorage.setItem('name', `${userData.firstName} ${userData.lastName}`);
      localStorage.setItem('email', userData.email);
      localStorage.setItem('loginMethod', 'email');

      setUser({
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        loginMethod: 'email'
      });
      setCurrentView('dashboard');
    } catch (err) {
      console.error('❌ Signup Error:', err);
      alert(err.message);
    }
  };

  // Voice Enrollment & Login
  const handleVoiceAuth = async (audioBlob, userId) => {
    const formData = new FormData();
    formData.append('voice', audioBlob, 'voice.wav');
    if (userId) formData.append('userId', userId);

    const endpoint = currentView === 'voice-enroll'
      ? 'http://localhost:3000/api/voice-enroll'
      : 'http://localhost:3000/api/voice-login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Voice authentication failed');
      }

      // ✅ Save to localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('email', data.email || userId || 'voice@anonymous');
      localStorage.setItem('name', data.name || 'Voice User');
      localStorage.setItem('loginMethod', 'voice');

      setUser({
        email: data.email || userId || 'voice@anonymous',
        name: data.name || 'Voice User',
        loginMethod: 'voice',
        confidence: data.similarity || 'N/A'
      });
      setCurrentView('dashboard');
    } catch (err) {
      console.error('❌ Voice Auth Error:', err);
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setCurrentView('login');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage
            onSwitchToSignup={() => setCurrentView('signup')}
            onSwitchToVoiceLogin={() => setCurrentView('voice-login')}
            onLogin={handleEmailLogin}
          />
        );
      case 'signup':
        return (
          <SignupPage
            onSwitchToLogin={() => setCurrentView('login')}
            onSwitchToVoiceEnroll={() => setCurrentView('voice-enroll')}
            onSignup={handleSignup}
          />
        );
      case 'voice-login':
        return (
          <VoiceLogin
            type="login"
            onBack={() => setCurrentView('login')}
            onVoiceLogin={handleVoiceAuth}
          />
        );
      case 'voice-enroll':
        return (
          <VoiceLogin
            type="enroll"
            onBack={() => setCurrentView('signup')}
            onVoiceLogin={handleVoiceAuth}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  return <div className="App">{renderCurrentView()}</div>;
}

export default App;
