import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('restaurant_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('restaurant_token');
      localStorage.removeItem('restaurant_user');
    }
    return Promise.reject(new Error(message));
  }
);

// ─── Auth API ───────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin-login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  checkUsername: (username) => api.get(`/auth/check-username/${username}`),
};

// ─── Categories API ─────────────────────────────────────
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete:  (id)    => api.delete(`/categories/${id}`),
  reorder: (data)  => api.put('/categories/reorder', data),
};

// ─── Products API ────────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ─── Orders API ──────────────────────────────────────────
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getByNumber: (number) => api.get(`/orders/number/${number}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  updatePayment: (id, data)       => api.put(`/orders/${id}/payment`, data),
  assignShipper: (id, data)      => api.put(`/orders/${id}/assign-shipper`, data),
  pickupOrder:   (id)            => api.put(`/orders/${id}/pickup`),
  getStats:    ()                   => api.get('/orders/stats/summary'),
  getMyOrders: (params)            => api.get('/orders/my-orders', { params }),
};

// ─── Reviews API ─────────────────────────────────────────────
export const reviewsAPI = {
  getByProduct: (productId, params) => api.get(`/reviews/${productId}`, { params }),
  create:  (productId, data)   => api.post(`/reviews/${productId}`, data),
  update:  (reviewId, data)    => api.put(`/reviews/${reviewId}`, data),
  delete:  (reviewId)          => api.delete(`/reviews/${reviewId}`),
  like:    (reviewId)          => api.post(`/reviews/${reviewId}/like`),
  getAll:  (params)            => api.get('/reviews/admin/all', { params }),
  approve: (reviewId, data)    => api.patch(`/reviews/${reviewId}/approve`, data),
};

// ─── Users API (Admin) ───────────────────────────────────────
export const usersAPI = {
  getAll:  (params)     => api.get('/users', { params }),
  create:  (data)       => api.post('/users', data),
  update:  (id, data)   => api.put(`/users/${id}`, data),
  delete:  (id)         => api.delete(`/users/${id}`),
  toggle:  (id)         => api.patch(`/users/${id}/toggle`),
};

export default api;

// ─── MoMo API ────────────────────────────────────────────────
export const momoAPI = {
  create: (orderId) => api.post('/momo/create', { orderId }),
  check:  (orderId) => api.post('/momo/check',  { orderId }),
};
