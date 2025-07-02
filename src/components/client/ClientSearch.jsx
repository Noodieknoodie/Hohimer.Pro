import React, { useState, useEffect } from 'react';
import useStore from '../../store';

const ClientSearch = ({ clients = [], isLoading = false }) => {
  const { selectedClientId, setSelectedClientId } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState(clients);
  
  // Update filtered clients when search term or clients change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = clients.filter(client => 
      client.display_name.toLowerCase().includes(lowerSearchTerm) ||
      (client.provider_name && client.provider_name.toLowerCase().includes(lowerSearchTerm))
    );
    
    setFilteredClients(filtered);
  }, [searchTerm, clients]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  return (
    <div className="relative mb-4">
      <div className="relative group">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-400 group-hover:text-primary-500 transition-colors duration-200"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        
        <input
          type="search"
          placeholder="Search clients..."
          className="pl-10 pr-8 w-full p-2.5 rounded-lg border border-light-400 bg-light-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    shadow-sm hover:shadow transition-all duration-200 text-dark-600 placeholder-dark-400"
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={isLoading}
        />
        
        {searchTerm && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-primary-600 transition-colors duration-200"
            onClick={handleClearSearch}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      {searchTerm && filteredClients.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-light-400 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto animate-fade-in">
          {filteredClients.map(client => (
            <button
              key={client.client_id}
              className="w-full text-left px-4 py-2.5 hover:bg-light-200 flex items-center first:rounded-t-lg last:rounded-b-lg border-b border-light-300 last:border-b-0"
              onClick={() => {
                setSelectedClientId(client.client_id);
                setSearchTerm('');
              }}
            >
              <span className="mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={
                    client.compliance_status === 'green'
                      ? 'text-green-500'
                      : 'text-yellow-500' // Binary: green or yellow only
                  }
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <div className="flex-1">
                <div className="font-medium">{client.display_name}</div>
                {client.provider_name && (
                  <div className="text-xs text-gray-500">{client.provider_name}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {searchTerm && filteredClients.length === 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-4 text-center text-gray-500">
          No clients found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default ClientSearch;