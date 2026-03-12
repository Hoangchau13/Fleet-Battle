import { useState } from 'react';
import { Bell, Wifi, WifiOff, Trophy, Target, TrendingUp, Gamepad2 } from 'lucide-react';
import './HomePage.css';

export default function HomePage() {
  const [pinCode, setPinCode] = useState(['', '', '', '', '', '']);
  const [vrConnected, setVrConnected] = useState(false);
  const playerData = {
    username: 'Captain_Alex',
    rank: 'Admiral',
    rankLevel: 15,
    eloScore: 2845,
    wins: 127,
    losses: 43,
    totalMatches: 170,
    winRate: 74.7,
    currentStreak: 8,
    bestStreak: 15
  };

  const handlePinInput = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pinCode];
      newPin[index] = value;
      setPinCode(newPin);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleConnect = () => {
    const pin = pinCode.join('');
    if (pin.length === 6) {
      console.log('Connecting with PIN:', pin);
      // Add VR connection logic here
      setVrConnected(true);
    }
  };

  return (
    <div className="player-home-page">
      {/* Header */}
      <header className="player-header">
        <div className="player-info">
          <div className="player-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=captain" alt="Avatar" />
            <span className="rank-badge">{playerData.rank}</span>
          </div>
          <div className="player-details">
            <h2>{playerData.username}</h2>
            <p className="rank-level">Level {playerData.rankLevel}</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="vr-status">
            {vrConnected ? (
              <>
                <Wifi className="icon connected" />
                <span>VR Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="icon disconnected" />
                <span>VR Disconnected</span>
              </>
            )}
          </div>
          <button className="notification-btn">
            <Bell />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Tactical Profile Overview */}
        <section className="tactical-profile">
          <h3 className="section-title">TACTICAL PROFILE OVERVIEW</h3>
          
          <div className="profile-summary">
            <div className="profile-card avatar-card">
              <div className="profile-avatar-large">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=captain" alt="Avatar" />
              </div>
              <div className="rank-display">
                <Trophy className="trophy-icon" />
                <h4>{playerData.rank}</h4>
                <p>Level {playerData.rankLevel}</p>
              </div>
            </div>

            <div className="profile-card elo-card">
              <div className="card-header">
                <Target className="icon" />
                <span>Rank / ELO Score</span>
              </div>
              <div className="elo-display">
                <h2>{playerData.eloScore}</h2>
                <p className="elo-trend">
                  <TrendingUp className="trend-icon" />
                  +125 this week
                </p>
              </div>
            </div>

            <div className="profile-card stats-card">
              <div className="card-header">
                <Gamepad2 className="icon" />
                <span>Stats Grid</span>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Win Rate</span>
                  <span className="stat-value">{playerData.winRate}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Wins</span>
                  <span className="stat-value wins">{playerData.wins}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Losses</span>
                  <span className="stat-value losses">{playerData.losses}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{playerData.totalMatches}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts & Progress */}
          <div className="profile-details">
            <div className="detail-card wl-chart">
              <h4>W/L Chart</h4>
              <div className="chart-visual">
                <div className="bar-chart">
                  <div className="bar win-bar" style={{height: `${(playerData.wins / playerData.totalMatches) * 100}%`}}>
                    <span>{playerData.wins}</span>
                  </div>
                  <div className="bar loss-bar" style={{height: `${(playerData.losses / playerData.totalMatches) * 100}%`}}>
                    <span>{playerData.losses}</span>
                  </div>
                </div>
                <div className="chart-labels">
                  <span>Wins</span>
                  <span>Losses</span>
                </div>
              </div>
            </div>

            <div className="detail-card match-stats">
              <h4>Match Stats</h4>
              <div className="stats-list">
                <div className="stat-row">
                  <span>Current Streak</span>
                  <span className="value streak">{playerData.currentStreak} wins</span>
                </div>
                <div className="stat-row">
                  <span>Best Streak</span>
                  <span className="value">{playerData.bestStreak} wins</span>
                </div>
                <div className="stat-row">
                  <span>Avg. Match Time</span>
                  <span className="value">18:32</span>
                </div>
              </div>
            </div>

            <div className="detail-card progress">
              <h4>Progress</h4>
              <div className="progress-content">
                <div className="progress-item">
                  <span>To Next Rank</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '65%'}}></div>
                  </div>
                  <span className="progress-text">650 / 1000 XP</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VR Device Pairing Station */}
        <section className="vr-pairing-station">
          <h3 className="section-title">VR DEVICE PAIRING STATION</h3>
          
          <div className="pairing-card">
            <div className="pairing-header">
              <div className="vr-icon-wrapper">
                {vrConnected ? <Wifi size={32} /> : <WifiOff size={32} />}
              </div>
              <h4>🔗 LINK VR HEADSET</h4>
              <p className="connection-status">
                Status: <span className={vrConnected ? 'connected' : 'disconnected'}>
                  <span className="status-dot">●</span>
                  {vrConnected ? 'Connected' : 'Disconnected'}
                </span>
              </p>
            </div>

            {!vrConnected && (
              <>
                <div className="pin-section">
                  <label>Enter 6-Digit PIN Code</label>
                  <div className="pin-inputs">
                    {pinCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`pin-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handlePinInput(index, e.target.value)}
                        className="pin-input"
                      />
                    ))}
                  </div>
                </div>

                <button 
                  className="connect-btn"
                  onClick={handleConnect}
                  disabled={pinCode.join('').length !== 6}
                >
                  CONNECT HEADSET
                </button>
              </>
            )}

            {vrConnected && (
              <div className="connected-info">
                <p>✓ Your VR headset is connected and ready for battle!</p>
                <button 
                  className="disconnect-btn"
                  onClick={() => {
                    setVrConnected(false);
                    setPinCode(['', '', '', '', '', '']);
                  }}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
} 