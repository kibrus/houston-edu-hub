import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000";
const api      = axios.create({ baseURL: BASE_URL });

export const getAllSchools    = (params = {}) => api.get("/api/schools",          { params }).then((r) => r.data);
export const getSchool        = (id)          => api.get(`/api/schools/${id}`).then((r) => r.data);
export const getMetrics       = (id)          => api.get(`/api/metrics/${id}`).then((r) => r.data);
export const getLatestMetrics = (id)          => api.get(`/api/metrics/latest/${id}`).then((r) => r.data);
export const getLatest        = (id)          => api.get(`/api/latest/${id}`).then((r) => r.data);
export const getDiversity     = (id)          => api.get(`/api/diversity/${id}`).then((r) => r.data);
export const getLatestDiversity = (id)        => api.get(`/api/diversity/latest/${id}`).then((r) => r.data);
export const compareSchools   = (ids = [])    => api.get("/api/compare", { params: { ids: ids.join(",") } }).then((r) => r.data);