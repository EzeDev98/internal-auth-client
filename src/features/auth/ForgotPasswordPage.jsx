import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { Form, FormGroup, TextInput, ActionGroup, Alert, Card, CardBody, PageSection } from '@patternfly/react-core';
import Button from '../../shared/components/Button';
import AuthHeading from '../../shared/components/AuthHeading';
import { requestPasswordReset, verifyPasswordResetOtp } from './api';
import { useToast } from '../../shared/lib/toastContext';
import { phoneSchema, otpOnlySchema } from './forgotPasswordSchema';
import styles from './ForgotPasswordPage.module.css';

// Step 5C - two-step form (phone, then OTP) against the additive
// /admin/password-reset/request and /verify-otp endpoints (see
// AdminController's Javadoc for why the client-Basic-Auth-gated originals
// couldn't be used here). Unlike LoginPage's OTP step, the phone number IS
// known at this point - it's carried forward in component state rather
// than asked for twice. On success, hands the resetToken to ResetPasswordPage
// via router state (never the URL) rather than making the user copy/paste it.
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [serverError, setServerError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);

  const phoneForm = useForm({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm({ resolver: zodResolver(otpOnlySchema) });

  const onSubmitPhone = async (values) => {
    setServerError(null);
    try {
      await requestPasswordReset(values.phoneNumber);
      setPhoneNumber(values.phoneNumber);
    } catch (err) {
      setServerError(err.message);
    }
  };

  const onSubmitOtp = async (values) => {
    setServerError(null);
    try {
      const result = await verifyPasswordResetOtp(phoneNumber, values.otp);
      toast.success('Code verified');
      navigate('/reset-password', { state: { resetToken: result.resetToken } });
    } catch (err) {
      setServerError(err.message);
    }
  };

  if (phoneNumber) {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = otpForm;

    return (
      <PageSection>
        <Card className={styles.card}>
          <CardBody>
            <AuthHeading title="Enter verification code" />
            <p className={styles.intro}>
              If <strong>{phoneNumber}</strong> is registered, a verification code was sent to it.
            </p>
            <Form onSubmit={handleSubmit(onSubmitOtp)}>
              {serverError && <Alert variant="danger" title={serverError} />}

              <FormGroup label="Verification code" isRequired fieldId="otp">
                <TextInput id="otp" {...register('otp')} validated={errors.otp ? 'error' : 'default'} />
                {errors.otp && <div className={styles.fieldError}>{errors.otp.message}</div>}
              </FormGroup>

              <ActionGroup>
                <Button type="submit" isLoading={isSubmitting} variant="primary">
                  Verify code
                </Button>
              </ActionGroup>
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = phoneForm;

  return (
    <PageSection>
      <Card className={styles.card}>
        <CardBody>
          <AuthHeading title="Forgot password" subtitle="We'll send a verification code to your phone" />

          <Form onSubmit={handleSubmit(onSubmitPhone)}>
            {serverError && <Alert variant="danger" title={serverError} />}

            <FormGroup label="Phone number" isRequired fieldId="phoneNumber">
              <TextInput id="phoneNumber" {...register('phoneNumber')} validated={errors.phoneNumber ? 'error' : 'default'} />
              {errors.phoneNumber && <div className={styles.fieldError}>{errors.phoneNumber.message}</div>}
            </FormGroup>

            <ActionGroup>
              <Button type="submit" isLoading={isSubmitting} variant="primary">
                Send verification code
              </Button>
            </ActionGroup>
          </Form>

          <p className={styles.loginLink}>
            <Link to="/login">Back to login</Link>
          </p>
        </CardBody>
      </Card>
    </PageSection>
  );
}
