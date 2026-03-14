import { useState, useEffect } from 'react';
import { getAdminLevels, getLevelById, createLevel, updateLevel, deleteLevel, configureLevelShips, getShipTypes } from '../../../api';
import { Grid3x3, Clock, Plus, Ship, Anchor, Package, CheckCircle2, Tag, Edit3, Map, Info, AlertTriangle, Trash2 } from 'lucide-react';
import './LevelsManagement.css';

function LevelsManagement() {
  const [levels, setLevels] = useState([]);
  const [shipTypes, setShipTypes] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShipConfigModal, setShowShipConfigModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingShipTypes, setLoadingShipTypes] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    levelName: '',
    boardSize: 10,
    timeLimit: 600,
    eloMin: 0,
    eloMax: 0,
    eloPoints: 0
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
      setFormData({ levelName: '', boardSize: 10, timeLimit: 600, eloMin: 0, eloMax: 0, eloPoints: 0 });
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
      timeLimit: level.timeLimit || 600,
      eloMin: level.eloMin || 0,
      eloMax: level.eloMax || 0,
      eloPoints: level.eloPoints || 0
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

  const handleDeleteClick = (level) => {
    setSelectedLevel(level);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const levelId = selectedLevel.levelId || selectedLevel.id;
      await deleteLevel(levelId);
      setSuccess('Level deleted successfully! 🎉');
      setShowDeleteModal(false);
      setSelectedLevel(null);
      await fetchLevels();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Delete level error:', err);
      setError(err.response?.data?.message || 'Cannot delete level. Please try again.');
      setShowDeleteModal(false);
      setTimeout(() => setError(null), 3000);
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
    
    // Fetch ship types
    await fetchShipTypes();
    
    // Pre-fill existing configuration if available
    if (level.ships && level.ships.length > 0) {
      // Map existing ships to config data
      const existingConfig = shipTypes.map(ship => {
        const shipId = ship.shipTypeId || ship.id;
        const existingShip = level.ships.find(s => 
          (s.shipTypeId || s.id) === shipId
        );
        return {
          shipTypeId: shipId,
          quantity: existingShip ? (existingShip.quantity || 0) : 0
        };
      });
      setShipConfigData(existingConfig);
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
        setError('Please select at least one ship type with quantity > 0');
        setLoadingSubmit(false);
        return;
      }
      
      console.log('Sending ship config:', shipsToSend);
      await configureLevelShips(levelId, shipsToSend);
      
      setSuccess('Ships configured successfully! 🎉');
      setTimeout(() => setSuccess(null), 3000);
      setShowShipConfigModal(false);
      await fetchLevels();
    } catch (err) {
      console.error('Configure ships error:', err);
      setError(err.response?.data?.message || 'Cannot configure ships. Please try again.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const renderShipPreview = (shapePattern) => {
    let activeCells = [];
    try {
      if (typeof shapePattern === 'string') {
        activeCells = JSON.parse(shapePattern || '[[0,0]]');
      } else if (Array.isArray(shapePattern)) {
        activeCells = shapePattern;
      } else {
        activeCells = [[0,0]];
      }
    } catch (e) {
      activeCells = [[0,0]];
    }

    const grid = Array(5).fill().map(() => Array(5).fill(false));
    activeCells.forEach(([x, y]) => {
      const c = x + 2;
      const r = y + 2;
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        grid[r][c] = true;
      }
    });

    return (
      <div className="mini-shape-grid">
        {grid.map((row, r) => (
          row.map((isActive, c) => {
            const isAnchor = r === 2 && c === 2;
            return (
              <div
                key={`${r}-${c}`}
                className={`mini-shape-cell ${isActive ? 'active' : ''} ${isAnchor ? 'anchor' : ''}`}
              />
            );
          })
        ))}
      </div>
    );
  };

  return (
    <div className="levels-management">
      <div className="page-header">
        <div>
          <h1>Level Management</h1>
          <p className="page-subtitle">Configure game levels and difficulty settings</p>
        </div>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Create New Level
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
          {levels.map((level, index) => {
            const levelNumber = index + 1;
              
              return (
                <div key={level.levelId} className="level-card">
                  <div className="level-header cursor-pointer group" onClick={() => handleViewDetail(level.levelId || level.id)}>
                    <h3 className="level-title group-hover:text-blue-600 transition-colors">{level.levelName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="level-badge">Level {levelNumber}</span>
                      <button 
                        className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Info size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {level.description && (
                    <p className="level-description">{level.description}</p>
                  )}
                  
                  <div className="level-stats">
                    <div className="level-stat-row">
                      <Grid3x3 size={20} className="stat-icon" />
                      <span className="stat-label">Board Size</span>
                      <span className="stat-value">{level.boardSize}x{level.boardSize}</span>
                    </div>
                    <div className="level-stat-row">
                      <Clock size={20} className="stat-icon" />
                      <span className="stat-label">Time Limit</span>
                      <span className="stat-value">{level.timeLimit}s per turn</span>
                    </div>
                    <div className="level-stat-row">
                      <Ship size={20} className="stat-icon" />
                      <span className="stat-label">Ships Configured</span>
                      <span className="stat-value">{level.totalShips} ships</span>
                    </div>
                  </div>
                  
                  <div className="level-card-actions">
                    <button 
                      className="btn-level-edit"
                      onClick={() => handleEditClick(level)}
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>
                    <button 
                      className="btn-level-delete"
                      onClick={() => handleDeleteClick(level)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                  <div>
                    <button 
                      className="btn-level-configure"
                      onClick={() => handleOpenShipConfig(level)}
                    >
                      <Ship size={16} />
                      Configure Ships
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {/* Modal Delete Confirmation */}
      {showDeleteModal && selectedLevel && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <AlertTriangle size={24} className="modal-title-icon delete" />
                <h2>Confirm Delete Level</h2>
              </div>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="confirm-message">
                <p className="confirm-text">
                  Are you sure you want to delete <strong>"{selectedLevel.levelName}"</strong>?
                </p>
                <p className="confirm-warning">
                  This action cannot be undone. All configurations and ship assignments for this level will be permanently removed.
                </p>
              </div>

              <div className="level-preview">
                <div className="level-preview-icon">
                  <Map size={24} />
                </div>
                <div className="level-preview-info">
                  <div className="preview-name">{selectedLevel.levelName}</div>
                  <div className="preview-details">
                    <span>Board: {selectedLevel.boardSize}x{selectedLevel.boardSize}</span>
                    <span>•</span>
                    <span>Time: {selectedLevel.timeLimit}s</span>
                    <span>•</span>
                    <span>Ships: {selectedLevel.totalShips || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger"
                onClick={handleConfirmDelete}
              >
                <Trash2 size={16} />
                Delete Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Level */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Map size={24} className="modal-title-icon" />
                <h2>Chi tiết Level</h2>
              </div>
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
                    <h3 className="section-title">
                      <Info size={18} />
                      Thông tin cơ bản
                    </h3>
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
                      <div className="detail-item">
                        <span className="detail-label">Elo Range:</span>
                        <span className="detail-value">
                          {selectedLevel.eloMin !== undefined ? selectedLevel.eloMin : 'N/A'} - {selectedLevel.eloMax !== undefined ? selectedLevel.eloMax : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Elo Points:</span>
                        <span className="detail-value strong" style={{ color: '#10b981' }}>
                          +{selectedLevel.eloPoints !== undefined ? selectedLevel.eloPoints : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cấu hình tàu */}
                  {selectedLevel.ships && selectedLevel.ships.length > 0 && (
                    <div className="detail-section">
                      <h3 className="section-title">
                        <Anchor size={18} />
                        Cấu hình Tàu
                      </h3>
                      <div className="ships-list">
                        {selectedLevel.ships.map((ship, index) => (
                          <div key={index} className="ship-item">
                            <div className="ship-icon" title="Ship Shape Preview">
                              {renderShipPreview(ship.shapePattern)}
                            </div>
                            <div className="ship-info">
                              <div className="ship-name">{ship.shipName || ship.shipTypeName || `Ship ${index + 1}`}</div>
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
              <div className="modal-title-with-icon">
                <Plus size={24} className="modal-title-icon create" />
                <h2>Tạo Level Mới</h2>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateLevel}>
              <div className="modal-body">
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
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="levelName">
                      <Tag size={18} className="label-icon" />
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
                      <Grid3x3 size={18} className="label-icon" />
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
                      <Clock size={18} className="label-icon" />
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

                  <div className="form-group">
                    <label htmlFor="eloMin">
                      <Tag size={18} className="label-icon" />
                      Elo Tối Thiểu
                    </label>
                    <input
                      type="number"
                      id="eloMin"
                      name="eloMin"
                      value={formData.eloMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, eloMin: parseInt(e.target.value) || 0 }))}
                      placeholder="Elo tối thiểu để chơi level này"
                      min="0"
                      disabled={loadingSubmit}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eloMax">
                      <Tag size={18} className="label-icon" />
                      Elo Tối Đa
                    </label>
                    <input
                      type="number"
                      id="eloMax"
                      name="eloMax"
                      value={formData.eloMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, eloMax: parseInt(e.target.value) || 0 }))}
                      placeholder="Elo tối đa để chơi level này"
                      min="0"
                      disabled={loadingSubmit}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eloPoints">
                      <Tag size={18} className="label-icon" />
                      Điểm thưởng Elo
                    </label>
                    <input
                      type="number"
                      id="eloPoints"
                      name="eloPoints"
                      value={formData.eloPoints}
                      onChange={(e) => setFormData(prev => ({ ...prev, eloPoints: parseInt(e.target.value) || 0 }))}
                      placeholder="Số Elo nhận được khi thắng"
                      min="0"
                      disabled={loadingSubmit}
                    />
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
              <div className="modal-title-with-icon">
                <Edit3 size={24} className="modal-title-icon edit" />
                <h2>Cập nhật Level</h2>
              </div>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateLevel}>
              <div className="modal-body">
                {/* Thông tin Level hiện tại */}
                <div className="info-box">
                  <div className="info-box-header">
                    <Info size={18} />
                    <h4>Level hiện tại:</h4>
                  </div>
                  <p><strong>Level ID:</strong> {selectedLevel.levelId || selectedLevel.id}</p>
                  <p><strong>Level Name:</strong> {selectedLevel.levelName || selectedLevel.name || 'N/A'}</p>
                </div>

                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="editBoardSize">
                      <Grid3x3 size={18} className="label-icon" />
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
                      <Clock size={18} className="label-icon" />
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

                  <div className="form-group">
                    <label htmlFor="editEloMin">
                      <Tag size={18} className="label-icon" />
                      Elo Tối Thiểu
                    </label>
                    <input
                      type="number"
                      id="editEloMin"
                      name="eloMin"
                      value={formData.eloMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, eloMin: parseInt(e.target.value) || 0 }))}
                      placeholder="Elo tối thiểu để chơi level này"
                      min="0"
                      disabled={loadingSubmit}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editEloMax">
                      <Tag size={18} className="label-icon" />
                      Elo Tối Đa
                    </label>
                    <input
                      type="number"
                      id="editEloMax"
                      name="eloMax"
                      value={formData.eloMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, eloMax: parseInt(e.target.value) || 0 }))}
                      placeholder="Elo tối đa để chơi level này"
                      min="0"
                      disabled={loadingSubmit}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editEloPoints">
                      <Tag size={18} className="label-icon" />
                      Điểm thưởng Elo
                    </label>
                    <input
                      type="number"
                      id="editEloPoints"
                      name="eloPoints"
                      value={formData.eloPoints}
                      onChange={(e) => setFormData(prev => ({ ...prev, eloPoints: parseInt(e.target.value) || 0 }))}
                      placeholder="Số Elo nhận được khi thắng"
                      min="0"
                      disabled={loadingSubmit}
                    />
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
              <div className="modal-title-with-icon">
                <Ship size={24} className="modal-title-icon" />
                <h2>Configure Ships for Level</h2>
              </div>
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
                  <div className="info-box-header">
                    <Info size={18} />
                    <h4>Level Information:</h4>
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Level Name:</span>
                      <span className="info-value">{selectedLevel.levelName || selectedLevel.name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Board Size:</span>
                      <span className="info-value">{selectedLevel.boardSize}x{selectedLevel.boardSize}</span>
                    </div>
                  </div>
                </div>

                {/* Ship Types List */}
                <div className="ship-config-section">
                  <div className="section-header">
                    <div className="section-title-with-icon">
                      <Package size={18} />
                      <h4>Select Ship Types and Quantities</h4>
                    </div>
                    <p className="section-hint">Choose the number of each ship type for this level</p>
                  </div>
                  {loadingShipTypes ? (
                    <div className="loading-state">
                      <div className="spinner-large"></div>
                      <p>Loading ship types...</p>
                    </div>
                  ) : shipTypes.length === 0 ? (
                    <div className="empty-state">
                      <Ship size={48} className="empty-icon-svg" strokeWidth={1.5} />
                      <h3>No Ship Types Available</h3>
                      <p>Please add ship types before configuring levels</p>
                    </div>
                  ) : (
                    <>
                      <div className="ship-config-grid">
                        {shipTypes.map((shipType, index) => {
                          const shipId = shipType.shipTypeId || shipType.id;
                          const shipName = shipType.shipName || shipType.name || `Ship ${index + 1}`;
                          const shipSize = shipType.size || 'N/A';
                          const configItem = shipConfigData.find(item => item.shipTypeId === shipId);
                          const quantity = configItem?.quantity || 0;
                          
                          return (
                            <div 
                              key={shipId || index} 
                              className={`ship-config-item ${quantity > 0 ? 'selected' : ''}`}
                            >
                              <div className="ship-config-info">
                                <div className="ship-config-icon" title="Ship Shape Preview">
                                  {renderShipPreview(shipType.shapePattern)}
                                  {quantity > 0 && (
                                    <span className="quantity-badge">{quantity}</span>
                                  )}
                                </div>
                                <div className="ship-config-details">
                                  <h5>{shipName}</h5>
                                  <p className="ship-size">Size: {shipSize} cells</p>
                                </div>
                              </div>
                              <div className="ship-config-quantity">
                                <label htmlFor={`quantity-${shipId}`}>Quantity:</label>
                                <input
                                  type="number"
                                  id={`quantity-${shipId}`}
                                  min="0"
                                  max="10"
                                  value={quantity}
                                  onChange={(e) => handleShipQuantityChange(shipId, e.target.value)}
                                  disabled={loadingSubmit}
                                  className={quantity > 0 ? 'has-value' : ''}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Summary */}
                      {shipConfigData.some(item => item.quantity > 0) && (
                        <div className="ship-config-summary">
                          <div className="summary-header">
                            <CheckCircle2 size={20} />
                            <h4>Configuration Summary</h4>
                          </div>
                          <div className="summary-stats">
                            <div className="summary-item">
                              <span className="summary-label">Total Ships:</span>
                              <span className="summary-value">
                                {shipConfigData.reduce((sum, item) => sum + (item.quantity || 0), 0)} ships
                              </span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">Ship Types:</span>
                              <span className="summary-value">
                                {shipConfigData.filter(item => item.quantity > 0).length} types
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
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
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loadingSubmit || loadingShipTypes || !shipConfigData.some(item => item.quantity > 0)}
                >
                  {loadingSubmit ? (
                    <>
                      <span className="spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    '💾 Save Configuration'
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
