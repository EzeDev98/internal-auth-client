import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { Form, FormGroup, TextInput, ActionGroup, Alert, Card, CardBody, PageSection } from '@patternfly/react-core';
import Button from '../../shared/components/Button';
import { useAuth } from '../../shared/lib/authContext';
import { credentialsSchema, otpSchema } from './loginSchema';
import styles from './LoginPage.module.css';

// Step 5A - fronted by the BFF (Step 1A/2H), via useAuth() from Step 4F.
// On mfaRequired, drops into a second step for the OTP - the BFF's login
// response never includes the phone number verify-otp needs, so it's
// collected here from the user rather than invented client-side.
export default function LoginPage() {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [mfaRequired, setMfaRequired] = useState(false);

  const credentialsForm = useForm({ resolver: zodResolver(credentialsSchema) });
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });

  const onSubmitCredentials = async (values) => {
    setServerError(null);
    try {
      const result = await login(values);
      if (result.mfaRequired) {
        setMfaRequired(true);
      } else {
        navigate('/clients', { replace: true });
      }
    } catch (err) {
      setServerError(err.message);
    }
  };

  const onSubmitOtp = async (values) => {
    setServerError(null);
    try {
      await verifyOtp(values);
      navigate('/clients', { replace: true });
    } catch (err) {
      setServerError(err.message);
    }
  };

  if (mfaRequired) {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = otpForm;

    return (
      <PageSection>
        <Card className={styles.card}>
          <CardBody>
            <Form onSubmit={handleSubmit(onSubmitOtp)}>
              {serverError && <Alert variant="danger" title={serverError} />}

              <FormGroup label="Phone number" isRequired fieldId="phoneNumber">
                <TextInput
                  id="phoneNumber"
                  {...register('phoneNumber')}
                  validated={errors.phoneNumber ? 'error' : 'default'}
                />
                {errors.phoneNumber && <div className={styles.fieldError}>{errors.phoneNumber.message}</div>}
              </FormGroup>

              <FormGroup label="Verification code" isRequired fieldId="otp">
                <TextInput id="otp" {...register('otp')} validated={errors.otp ? 'error' : 'default'} />
                {errors.otp && <div className={styles.fieldError}>{errors.otp.message}</div>}
              </FormGroup>

              <ActionGroup>
                <Button type="submit" isLoading={isSubmitting} variant="primary">
                  Verify
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
  } = credentialsForm;

  return (
    <PageSection>
      <Card className={styles.card}>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmitCredentials)}>
            {serverError && <Alert variant="danger" title={serverError} />}

            <FormGroup label="Username" isRequired fieldId="username">
              <TextInput id="username" {...register('username')} validated={errors.username ? 'error' : 'default'} />
              {errors.username && <div className={styles.fieldError}>{errors.username.message}</div>}
            </FormGroup>

            <FormGroup label="Password" isRequired fieldId="password">
              <TextInput
                id="password"
                type="password"
                {...register('password')}
                validated={errors.password ? 'error' : 'default'}
              />
              {errors.password && <div className={styles.fieldError}>{errors.password.message}</div>}
            </FormGroup>

            <ActionGroup>
              <Button type="submit" isLoading={isSubmitting} variant="primary">
                Log in
              </Button>
            </ActionGroup>
          </Form>

          <p className={styles.registerLink}>
            No admin account yet? <Link to="/register">Register</Link>
          </p>
          <p className={styles.registerLink}>
            <Link to="/forgot-password">Forgot password?</Link>
          </p>
        </CardBody>
      </Card>
    </PageSection>
  );
}
