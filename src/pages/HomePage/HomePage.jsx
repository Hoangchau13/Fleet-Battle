import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminLevels, getLevelById } from '../../api';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [levels, setLevels] = useState([]);
  const [levelsDetails, setLevelsDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState({});

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await getAdminLevels();
      const levelsArray = Array.isArray(response) ? response : (response?.data || response?.levels || []);
      setLevels(levelsArray);
      
      // Fetch detailed config for each level
      await fetchAllLevelDetails(levelsArray);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLevelDetails = async (levelsArray) => {
    const detailsPromises = levelsArray.map(async (level) => {
      const levelId = level.levelId || level.id;
      try {
        setLoadingDetails(prev => ({ ...prev, [levelId]: true }));
        const config = await getLevelById(levelId);
        return { levelId, config };
      } catch (error) {
        console.error(`Error fetching config for level ${levelId}:`, error);
        return { levelId, config: null };
      } finally {
        setLoadingDetails(prev => ({ ...prev, [levelId]: false }));
      }
    });

    const results = await Promise.all(detailsPromises);
    const detailsMap = {};
    results.forEach(({ levelId, config }) => {
      if (config) {
        detailsMap[levelId] = config;
      }
    });
    setLevelsDetails(detailsMap);
  };

  const handlePlayLevel = (level) => {
    // Placeholder for play game logic
    console.log('Play level:', level);
    alert(`Bắt đầu chơi level: ${level.name}`);
  };

  const getDifficultyIcon = (index) => {
    if (index === 0) return '⭐';
    if (index === 1) return '🔥';
    if (index === 2) return '💎';
    return '🎮';
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            ⚓ Chào mừng đến Fleet Battle
          </h1>
          <p className="hero-subtitle">
            {user ? `Xin chào, ${user.username}! Sẵn sàng chinh phục đại dương?` : 'Sẵn sàng chinh phục đại dương?'}
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <div className="stat-value">{user?.wins || 0}</div>
              <div className="stat-label">Thắng</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">⚔️</div>
            <div className="stat-info">
              <div className="stat-value">{user?.totalGames || 0}</div>
              <div className="stat-label">Trận đã chơi</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <div className="stat-value">{user?.currentElo || 0}</div>
              <div className="stat-label">ELO</div>
            </div>
          </div>
        </div>
      </div>

      {/* Levels Section */}
      <div className="levels-section">
        <div className="section-header">
          <h2>🎮 Chọn Độ Khó</h2>
          <p className="section-subtitle">Thử thách bản thân với các level khác nhau</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Đang tải levels...</p>
          </div>
        ) : levels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎮</div>
            <h3>Chưa có level nào</h3>
            <p>Hệ thống đang cập nhật levels mới</p>
          </div>
        ) : (
          <div className="levels-grid">
            {levels.map((level, index) => {
              const levelId = level.levelId || level.id;
              const levelDetail = levelsDetails[levelId];
              const isLoadingDetail = loadingDetails[levelId];
              
              return (
                <div key={levelId || index} className="level-card">
                  <div className="level-card-header">
                    <div className="level-icon">{getDifficultyIcon(index)}</div>
                    <div className="difficulty-badge">
                      {levelDetail?.levelName || level.levelName || level.name}
                    </div>
                  </div>
                  
                  <div className="level-card-body">
                    <h3 className="level-title">{level.levelName || level.name}</h3>
                    
                    {isLoadingDetail ? (
                      <div className="spec-loading">
                        <div className="spinner-small"></div>
                        <span>Đang tải thông tin...</span>
                      </div>
                    ) : (
                      <div className="level-specs">
                        <div className="spec-item">
                          <span className="spec-icon">📐</span>
                          <span className="spec-label">Bàn cờ</span>
                          <span className="spec-value">
                            {levelDetail?.boardSize || level.boardSize}×{levelDetail?.boardSize || level.boardSize}
                          </span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-icon">⏱️</span>
                          <span className="spec-label">Thời gian</span>
                          <span className="spec-value">
                            {levelDetail?.timeLimit || level.timeLimit}s
                          </span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-icon">⚓</span>
                          <span className="spec-label">Số tàu</span>
                          <span className="spec-value">
                            {levelDetail?.ships?.length || level.ships?.length || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="level-card-footer">
                    <button 
                      className="btn-play"
                      onClick={() => handlePlayLevel(levelDetail || level)}
                      disabled={isLoadingDetail}
                    >
                      <span className="btn-icon">▶️</span>
                      <span>Chơi Ngay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How to Play Section */}
      <div className="guide-section">
        <h2>📖 Cách Chơi</h2>
        <div className="guide-grid">
          <div className="guide-card">
            <div className="guide-icon">🚢</div>
            <h3>Đặt Tàu</h3>
            <p>Sắp xếp các chiến hạm của bạn trên bàn cờ một cách chiến lược</p>
          </div>
          <div className="guide-card">
            <div className="guide-icon">🎯</div>
            <h3>Tấn Công</h3>
            <p>Chọn vị trí để bắn và cố gắng tiêu diệt hết tàu đối thủ</p>
          </div>
          <div className="guide-card">
            <div className="guide-icon">🏆</div>
            <h3>Chiến Thắng</h3>
            <p>Người đầu tiên tiêu diệt hết tàu đối phương sẽ là người chiến thắng</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
