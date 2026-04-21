const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

// API Interceptor utility for handling JWT authentication
class ApiInterceptor {
  constructor() {
    const normalizedBaseUrl = API_BASE_URL.replace(/\/+$/, '');
    this.baseURL = `${normalizedBaseUrl}/api`;
  }

  // Get the current token from localStorage
  getToken() {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('jwtToken')
    );
  }

  clearAuthState() {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('jwt');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
  }

  redirectToLogin() {
    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  }

  // Create headers with Authorization if token exists
  getHeaders(additionalHeaders = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic fetch wrapper with authentication
  async request(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const token = this.getToken();

    console.debug('[apiInterceptor] request', {
      method: options.method || 'GET',
      url: fullUrl,
      hasToken: Boolean(token),
    });

    if (!token) {
      this.redirectToLogin();
      throw new Error('No auth token found - redirecting to login');
    }

    const headers = this.getHeaders(options.headers);

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Handle unauthenticated requests globally
    if (response.status === 401) {
      this.clearAuthState();
      this.redirectToLogin();
      throw new Error('Unauthorized (401) - please login again');
    }

    // Keep session for authorization failures (forbidden)
    if (response.status === 403) {
      throw new Error('Forbidden (403) - insufficient permissions for this action');
    }

    return response;
  }

  // Convenience methods for common HTTP methods
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  // Handle file uploads (for CSV import)
  async upload(url, file, options = {}) {
    const token = this.getToken();
    console.log('[CSV_UPLOAD] Token retrieved from storage:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');
    
    if (!token) {
      console.error('[CSV_UPLOAD] FAILED: No auth token found in localStorage');
      this.redirectToLogin();
      throw new Error('No auth token found - redirecting to login');
    }

    if (token === 'null' || token === 'undefined') {
      console.error('[CSV_UPLOAD] FAILED: Token is string "null" or "undefined":', token);
      this.clearAuthState();
      this.redirectToLogin();
      throw new Error('Invalid token value - redirecting to login');
    }

    const headers = {};
    headers.Authorization = `Bearer ${token}`;
    console.log('[CSV_UPLOAD] Authorization header set:', headers.Authorization.substring(0, 30) + '...');

    const formData = new FormData();
    formData.append('file', file);
    console.log('[CSV_UPLOAD] File appended to FormData:', file.name, 'Size:', file.size);

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    console.log('[CSV_UPLOAD] Sending request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: formData,
      ...options,
    });

    if (response.status === 401) {
      this.clearAuthState();
      this.redirectToLogin();
      throw new Error('Unauthorized (401) - please login again');
    }

    if (response.status === 403) {
      throw new Error('Forbidden (403) - insufficient permissions for this action');
    }

    return response;
  }
}

// Create a singleton instance
const apiInterceptor = new ApiInterceptor();

export default apiInterceptor;