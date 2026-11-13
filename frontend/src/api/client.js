import axios from 'axios';

// All requests go to /api — proxied by Vite to http://localhost:3000
const api = axios.create({ baseURL: '/api' });

export const fetchSummary         = (params) => api.get('/costs/summary',    { params }).then(r => r.data);
export const fetchTrend           = (params) => api.get('/costs/trend',       { params }).then(r => r.data);
export const fetchByService       = (params) => api.get('/costs/by-service',  { params }).then(r => r.data);
export const fetchRecommendations = (params) => api.get('/recommendations',   { params }).then(r => r.data);
