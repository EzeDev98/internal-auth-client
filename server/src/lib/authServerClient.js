import axios from 'axios';
import { env } from '../config/env.js';

// validateStatus never throws - callers forward the auth server's own
// {success,message,data,errorCode} body and status code as-is, rather than
// this BFF inventing its own error shape for upstream failures.
const client = axios.create({
  baseURL: env.authServerBaseUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true,
});

export function adminLogin(username, password) {
  return client.post('/admin/login', { username, password });
}

export function adminVerifyLoginOtp(phoneNumber, otp) {
  return client.post('/admin/login/verify-otp', { phoneNumber, otp });
}

export function adminRefreshToken(refreshToken) {
  return client.post('/admin/refresh-token', { refreshToken });
}

export function logoutSession(accessToken) {
  return client.delete('/session', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
