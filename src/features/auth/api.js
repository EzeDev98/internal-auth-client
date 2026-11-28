// API calls for admin registration and password reset.
import { apiPost } from '../../shared/lib/apiClient';

export function registerAdmin(payload) {
  return apiPost('/admin/register', payload);
}

export function requestPasswordReset(phoneNumber) {
  return apiPost('/admin/password-reset/request', { phoneNumber });
}

export function verifyPasswordResetOtp(phoneNumber, otp) {
  return apiPost('/admin/password-reset/verify-otp', { phoneNumber, otp });
}

export function completePasswordReset({ resetToken, newPassword, confirmPassword }) {
  return apiPost('/password-reset/complete', { resetToken, newPassword, confirmPassword });
}
