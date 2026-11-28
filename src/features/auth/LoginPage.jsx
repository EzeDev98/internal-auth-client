// Admin login screen.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { Form, FormGroup, TextInput, ActionGroup, Alert, Card, CardBody, PageSection } from '@patternfly/react-core';
import Button from '../../shared/components/Button';
import PasswordInput from '../../shared/components/PasswordInput';
import AuthHeading from '../../shared/components/AuthHeading';
import { useAuth } from '../../shared/lib/useAuth';
import { useToast } from '../../shared/lib/useToast';
import { credentialsSchema } from './loginSchema';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const credentialsForm = useForm({ resolver: zodResolver(credentialsSchema) });

  const onSubmitCredentials = async (values) => {
    setServerError(null);
    try {
      await login(values);
      toast.success('Logged in');
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = credentialsForm;

  return (
    <PageSection>
      <Card className={styles.card}>
        <CardBody>
          <AuthHeading title="Welcome back" subtitle="Sign in to the admin console" />

          <Form onSubmit={handleSubmit(onSubmitCredentials)}>
            {serverError && <Alert variant="danger" title={serverError} />}

            <FormGroup label="Username" isRequired fieldId="username">
              <TextInput id="username" {...register('username')} validated={errors.username ? 'error' : 'default'} />
              {errors.username && <div className={styles.fieldError}>{errors.username.message}</div>}
            </FormGroup>

            <FormGroup label="Password" isRequired fieldId="password">
              <PasswordInput
                id="password"
                {...register('password')}
                validated={errors.password ? 'error' : 'default'}
              />
              {errors.password && <div className={styles.fieldError}>{errors.password.message}</div>}
            </FormGroup>

            <div className={styles.loginActions}>
              <div className={styles.forgotPasswordRow}>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <ActionGroup>
                <Button type="submit" isLoading={isSubmitting} variant="primary">
                  Log in
                </Button>
              </ActionGroup>
            </div>
          </Form>

          <p className={styles.registerLink}>
            No admin account yet? <Link to="/register">Register</Link>
          </p>
        </CardBody>
      </Card>
    </PageSection>
  );
}
