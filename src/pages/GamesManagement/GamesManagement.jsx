import { useState, useEffect } from 'react';
import { getLevels, getGameConfig } from '../../api';
import './GamesManagement.css';

function GamesManagement() {
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelConfig, setLevelConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy danh sách levels khi component mount
  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLevels();
      setLevels(data);
    } catch (err) {
      setError('Không thể tải danh sách levels. Vui lòng thử lại.');
      console.error('Error fetching levels:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLevelConfig = async (levelId) => {
    try {
      setLoading(true);
      setError(null);
      const config = await getGameConfig(levelId);
      setLevelConfig(config);
      setSelectedLevel(levelId);
    } catch (err) {
      setError('Không thể tải cấu hình level. Vui lòng thử lại.');
      console.error('Error fetching level config:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="games-management">
      <div className="page-header">
        <h1>🎮 Quản lý Games</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      <div className="games-content">
        {/* Danh sách Levels */}
        <div className="levels-section">
          <div className="section-header">
            <h2>Danh sách Levels</h2>
            <span className="badge">{levels.length} levels</span>
          </div>

          {loading && !selectedLevel ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <div className="levels-grid">
              {levels.length === 0 ? (
                <div className="empty-state">
                  <p>Không có level nào</p>
                </div>
              ) : (
                levels.map((level, index) => (
                  <div
                    key={level.id || index}
                    className={`level-card ${selectedLevel === level.id ? 'active' : ''}`}
                    onClick={() => fetchLevelConfig(level.id)}
                  >
                    <div className="level-icon">🗺️</div>
                    <div className="level-info">
                      <h3>Level {level.id || index + 1}</h3>
                      <p>{level.name || `Level ${index + 1}`}</p>
                      {level.difficulty && (
                        <span className={`difficulty difficulty-${level.difficulty.toLowerCase()}`}>
                          {level.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Chi tiết Config */}
        {selectedLevel && (
          <div className="config-section">
            <div className="section-header">
              <h2>Cấu hình Level {selectedLevel}</h2>
              <button 
                className="btn-close" 
                onClick={() => {
                  setSelectedLevel(null);
                  setLevelConfig(null);
                }}
              >
                ✕
              </button>
            </div>

            {loading ? (
              <div className="loading">Đang tải cấu hình...</div>
            ) : levelConfig ? (
              <div className="config-details">
                <div className="config-grid">
                  {Object.entries(levelConfig).map(([key, value]) => (
                    <div key={key} className="config-item">
                      <label>{key}</label>
                      <div className="config-value">
                        {typeof value === 'object' 
                          ? JSON.stringify(value, null, 2)
                          : String(value)
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Không có dữ liệu cấu hình</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GamesManagement;
