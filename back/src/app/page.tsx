'use client';

import { useState, useEffect } from 'react';

interface Usuario {
  id: string;
  email: string;
  rol: string;
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  last_login_at?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export default function Home() {
  // Estados principales
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  // Estados para formularios
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [newUser, setNewUser] = useState({ email: '', password: '', rol: 'usuario' });
  const [selectedUserId, setSelectedUserId] = useState('');

  // Cargar token del localStorage al iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      // Verificar si el token sigue siendo válido
      checkAuthStatus(savedToken);
    }
  }, []);

  // Función para hacer peticiones a la API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    setLoading(true);
    try {
      const url = `/api${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      };

      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();
      setResponse(data);
      return data;
    } catch (error) {
      const errorResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      setResponse(errorResponse);
      return errorResponse;
    } finally {
      setLoading(false);
    }
  };

  // Verificar estado de autenticación
  const checkAuthStatus = async (authToken: string) => {
    const data = await apiCall('/auth/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (data.success) {
      setUser(data.data);
    } else {
      // Token inválido, limpiar
      setToken('');
      setUser(null);
      localStorage.removeItem('auth_token');
    }
  };

  // AUTHENTICATION ENDPOINTS
  const handleLogin = async () => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData)
    });
    
    if (data.success) {
      const newToken = data.data.token;
      setToken(newToken);
      setUser(data.data.user);
      localStorage.setItem('auth_token', newToken);
      setLoginData({ email: '', password: '' });
    }
  };

  const handleRefresh = async () => {
    const data = await apiCall('/auth/refresh', {
      method: 'POST'
    });
    
    if (data.success) {
      const newToken = data.data.token;
      setToken(newToken);
      localStorage.setItem('auth_token', newToken);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setUsuarios([]);
    localStorage.removeItem('auth_token');
    setResponse(null);
  };

  const handleGetMe = async () => {
    await apiCall('/auth/me');
  };

  // USER ENDPOINTS
  const handleGetUsuarios = async () => {
    const data = await apiCall('/usuarios');
    if (data.success) {
      setUsuarios(data.data);
    }
  };

  const handleCreateUsuario = async () => {
    const data = await apiCall('/usuarios', {
      method: 'POST',
      body: JSON.stringify(newUser)
    });
    
    if (data.success) {
      setNewUser({ email: '', password: '', rol: 'usuario' });
      handleGetUsuarios(); // Recargar lista
    }
  };

  const handleGetUsuario = async () => {
    if (!selectedUserId) return;
    await apiCall(`/usuarios/${selectedUserId}`);
  };

  const handleUpdateUsuario = async () => {
    if (!selectedUserId) return;
    const updateData = {
      email: newUser.email || undefined,
      password: newUser.password || undefined,
      rol: newUser.rol || undefined
    };
    
    await apiCall(`/usuarios/${selectedUserId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  };

  const handleDeleteUsuario = async () => {
    if (!selectedUserId) return;
    const data = await apiCall(`/usuarios/${selectedUserId}`, {
      method: 'DELETE'
    });
    
    if (data.success) {
      handleGetUsuarios(); // Recargar lista
    }
  };

  const handleGetProfile = async () => {
    await apiCall('/usuarios/profile');
  };

  const handleUpdateProfile = async () => {
    const updateData = {
      email: newUser.email || undefined,
      password: newUser.password || undefined
    };
    
    await apiCall('/usuarios/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  };

  // ADMIN ENDPOINTS
  const handleGetMetrics = async () => {
    await apiCall('/admin/metrics');
  };

  // SYSTEM ENDPOINTS
  const handleGetHealth = async () => {
    await apiCall('/health');
  };

  const handleGetConfig = async () => {
    await apiCall('/config');
  };

  const handleGetTest = async () => {
    await apiCall('/test');
  };

  return (
    <div className="api-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>🧪 API Testing Dashboard</h1>
          <p>Interfaz para probar todos los endpoints del backend</p>
        </div>
        
        <div className="dashboard-content">
          {/* Status Bar */}
          <div className={`status-bar ${!token ? 'error' : ''}`}>
            <div>
              <strong>Estado:</strong> {token ? `✅ Autenticado como ${user?.email} (${user?.rol})` : '❌ No autenticado'}
            </div>
            {token && (
              <button onClick={handleLogout} className="button danger">
                Cerrar Sesión
              </button>
            )}
          </div>

          <div className="grid-2">
            
            {/* AUTHENTICATION SECTION */}
            <div className="section">
              <h2>🔐 Autenticación</h2>
              
              {!token ? (
                <div>
                  <h3>Login</h3>
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="email"
                      placeholder="Email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      className="input"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="input"
                    />
                    <button onClick={handleLogin} disabled={loading} className="button success" style={{ width: '100%' }}>
                      {loading ? 'Cargando...' : 'Login'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3>Acciones de Autenticación</h3>
                  <button onClick={handleRefresh} disabled={loading} className="button">
                    Refresh Token
                  </button>
                  <button onClick={handleGetMe} disabled={loading} className="button">
                    Obtener Mi Perfil
                  </button>
                </div>
              )}
            </div>

            {/* USERS SECTION */}
            <div className="section">
              <h2>👥 Usuarios</h2>
              
              <div style={{ marginBottom: '15px' }}>
                <button onClick={handleGetUsuarios} disabled={loading} className="button">
                  Obtener Todos los Usuarios
                </button>
                <button onClick={handleGetProfile} disabled={loading || !token} className="button">
                  Mi Perfil
                </button>
              </div>

              <h3>Crear Usuario</h3>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="input"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="input"
                />
                <select
                  value={newUser.rol}
                  onChange={(e) => setNewUser({...newUser, rol: e.target.value})}
                  className="select"
                >
                  <option value="usuario">Usuario</option>
                  <option value="moderador">Moderador</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={handleCreateUsuario} disabled={loading} className="button success" style={{ width: '100%' }}>
                  Crear Usuario
                </button>
              </div>

              <h3>Gestionar Usuario por ID</h3>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="ID del Usuario"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="input"
                />
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <button onClick={handleGetUsuario} disabled={loading || !selectedUserId} className="button">
                    Obtener
                  </button>
                  <button onClick={handleUpdateUsuario} disabled={loading || !selectedUserId} className="button">
                    Actualizar
                  </button>
                  <button onClick={handleDeleteUsuario} disabled={loading || !selectedUserId} className="button danger">
                    Eliminar
                  </button>
                </div>
              </div>

              <h3>Actualizar Mi Perfil</h3>
              <button onClick={handleUpdateProfile} disabled={loading || !token} className="button" style={{ width: '100%' }}>
                Actualizar Perfil
              </button>
            </div>

            {/* ADMIN SECTION */}
            <div className="section">
              <h2>⚙️ Administración</h2>
              <button onClick={handleGetMetrics} disabled={loading || !token} className="button" style={{ width: '100%', marginBottom: '10px' }}>
                Obtener Métricas
              </button>
              <p style={{ fontSize: '12px', color: '#666' }}>
                Requiere autenticación de admin
              </p>
            </div>

            {/* SYSTEM SECTION */}
            <div className="section">
              <h2>🔧 Sistema</h2>
              <button onClick={handleGetHealth} disabled={loading} className="button" style={{ width: '100%', marginBottom: '5px' }}>
                Health Check
              </button>
              <button onClick={handleGetConfig} disabled={loading} className="button" style={{ width: '100%', marginBottom: '5px' }}>
                Configuración
              </button>
              <button onClick={handleGetTest} disabled={loading} className="button" style={{ width: '100%' }}>
                Test de Conexión
              </button>
            </div>
          </div>

          {/* RESPONSE SECTION */}
          <div className="response-section">
            <h2>📋 Respuesta de la API</h2>
            {loading && <p>⏳ Cargando...</p>}
            {response && (
              <pre className="response-content">
                {JSON.stringify(response, null, 2)}
              </pre>
            )}
          </div>

          {/* USERS LIST */}
          {usuarios.length > 0 && (
            <div className="section">
              <h2>📝 Lista de Usuarios ({usuarios.length})</h2>
              <div className="users-list">
                {usuarios.map((usuario) => (
                  <div key={usuario.id} className="user-card">
                    <strong>{usuario.email}</strong> ({usuario.rol})
                    <br />
                    <small>
                      ID: {usuario.id}<br />
                      Creado: {new Date(usuario.created_at).toLocaleString()}<br />
                      Verificado: {usuario.email_verified ? 'Sí' : 'No'}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}