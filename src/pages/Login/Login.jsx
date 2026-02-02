import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../../api';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error khi user bắt đầu nhập
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (isRegisterMode && !formData.email) {
      setError('Vui lòng nhập email');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isRegisterMode) {
        // Đăng ký
        await register(formData);
        setError(null);
        setShowSuccessModal(true);
        // Will handle mode switch and form clear after modal close
      } else {
        // Đăng nhập
        const response = await login(formData);
        console.log('Login successful:', response);
        console.log('Login response data:', response.data);
        
        // Dispatch custom event to notify App.jsx to update user role
        window.dispatchEvent(new Event('userLogin'));
        
        // Get user info from localStorage (saved by login API)
        const userStr = localStorage.getItem('user');
        console.log('User from localStorage:', userStr);
        
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('Parsed user:', user);
          console.log('User role:', user.role);
          
          // Redirect based on role
          if (user.role === 'Player') {
            console.log('Redirecting to /home (Player)');
            navigate('/home');
          } else {
            console.log('Redirecting to / (Admin)');
            // Admin, SuperAdmin, or other roles go to dashboard
            navigate('/');
          }
        } else {
          console.log('No user data found, redirecting to /');
          // Fallback to home if user data not found
          navigate('/');
        }
      }
    } catch (err) {
      console.error(isRegisterMode ? 'Register error:' : 'Login error:', err);
      
      if (err.response) {
        const message = err.response.data?.message || (isRegisterMode ? 'Đăng ký thất bại' : 'Đăng nhập thất bại');
        setError(message);
      } else if (err.request) {
        setError('Không thể kết nối đến server. Vui lòng thử lại.');
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError(null);
    setFormData({ username: '', password: '', email: '' });
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setIsRegisterMode(false);
    setFormData({ username: '', password: '', email: '' });
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-shape"></div>
        <div className="login-shape"></div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay" onClick={handleCloseSuccessModal}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-wrapper">
              <div className="success-icon-circle">
                <svg className="success-checkmark" viewBox="0 0 52 52">
                  <circle className="success-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                  <path className="success-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
            </div>
            
            <h2 className="success-title">Đăng ký thành công!</h2>
            <p className="success-message">
              Tài khoản của bạn đã được tạo thành công.<br/>
              Bây giờ bạn có thể đăng nhập vào hệ thống.
            </p>
            
            <button 
              className="success-button"
              onClick={handleCloseSuccessModal}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      )}

      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">⚓</span>
            <h1>Fleet Battle</h1>
          </div>
          <p className="subtitle">{isRegisterMode ? 'Đăng ký tài khoản' : 'Admin Dashboard'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">
              <span className="label-icon">👤</span>
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Nhập username"
              disabled={loading}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span className="label-icon">🔒</span>
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Nhập password"
                disabled={loading}
                autoComplete={isRegisterMode ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="email">
                <span className="label-icon">📧</span>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập email"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          )}

          {!isRegisterMode && (
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="forgot-password">Quên mật khẩu?</a>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-login"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {isRegisterMode ? 'Đang đăng ký...' : 'Đang đăng nhập...'}
              </>
            ) : (
              isRegisterMode ? 'Đăng ký' : 'Đăng nhập'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isRegisterMode ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
            <a href="#" onClick={(e) => { e.preventDefault(); handleToggleMode(); }}>
              {isRegisterMode ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
