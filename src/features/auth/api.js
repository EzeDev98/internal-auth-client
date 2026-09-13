import { apiPost } from '../../shared/lib/apiClient';

export function registerAdmin(payload) {
  // POST /api/v1/admin/register - AdminRegisterRequest shape
  return apiPost('/admin/register', payload);
}

// Step 5C/5D - like registerAdmin above, these call internal-auth-server
// directly (no BFF, no session cookie) since none of the three steps ever
// establishes a session: /admin/password-reset/request and /verify-otp are
// the additive admin-scoped endpoints added alongside this step (no client
// secret involved), and /password-reset/complete needs no client-identifying
// header at all.
export function requestPasswordReset(phoneNumber) {
  return apiPost('/admin/password-reset/request', { phoneNumber });
}

export function verifyPasswordResetOtp(phoneNumber, otp) {
  return apiPost('/admin/password-reset/verify-otp', { phoneNumber, otp });
}

export function completePasswordReset({ resetToken, newPassword, confirmPassword }) {
  return apiPost('/password-reset/complete', { resetToken, newPassword, confirmPassword });
}
