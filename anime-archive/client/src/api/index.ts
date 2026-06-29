import request from './request';

// Auth
export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    request.post('/auth/register', data),
  login: (data: { login: string; password: string }) =>
    request.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    request.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) =>
    request.post('/auth/logout', { refreshToken }),
  me: () => request.get('/auth/me'),
};

// Anime
export const animeAPI = {
  list: (params?: any) => request.get('/anime', { params }),
  get: (id: string) => request.get(`/anime/${id}`),
  create: (data: any) => request.post('/anime', data),
  update: (id: string, data: any) => request.put(`/anime/${id}`, data),
  delete: (id: string) => request.delete(`/anime/${id}`),
};

// Characters
export const characterAPI = {
  list: (params?: any) => request.get('/characters', { params }),
  get: (id: string) => request.get(`/characters/${id}`),
  create: (data: any) => request.post('/characters', data),
  update: (id: string, data: any) => request.put(`/characters/${id}`, data),
  delete: (id: string) => request.delete(`/characters/${id}`),
  uploadImages: (id: string, formData: FormData) =>
    request.post(`/characters/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (characterId: string, imageId: string) =>
    request.delete(`/characters/${characterId}/images/${imageId}`),
  sortImages: (characterId: string, imageIds: string[]) =>
    request.put(`/characters/${characterId}/images/sort`, { imageIds }),
  compare: (ids: string[]) =>
    request.get('/characters/compare', { params: { ids: ids.join(',') } }),
  export: (id: string) => request.get(`/characters/${id}/export`),
  history: (id: string) => request.get(`/characters/${id}/history`),
};

// Tags
export const tagAPI = {
  list: () => request.get('/tags'),
  create: (data: any) => request.post('/tags', data),
  update: (id: string, data: any) => request.put(`/tags/${id}`, data),
  delete: (id: string) => request.delete(`/tags/${id}`),
};

// Favorites
export const favoriteAPI = {
  toggle: (characterId: string, collection?: string) =>
    request.post(`/favorites/${characterId}`, { collection }),
  list: (params?: any) => request.get('/favorites', { params }),
  collections: () => request.get('/favorites/collections/list'),
};

// Ratings
export const ratingAPI = {
  rate: (characterId: string, score: number) =>
    request.post(`/ratings/${characterId}`, { score }),
  get: (characterId: string) => request.get(`/ratings/${characterId}`),
};

// Comments
export const commentAPI = {
  list: (characterId: string, params?: any) =>
    request.get(`/comments/${characterId}`, { params }),
  create: (characterId: string, data: { content: string; parentId?: string }) =>
    request.post(`/comments/${characterId}`, data),
  delete: (id: string) => request.delete(`/comments/detail/${id}`),
};

// Upload (Cloudflare R2)
export const uploadAPI = {
  uploadImage: (formData: FormData) =>
    request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
