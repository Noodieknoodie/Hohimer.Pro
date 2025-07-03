import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  const navItems = [
    { title: 'HOME', path: '/', active: location.pathname === '/' },
    { title: 'PAYMENTS', path: '/payments', active: location.pathname === '/payments' },
    { title: 'SUMMARY', path: '/summary', active: location.pathname === '/summary' },
    { title: 'CONTACTS', path: '/contacts', active: location.pathname === '/contacts' },
    { title: 'CONTRACTS', path: '/contracts', active: location.pathname === '/contracts' },
    { title: 'EXPORT DATA', path: '/export', active: location.pathname === '/export' },
  ];
  
  return (
    <header className="navbar-dark shadow-md">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-semibold text-white mr-8 hover:text-primary-300 transition-colors duration-200">
            HohimerPro
          </Link>
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={`${
                  location.pathname === item.path 
                    ? 'bg-primary-600 text-white shadow-sm' 
                    : 'text-light-300 hover:bg-dark-accent hover:text-white'
                } rounded-md px-4 py-2 text-sm font-medium h-10 flex items-center transition-colors duration-200`}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center gap-2 p-2 text-light-300 hover:text-white transition-colors duration-200">
            <span className="hidden sm:inline-block text-sm font-medium">Admin User</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <div className="md:hidden overflow-x-auto bg-dark-600 px-3">
        <nav className="flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${
                location.pathname === item.path
                  ? 'border-b-2 border-primary-500 text-white'
                  : 'text-light-400 hover:text-white'
              } px-4 py-2 text-sm`}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;