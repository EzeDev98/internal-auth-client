import { apiPost } from '../../shared/lib/apiClient';

export function registerAdmin(payload) {
  // POST /api/v1/admin/register - AdminRegisterRequest shape
  return apiPost('/admin/register', payload);
}
