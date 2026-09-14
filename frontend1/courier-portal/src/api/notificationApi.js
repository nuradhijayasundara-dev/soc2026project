import apiClient from './apiClient';

export const getMyNotifications = () => apiClient.get('/notifications/mine').then((r) => r.data);

export const getUnreadCount = () =>
  apiClient.get('/notifications/unread-count').then((r) => r.data.unreadCount);

export const markNotificationRead = (id) =>
  apiClient.patch(`/notifications/${id}/read`).then((r) => r.data);

export const markAllNotificationsRead = () => apiClient.patch('/notifications/read-all');
