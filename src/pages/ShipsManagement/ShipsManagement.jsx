import { useState, useEffect } from 'react';
import { Ship } from 'lucide-react';
import { getShipTypes, getShipTypeById, createShipType, updateShipType, deleteShipType } from '../../api';
import './ShipsManagement.css';

function ShipsManagement() {
  const [shipTypes, setShipTypes] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    shipName: '',
    size: 1,
    modelCode: ''
  });

  useEffect(() => {
    fetchShipTypes();
  }, []);

  const fetchShipTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getShipTypes();
      console.log('Ship Types Response:', response);
      
      let shipsData = [];
      if (Array.isArray(response)) {
        shipsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        shipsData = response.data;
      }
      
      setShipTypes(shipsData);
    } catch (err) {
      setError('Không thể tải danh sách ship types. Vui lòng thử lại.');
      console.error('Error fetching ship types:', err);
      setShipTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const _handleViewDetail = async (shipTypeId) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const response = await getShipTypeById(shipTypeId);
      console.log('Ship Type Detail:', response);
      
      let shipData = response;
      if (response?.data) {
        shipData = response.data;
      }
      
      setSelectedShip(shipData);
    } catch (err) {
      console.error('Error fetching ship detail:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin ship type. Vui lòng thử lại.');
      setShowDetailModal(false);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateShip = async (e) => {
    e.preventDefault();
    try {
      setLoadingSubmit(true);
      setError(null);
      await createShipType(formData);
      setSuccess('Tạo ship type mới thành công! 🎉');
      setTimeout(() => setSuccess(null), 3000);
      setShowCreateModal(false);
      setFormData({ shipName: '', size: 1, modelCode: '' });
      await fetchShipTypes();
    } catch (err) {
      console.error('Create ship error:', err);
      setError(err.response?.data?.message || 'Không thể tạo ship type. Vui lòng thử lại.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleEditClick = (ship) => {
    console.log('Edit ship data:', ship); // Debug: kiểm tra dữ liệu
    setSelectedShip(ship);
    setFormData({
      shipName: ship.shipName || '',
      size: ship.size || 1,
      modelCode: ship.modelCode || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateShip = async (e) => {
    e.preventDefault();
    try {
      setLoadingSubmit(true);
      setError(null);
      
      // Debug log
      console.log('Updating ship:', selectedShip);
      console.log('Form data:', formData);
      console.log('Ship Type ID:', selectedShip.shipTypeId);
      
      const shipId = selectedShip.shipTypeId;
      if (!shipId) {
        throw new Error('Ship Type ID không hợp lệ');
      }
      
      await updateShipType(shipId, formData);
      setSuccess('Cập nhật ship type thành công! 🎉');
      setTimeout(() => setSuccess(null), 3000);
      setShowEditModal(false);
      setFormData({ shipTypeName: '', size: 1 });
      await fetchShipTypes();
    } catch (err) {
      console.error('Update ship error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Không thể cập nhật ship type. Vui lòng thử lại.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const _handleDeleteShip = async (shipTypeId) => {
    if (window.confirm('Bạn có chắc muốn xóa ship type này?')) {
      try {
        await deleteShipType(shipTypeId);
        setSuccess('Đã xóa ship type thành công!');
        setTimeout(() => setSuccess(null), 3000);
      await fetchShipTypes();
      } catch {
        setError('Không thể xóa ship type. Vui lòng thử lại.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  return (
    <div className="ships-management">
      <div className="page-header">
        <div>
          <h1>Ship Types Dictionary</h1>
          <p className="page-subtitle">Available ship types for level configuration</p>
        </div>
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
        <div className="loading">Đang tải danh sách ship types...</div>
      ) : !Array.isArray(shipTypes) || shipTypes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚓</div>
          <h3>Chưa có ship type nào</h3>
          <p>Hãy tạo ship type đầu tiên!</p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Tạo Ship Type Mới
          </button>
        </div>
      ) : (
        <div className="ships-grid">
          {shipTypes.map((ship, index) => (
              <div key={ship.shipTypeId || index} className="ship-card">
                <div className="ship-card-header">
                  <div className="ship-icon-manage"><Ship size={32} /></div>
                  <div className="ship-info">
                    <h3>{ship.shipName}</h3>
                    <span className="ship-size-badge">Size: {ship.size} cells</span>
                  </div>
                </div>
                <div className="ship-card-body">
                  <div className="ship-model-code">
                    <span className="model-label">Model Code:</span>
                    <span className="model-value">{ship.modelCode}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Modal Chi tiết Ship */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚢 Chi tiết Ship Type</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {loadingDetail ? (
                <div className="modal-loading">
                  <div className="spinner-large"></div>
                  <p>Đang tải thông tin...</p>
                </div>
              ) : selectedShip ? (
                <div className="ship-detail-content">
                  <div className="detail-section">
                    <h3 className="section-title">📋 Thông tin Ship Type</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Ship Type ID:</span>
                        <span className="detail-value">{selectedShip.shipTypeId || selectedShip.id || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Ship Type Name:</span>
                        <span className="detail-value strong">{selectedShip.shipTypeName || selectedShip.name || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Size:</span>
                        <span className="detail-value">{selectedShip.size || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
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
              {selectedShip && (
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEditClick(selectedShip);
                  }}
                >
                  ✏️ Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Ship Type Mới */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Tạo Ship Type Mới</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateShip}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="shipName">
                      <span className="label-icon">🏷️</span>
                      Ship Name
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="shipName"
                      name="shipName"
                      value={formData.shipName}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipName: e.target.value }))}
                      placeholder="Nhập tên loại tàu (ví dụ: Battleship, Destroyer...)"
                      required
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Tên loại tàu trong game</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="size">
                      <span className="label-icon">📏</span>
                      Size
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) || 0 }))}
                      placeholder="Nhập kích thước tàu"
                      required
                      min="1"
                      max="10"
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Kích thước tàu (số ô chiếm trên bàn chơi). Từ 1 đến 10</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modelCode">
                      <span className="label-icon">🔖</span>
                      Model Code
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="modelCode"
                      name="modelCode"
                      value={formData.modelCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelCode: e.target.value }))}
                      placeholder="Nhập mã model (ví dụ: BS-001, DD-002...)"
                      required
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Mã định danh model của tàu</p>
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
                  disabled={loadingSubmit || !formData.shipName || !formData.modelCode || formData.size < 1}
                >
                  {loadingSubmit ? (
                    <>
                      <span className="spinner-small"></span>
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo Ship Type'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Update Ship Type */}
      {showEditModal && selectedShip && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Cập nhật Ship Type</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateShip}>
              <div className="modal-body">
                <div className="info-box">
                  <h4>📌 Ship Type hiện tại:</h4>
                  <p><strong>Ship Type ID:</strong> {selectedShip.shipTypeId}</p>
                  <p><strong>Ship Name:</strong> {selectedShip.shipName || 'N/A'}</p>
                  <p><strong>Size hiện tại:</strong> {selectedShip.size || 'N/A'}</p>
                </div>

                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="editShipName">
                      <span className="label-icon">🏷️</span>
                      Ship Name
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="editShipName"
                      name="shipName"
                      value={formData.shipName}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipName: e.target.value }))}
                      placeholder="Nhập tên loại tàu"
                      required
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Tên loại tàu trong game</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editSize">
                      <span className="label-icon">📏</span>
                      Size
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="editSize"
                      name="size"
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) || 0 }))}
                      placeholder="Nhập kích thước tàu"
                      required
                      min="1"
                      max="10"
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Kích thước tàu (số ô chiếm trên bàn chơi). Từ 1 đến 10</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editModelCode">
                      <span className="label-icon">🔖</span>
                      Model Code
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="editModelCode"
                      name="modelCode"
                      value={formData.modelCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelCode: e.target.value }))}
                      placeholder="Nhập mã model"
                      required
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Mã định danh model của tàu</p>
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
                  disabled={loadingSubmit || !formData.shipName || !formData.modelCode || formData.size < 1}
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
    </div>
  );
}

export default ShipsManagement;
