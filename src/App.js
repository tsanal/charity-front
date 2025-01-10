import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import InfoTable from './components/InfoTable';
import Login from './components/Login';
import AuthProvider from 'react-auth-kit';
import createStore from 'react-auth-kit/createStore';
import Header from './components/Header';

function App() {
  const store = createStore({
    authName: '_auth',
    authType: 'cookie',
    cookieDomain: window.location.hostname,
    cookieSecure: window.location.protocol === 'https:',
  });
  return (
    <AuthProvider store={store}>
      <Router>
        <div className="App">
          <Header />

          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/contact" element={<InfoTable />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
