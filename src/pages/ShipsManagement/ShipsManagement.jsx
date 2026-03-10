import { useState, useEffect } from 'react';
import { Ship, Plus, Anchor, Package, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { getShipTypes, createShipType, updateShipType, deleteShipType } from '../../api';
import './ShipsManagement.css';

function ShipsManagement() {
  const [shipTypes, setShipTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedShip, setSelectedShip] = useState(null);
  
  const [formData, setFormData] = useState({
    shipName: '',
    size: 2,
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

  const handleCreateShipType = async (e) => {
    e.preventDefault();
    try {
      setLoadingSubmit(true);
      setError(null);
      await createShipType(formData);
      setSuccess('Ship type created successfully!');
      setShowCreateModal(false);
      setFormData({ shipName: '', size: 2, modelCode: '' });
      fetchShipTypes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ship type');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleEditClick = (ship) => {
    setSelectedShip(ship);
    setFormData({
      shipName: ship.shipName,
      size: ship.size,
      modelCode: ship.modelCode
    });
    setShowEditModal(true);
  };

  const handleUpdateShipType = async (e) => {
    e.preventDefault();
    try {
      setLoadingSubmit(true);
      setError(null);
      await updateShipType(selectedShip.shipTypeId, formData);
      setSuccess('Ship type updated successfully!');
      setShowEditModal(false);
      setSelectedShip(null);
      setFormData({ shipName: '', size: 2, modelCode: '' });
      fetchShipTypes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ship type');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteClick = (ship) => {
    setSelectedShip(ship);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setError(null);
      await deleteShipType(selectedShip.shipTypeId);
      setSuccess('Ship type deleted successfully!');
      setShowDeleteModal(false);
      setSelectedShip(null);
      fetchShipTypes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete ship type');
      setShowDeleteModal(false);
    }
  };


  return (
    <div className="ships-management">
      <div className="page-header">
        <div>
          <h1>Ship Types Dictionary</h1>
          <p className="page-subtitle">Available ship types for level configuration</p>
        </div>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Add New Ship Type
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
        <div className="loading">Đang tải danh sách ship types...</div>
      ) : !Array.isArray(shipTypes) || shipTypes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚓</div>
          <h3>Chưa có ship type nào</h3>
          <p>Hãy tạo ship type đầu tiên!</p>
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
                <div className="ship-card-actions">
                  <button 
                    className="btn-ship-edit"
                    onClick={() => handleEditClick(ship)}
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                  <button 
                    className="btn-ship-delete"
                    onClick={() => handleDeleteClick(ship)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Modal Create Ship Type */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Plus size={24} className="modal-title-icon create" />
                <h2>Create New Ship Type</h2>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateShipType}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="shipName">
                      <Anchor size={18} className="label-icon" />
                      Ship Name
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="shipName"
                      name="shipName"
                      value={formData.shipName}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipName: e.target.value }))}
                      placeholder="Enter ship name (e.g., Battleship, Destroyer...)"
                      required
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Display name of the ship type</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="size">
                      <Package size={18} className="label-icon" />
                      Size (cells)
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter ship size"
                      required
                      min="1"
                      max="10"
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Number of cells the ship occupies (1-10)</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modelCode">
                      <Ship size={18} className="label-icon" />
                      Model Code
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="modelCode"
                      name="modelCode"
                      value={formData.modelCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelCode: e.target.value }))}
                      placeholder="Enter model code (e.g., BS-01, DD-02...)"
                      required
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Unique identifier code for the ship model</p>
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
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loadingSubmit || !formData.shipName || !formData.modelCode || formData.size < 1}
                >
                  {loadingSubmit ? (
                    <>
                      <span className="spinner-small"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Ship Type'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Ship Type */}
      {showEditModal && selectedShip && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Edit3 size={24} className="modal-title-icon edit" />
                <h2>Edit Ship Type</h2>
              </div>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateShipType}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="editShipName">
                      <Anchor size={18} className="label-icon" />
                      Ship Name
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="editShipName"
                      name="shipName"
                      value={formData.shipName}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipName: e.target.value }))}
                      placeholder="Enter ship name (e.g., Battleship, Destroyer...)"
                      required
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Display name of the ship type</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editSize">
                      <Package size={18} className="label-icon" />
                      Size (cells)
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="editSize"
                      name="size"
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter ship size"
                      required
                      min="1"
                      max="10"
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Number of cells the ship occupies (1-10)</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editModelCode">
                      <Ship size={18} className="label-icon" />
                      Model Code
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="editModelCode"
                      name="modelCode"
                      value={formData.modelCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelCode: e.target.value }))}
                      placeholder="Enter model code (e.g., BS-01, DD-02...)"
                      required
                      disabled={loadingSubmit}
                    />
                    <p className="form-hint">Unique identifier code for the ship model</p>
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
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loadingSubmit || !formData.shipName || !formData.modelCode || formData.size < 1}
                >
                  {loadingSubmit ? (
                    <>
                      <span className="spinner-small"></span>
                      Updating...
                    </>
                  ) : (
                    '💾 Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {showDeleteModal && selectedShip && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <AlertTriangle size={24} className="modal-title-icon delete" />
                <h2>Confirm Delete</h2>
              </div>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="confirm-message">
                <p className="confirm-text">
                  Are you sure you want to delete <strong>"{selectedShip.shipName}"</strong>?
                </p>
                <p className="confirm-warning">
                  This action cannot be undone. All levels using this ship type may be affected.
                </p>
              </div>

              <div className="ship-preview">
                <div className="ship-preview-icon">
                  <Ship size={24} />
                </div>
                <div className="ship-preview-info">
                  <div className="preview-name">{selectedShip.shipName}</div>
                  <div className="preview-details">
                    <span>Size: {selectedShip.size} cells</span>
                    <span>•</span>
                    <span>Model: {selectedShip.modelCode}</span>
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
                Delete Ship Type
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ShipsManagement;
