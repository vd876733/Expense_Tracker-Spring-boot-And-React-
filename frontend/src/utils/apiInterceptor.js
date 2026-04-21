const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

// API Interceptor utility for handling JWT authentication
class ApiInterceptor {
  constructor() {
    const normalizedBaseUrl = API_BASE_URL.replace(/\/+$/, '');
    this.baseURL = `${normalizedBaseUrl}/api`;
  }

  // Get the current token from localStorage
  getToken() {
    return localStorage.getItem('token');
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
    const headers = this.getHeaders(options.headers);

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Handle unauthorized responses
    if (response.status === 401) {
      // Token might be expired, clear it
      localStorage.removeItem('token');
      window.location.reload(); // Force re-render to show login
      throw new Error('Unauthorized - please login again');
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
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('file', file);

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    return fetch(fullUrl, {
      method: 'POST',
      headers,
      body: formData,
      ...options,
    });
  }
}

// Create a singleton instance
const apiInterceptor = new ApiInterceptor();

export default apiInterceptor;