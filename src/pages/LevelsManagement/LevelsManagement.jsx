import { useState, useEffect } from 'react';
import { getAdminLevels, getLevelById, createLevel, updateLevel, deleteLevel, configureLevelShips, getShipTypes } from '../../api';
import './LevelsManagement.css';

function LevelsManagement() {
  const [levels, setLevels] = useState([]);
  const [shipTypes, setShipTypes] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShipConfigModal, setShowShipConfigModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingShipTypes, setLoadingShipTypes] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    levelName: '',
    boardSize: 10,
    timeLimit: 600
  });

  const [shipConfigData, setShipConfigData] = useState([]);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminLevels();
      console.log('Levels Response:', response);
      
      let levelsData = [];
      if (Array.isArray(response)) {
        levelsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        levelsData = response.data;
      }
      
      setLevels(levelsData);
    } catch (err) {
      setError('Không thể tải danh sách levels. Vui lòng thử lại.');
      console.error('Error fetching levels:', err);
      setLevels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (levelId) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const response = await getLevelById(levelId);
      console.log('Level Detail Response:', response);
      
      // Handle different response structures
      let levelData = response;
      if (response?.data) {
        levelData = response.data;
      }
      
      setSelectedLevel(levelData);
    } catch (err) {
      console.error('Error fetching level detail:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin level. Vui lòng thử lại.');
      setShowDetailModal(false);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateLevel = async (e) => {
    e.preventDefault();
    try {
      setLoadingSubmit(true);
      setError(null);
      await createLevel(formData);
      setSuccess('Tạo level mới thành công! 🎉');
      setTimeout(() => setSuccess(null), 3000);
      setShowCreateModal(false);
      setFormData({ levelName: '', boardSize: 10, timeLimit: 600 });
      await fetchLevels();
    } catch (err) {
      console.error('Create level error:', err);
      setError(err.response?.data?.message || 'Không thể tạo level. Vui lòng thử lại.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleEditClick = (level) => {
    setSelectedLevel(level);
    setFormData({
      boardSize: level.boardSize || 10,
      timeLimit: level.timeLimit || 600
    });
    setShowEditModal(true);
  };

  const handleUpdateLevel = async (e) => {
    e.preventDefault();
    try {
      setLoadingSubmit(true);
      setError(null);
      await updateLevel(selectedLevel.levelId || selectedLevel.id, formData);
      setSuccess('Cập nhật level thành công! 🎉');
      setTimeout(() => setSuccess(null), 3000);
      setShowEditModal(false);
      await fetchLevels();
    } catch (err) {
      console.error('Update level error:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật level. Vui lòng thử lại.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteLevel = async (levelId) => {
    if (window.confirm('Bạn có chắc muốn xóa level này?')) {
      try {
        await deleteLevel(levelId);
        setSuccess('Đã xóa level thành công!');
        setTimeout(() => setSuccess(null), 3000);
        await fetchLevels();
      } catch (err) {
        setError('Không thể xóa level. Vui lòng thử lại.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const fetchShipTypes = async () => {
    try {
      setLoadingShipTypes(true);
      const response = await getShipTypes();
      console.log('Ship Types Response:', response);
      
      let shipsData = [];
      if (Array.isArray(response)) {
        shipsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        shipsData = response.data;
      }
      
      setShipTypes(shipsData);
      
      // Initialize ship config data with all ship types and quantity 0
      const initialConfig = shipsData.map(ship => ({
        shipTypeId: ship.shipTypeId || ship.id || 0,
        quantity: 0
      }));
      setShipConfigData(initialConfig);
    } catch (err) {
      console.error('Error fetching ship types:', err);
      setError('Không thể tải danh sách ship types.');
    } finally {
      setLoadingShipTypes(false);
    }
  };

  const handleOpenShipConfig = async (level) => {
    setSelectedLevel(level);
    setShowShipConfigModal(true);
    setError(null);
    
    // Fetch ship types if not loaded
    if (shipTypes.length === 0) {
      await fetchShipTypes();
    } else {
      // Reset config data when opening
      const initialConfig = shipTypes.map(ship => ({
        shipTypeId: ship.shipTypeId || ship.id || 0,
        quantity: 0
      }));
      setShipConfigData(initialConfig);
    }
  };

  const handleShipQuantityChange = (shipTypeId, quantity) => {
    setShipConfigData(prev => 
      prev.map(item => 
        item.shipTypeId === shipTypeId 
          ? { ...item, quantity: parseInt(quantity) || 0 }
          : item
      )
    );
  };

  const handleConfigureShips = async (e) => {
    e.preventDefault();
    try {
      setLoadingSubmit(true);
      setError(null);
      
      const levelId = selectedLevel.levelId || selectedLevel.id;
      
      // Filter out ships with quantity > 0
      const shipsToSend = shipConfigData.filter(item => item.quantity > 0);
      
      if (shipsToSend.length === 0) {
        setError('Vui lòng chọn ít nhất một loại tàu với số lượng > 0');
        return;
      }
      
      console.log('Sending ship config:', shipsToSend);
      await configureLevelShips(levelId, shipsToSend);
      
      setSuccess('Cấu hình tàu thành công! 🎉');
      setTimeout(() => setSuccess(null), 3000);
      setShowShipConfigModal(false);
      await fetchLevels();
    } catch (err) {
      console.error('Configure ships error:', err);
      setError(err.response?.data?.message || 'Không thể cấu hình tàu. Vui lòng thử lại.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="levels-management">
      <div className="page-header">
        <h1>🎮 Quản lý Levels</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ Tạo Level Mới
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✓ {success}
        </div>
      )}

      <div className="levels-section">
        <div className="section-header">
          <h2>Danh sách Levels</h2>
          <span className="badge">{Array.isArray(levels) ? levels.length : 0} levels</span>
        </div>

        {loading ? (
          <div className="loading">Đang tải danh sách levels...</div>
        ) : !Array.isArray(levels) || levels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎮</div>
            <h3>Chưa có level nào</h3>
            <p>Hãy tạo level đầu tiên cho game!</p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              ➕ Tạo Level Mới
            </button>
          </div>
        ) : (
          <div className="levels-grid">
            {levels.map((level, index) => (
              <div key={level.levelId} className="level-card">
                <div className="level-header">
                  <div className="level-icon">🗺️</div>
                  <div className="level-info">
                    <h3>{level.name}</h3>
                    <div>
                      <p className="level-detail">
                        📏 Board: <strong>{level.boardSize}x{level.boardSize}</strong>
                      </p>
                      <p className="level-detail">
                        ⏱️ Time: <strong>{level.timeLimit}s</strong>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="level-actions">
                  <button 
                    className="btn-icon btn-view"
                    title="Xem chi tiết"
                    onClick={() => handleViewDetail(level.levelId)}
                  >
                    👁️
                  </button>
                  <button 
                    className="btn-icon btn-ship"
                    title="Cấu hình Tàu"
                    onClick={() => handleOpenShipConfig(level)}
                  >
                    ⚓
                  </button>
                  <button 
                    className="btn-icon btn-edit"
                    title="Chỉnh sửa"
                    onClick={() => handleEditClick(level)}
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-icon btn-delete"
                    title="Xóa"
                    onClick={() => handleDeleteLevel(level.levelId || level.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Chi tiết Level */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🗺️ Chi tiết Level</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {loadingDetail ? (
                <div className="modal-loading">
                  <div className="spinner-large"></div>
                  <p>Đang tải thông tin...</p>
                </div>
              ) : selectedLevel ? (
                <div className="level-detail-content">
                  {/* Thông tin cơ bản */}
                  <div className="detail-section">
                    <h3 className="section-title">📋 Thông tin cơ bản</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Level ID:</span>
                        <span className="detail-value">{selectedLevel.levelId || selectedLevel.id || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Level Name:</span>
                        <span className="detail-value strong">{selectedLevel.levelName || selectedLevel.name || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Board Size:</span>
                        <span className="detail-value">
                          {selectedLevel.boardSize || selectedLevel.gridSize || 'N/A'}x
                          {selectedLevel.boardSize || selectedLevel.gridSize || 'N/A'}
                          <span className="detail-hint">
                            ({(selectedLevel.boardSize || selectedLevel.gridSize || 0) ** 2} ô)
                          </span>
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Time Limit:</span>
                        <span className="detail-value">
                          {selectedLevel.timeLimit || 'N/A'}s
                          {selectedLevel.timeLimit && (
                            <span className="detail-hint">
                              ({Math.floor(selectedLevel.timeLimit / 60)}m {selectedLevel.timeLimit % 60}s)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cấu hình tàu */}
                  {selectedLevel.ships && selectedLevel.ships.length > 0 && (
                    <div className="detail-section">
                      <h3 className="section-title">⚓ Cấu hình Tàu</h3>
                      <div className="ships-list">
                        {selectedLevel.ships.map((ship, index) => (
                          <div key={index} className="ship-item">
                            <div className="ship-icon">🚢</div>
                            <div className="ship-info">
                              <div className="ship-name">{ship.shipTypeName || `Ship ${index + 1}`}</div>
                              <div className="ship-details">
                                <span className="ship-badge">Size: {ship.size || 'N/A'}</span>
                                <span className="ship-badge">Quantity: {ship.quantity || 0}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <p>Không có dữ liệu</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
              {selectedLevel && (
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEditClick(selectedLevel);
                  }}
                >
                  ✏️ Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Level Mới */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Tạo Level Mới</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateLevel}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="levelName">
                      <span className="label-icon">🏷️</span>
                      Level Name
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="levelName"
                      name="levelName"
                      value={formData.levelName}
                      onChange={(e) => setFormData(prev => ({ ...prev, levelName: e.target.value }))}
                      placeholder="Nhập tên level (ví dụ: Level 1, Beginner Level...)"
                      required
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Tên hiển thị của level trong game</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="boardSize">
                      <span className="label-icon">📏</span>
                      Board Size
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="boardSize"
                      name="boardSize"
                      value={formData.boardSize}
                      onChange={(e) => setFormData(prev => ({ ...prev, boardSize: parseInt(e.target.value) || 0 }))}
                      placeholder="Nhập kích thước bàn chơi"
                      required
                      min="5"
                      max="20"
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Kích thước lưới bàn chơi (ví dụ: 10 = lưới 10x10). Từ 5 đến 20</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="timeLimit">
                      <span className="label-icon">⏱️</span>
                      Time Limit (giây)
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="timeLimit"
                      name="timeLimit"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                      placeholder="Nhập thời gian giới hạn"
                      required
                      min="60"
                      max="3600"
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Thời gian tối đa để hoàn thành level (tính bằng giây). Từ 60s đến 3600s</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={loadingSubmit}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loadingSubmit || !formData.levelName || formData.boardSize < 5 || formData.timeLimit < 60}
                >
                  {loadingSubmit ? (
                    <>
                      <span className="spinner-small"></span>
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo Level'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Update Level */}
      {showEditModal && selectedLevel && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Cập nhật Level</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateLevel}>
              <div className="modal-body">
                {/* Thông tin Level hiện tại */}
                <div className="info-box">
                  <h4>📌 Level hiện tại:</h4>
                  <p><strong>Level ID:</strong> {selectedLevel.levelId || selectedLevel.id}</p>
                  <p><strong>Level Name:</strong> {selectedLevel.levelName || selectedLevel.name || 'N/A'}</p>
                </div>

                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="editBoardSize">
                      <span className="label-icon">📏</span>
                      Board Size
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="editBoardSize"
                      name="boardSize"
                      value={formData.boardSize}
                      onChange={(e) => setFormData(prev => ({ ...prev, boardSize: parseInt(e.target.value) || 0 }))}
                      placeholder="Nhập kích thước bàn chơi"
                      required
                      min="5"
                      max="20"
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Kích thước lưới bàn chơi (ví dụ: 10 = lưới 10x10). Từ 5 đến 20</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editTimeLimit">
                      <span className="label-icon">⏱️</span>
                      Time Limit (giây)
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="editTimeLimit"
                      name="timeLimit"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                      placeholder="Nhập thời gian giới hạn"
                      required
                      min="60"
                      max="3600"
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Thời gian tối đa để hoàn thành level (tính bằng giây). Từ 60s đến 3600s</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                  disabled={loadingSubmit}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loadingSubmit || formData.boardSize < 5 || formData.timeLimit < 60}
                >
                  {loadingSubmit ? (
                    <>
                      <span className="spinner-small"></span>
                      Đang cập nhật...
                    </>
                  ) : (
                    '💾 Lưu thay đổi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cấu hình Tàu */}
      {showShipConfigModal && selectedLevel && (
        <div className="modal-overlay" onClick={() => {
          setShowShipConfigModal(false);
          setError(null);
        }}>
          <div className="modal-content modal-ship-config" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚓ Cấu hình Tàu cho Level</h2>
              <button className="modal-close" onClick={() => {
                setShowShipConfigModal(false);
                setError(null);
              }}>✕</button>
            </div>

            <form onSubmit={handleConfigureShips}>
              <div className="modal-body">
                {/* Error Alert in Modal */}
                {error && (
                  <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                    ⚠️ {error}
                    <button 
                      className="alert-close"
                      onClick={() => setError(null)}
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Level Info */}
                <div className="info-box">
                  <h4>📌 Level:</h4>
                  <p><strong>Level ID:</strong> {selectedLevel.levelId || selectedLevel.id}</p>
                  <p><strong>Level Name:</strong> {selectedLevel.levelName || selectedLevel.name || 'N/A'}</p>
                </div>

                {/* Ship Types List */}
                <div className="ship-config-section">
                  <h4>🚢 Chọn loại tàu và số lượng:</h4>
                  {loadingShipTypes ? (
                    <div className="loading">Đang tải danh sách tàu...</div>
                  ) : shipTypes.length === 0 ? (
                    <div className="empty-state">
                      <p>Không có loại tàu nào</p>
                    </div>
                  ) : (
                    <div className="ship-config-grid">
                      {shipTypes.map((shipType, index) => {
                        const shipId = shipType.shipTypeId || shipType.id;
                        const shipName = shipType.shipTypeName || shipType.name || `Ship ${index + 1}`;
                        const shipSize = shipType.size || 'N/A';
                        const configItem = shipConfigData.find(item => item.shipTypeId === shipId);
                        
                        return (
                          <div key={shipId || index} className="ship-config-item">
                            <div className="ship-config-info">
                              <div className="ship-config-icon">🚢</div>
                              <div className="ship-config-details">
                                <h5>{shipName}</h5>
                                <p className="ship-size">Size: {shipSize} ô</p>
                              </div>
                            </div>
                            <div className="ship-config-quantity">
                              <label htmlFor={`quantity-${shipId}`}>Số lượng:</label>
                              <input
                                type="number"
                                id={`quantity-${shipId}`}
                                min="0"
                                max="10"
                                value={configItem?.quantity || 0}
                                onChange={(e) => handleShipQuantityChange(shipId, e.target.value)}
                                disabled={loadingSubmit}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => {
                    setShowShipConfigModal(false);
                    setError(null);
                  }}
                  disabled={loadingSubmit}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loadingSubmit || loadingShipTypes}
                >
                  {loadingSubmit ? (
                    <>
                      <span className="spinner-small"></span>
                      Đang lưu...
                    </>
                  ) : (
                    '💾 Lưu cấu hình'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LevelsManagement;
