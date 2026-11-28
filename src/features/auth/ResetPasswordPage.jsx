// Sets a new password using the reset token from the forgot password flow.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, Link } from 'react-router';
import { Form, FormGroup, ActionGroup, Alert, Card, CardBody, PageSection } from '@patternfly/react-core';
import Button from '../../shared/components/Button';
import PasswordInput from '../../shared/components/PasswordInput';
import AuthHeading from '../../shared/components/AuthHeading';
import { completePasswordReset } from './api';
import { resetPasswordSchema } from './resetPasswordSchema';
import styles from './ResetPasswordPage.module.css';

export default function ResetPasswordPage() {
  const location = useLocation();
  const resetToken = location.state?.resetToken;
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await completePasswordReset({ resetToken, ...values });
      setSuccess(true);
    } catch (err) {
      setServerError(err.message);
    }
  };

  if (!resetToken) {
    return (
      <PageSection>
        <Card className={styles.card}>
          <CardBody>
            <Alert variant="warning" title="Start password reset again">
              This link is no longer valid. Request a new verification code to reset your password.
            </Alert>
            <p className={styles.loginLink}>
              <Link to="/forgot-password">Forgot password</Link>
            </p>
          </CardBody>
        </Card>
      </PageSection>
    );
  }

  if (success) {
    return (
      <PageSection>
        <Card className={styles.card}>
          <CardBody>
            <Alert variant="success" title="Password reset">
              Your password has been changed. You can now sign in with your new password.
            </Alert>
            <p className={styles.loginLink}>
              <Link to="/login">Go to login</Link>
            </p>
          </CardBody>
        </Card>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Card className={styles.card}>
        <CardBody>
          <AuthHeading title="Reset password" subtitle="Choose a new password for your account" />

          <Form onSubmit={handleSubmit(onSubmit)}>
            {serverError && <Alert variant="danger" title={serverError} />}

            <FormGroup label="New password" isRequired fieldId="newPassword">
              <PasswordInput id="newPassword" {...register('newPassword')} validated={errors.newPassword ? 'error' : 'default'} />
              {errors.newPassword && <div className={styles.fieldError}>{errors.newPassword.message}</div>}
            </FormGroup>

            <FormGroup label="Confirm new password" isRequired fieldId="confirmPassword">
              <PasswordInput id="confirmPassword" {...register('confirmPassword')} validated={errors.confirmPassword ? 'error' : 'default'} />
              {errors.confirmPassword && <div className={styles.fieldError}>{errors.confirmPassword.message}</div>}
            </FormGroup>

            <ActionGroup>
              <Button type="submit" isLoading={isSubmitting} variant="primary">Reset password</Button>
            </ActionGroup>
          </Form>
        </CardBody>
      </Card>
    </PageSection>
  );
}
