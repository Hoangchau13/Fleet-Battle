import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Users, Globe, LogOut } from 'lucide-react';
import { getWorldGroups } from '../../../api';

function ServerSelection() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [servers, setServers] = useState([]);

  useEffect(() => {
    // Load current user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Fetch server data from API
    const fetchServers = async () => {
      try {
        const data = await getWorldGroups();
        if (data && Array.isArray(data)) {
          const formattedServers = data.map(group => ({
            id: group.groupId,
            name: group.groupName,
            players: group.playerCount || 0,
            status: group.status === 'Active' ? 'online' : 'offline',
            hasJoined: group.hasJoined || false,
            playerId: group.playerId || null // Store playerId if the API provides it
          }));
          setServers(formattedServers);
        }
      } catch (error) {
        console.error('Failed to fetch servers:', error);
      }
    };

    fetchServers();
  }, []);

  const handleServerSelect = (server) => {
    localStorage.setItem('currentServer', JSON.stringify(server));
    if (server.hasJoined) {
      // Player exists in this server, load HomePage
      navigate(`/home/${currentUser.userId}/${server.id}`);
    } else {
      // No player in this server, go to CreatePlayer
      navigate(`/create-player?serverId=${server.id}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getPingColor = (ping) => {
    if (ping < 50) return 'text-green-600';
    if (ping < 150) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPingBadgeColor = (ping) => {
    if (ping < 50) return 'bg-green-100 text-green-700 border-green-300';
    if (ping < 150) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Fleet Battle VR</h1>
                <p className="text-xs text-blue-600">Select Your Server</p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{currentUser?.username || 'Guest'}</p>
                <p className="text-xs text-gray-600">Choose a server to begin</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                  {currentUser?.username?.charAt(0)?.toUpperCase() || 'G'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Select a Server Group</h2>
            <p className="text-gray-600">Choose the server closest to your location for the best experience</p>
          </div>

          {/* Server Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {servers.map((server) => (
              <div
                key={server.id}
                onClick={() => handleServerSelect(server)}
                className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg hover:shadow-2xl hover:border-blue-400 transition-all cursor-pointer transform hover:scale-105 duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{server.name}</h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Active Players</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{server.players.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className={`w-2 h-2 rounded-full ${server.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className="text-sm">Status</span>
                    </div>
                    <span className={`text-sm font-bold ${server.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                      {server.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-sm">Played Before</span>
                    </div>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${server.hasJoined ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {server.hasJoined ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <button className={`w-full mt-6 text-white font-semibold py-3 rounded-xl transition-all shadow-md ${
                  server.hasJoined 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400'
                }`}>
                  {server.hasJoined ? 'Enter Game' : 'Create Player'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServerSelection;
