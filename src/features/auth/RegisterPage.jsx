import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { Form, FormGroup, TextInput, ActionGroup, Alert, Card, CardBody, PageSection } from '@patternfly/react-core';
import Button from '../../shared/components/Button';
import PasswordInput from '../../shared/components/PasswordInput';
import AuthHeading from '../../shared/components/AuthHeading';
import { registerSchema } from './registerSchema';
import { registerAdmin } from './api';
import styles from './RegisterPage.module.css';

// Step 5B - bootstraps operator/admin accounts for this tool (Step 1's
// AdminController#register), not platform end-users. A freshly registered
// admin has no roles yet - access gets granted afterward via the Roles
// screen (Step 8) - so this only confirms the account exists and points at
// Login.
export default function RegisterPage() {
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(null);

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const data = await registerAdmin(values);
      setSuccess(data);
    } catch (err) {
      setServerError(err.message);
    }
  };

  if (success) {
    return (
      <PageSection>
        <Card className={styles.card}>
          <CardBody>
            <Alert variant="success" title="Admin account created">
              {success.message} You can now sign in as {success.username}.
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
          <AuthHeading title="Create admin account" subtitle="Set up a new operator account for the auth console" />

          <Form onSubmit={handleSubmit(onSubmit)}>
            {serverError && <Alert variant="danger" title={serverError} />}

            <FormGroup label="Username" isRequired fieldId="username">
              <TextInput id="username" {...register('username')} validated={errors.username ? 'error' : 'default'} />
              {errors.username && <div className={styles.fieldError}>{errors.username.message}</div>}
            </FormGroup>

            <FormGroup label="Email" fieldId="email">
              <TextInput id="email" type="email" {...register('email')} validated={errors.email ? 'error' : 'default'} />
              {errors.email && <div className={styles.fieldError}>{errors.email.message}</div>}
            </FormGroup>

            <FormGroup label="Phone number" fieldId="phoneNumber">
              <TextInput id="phoneNumber" {...register('phoneNumber')} validated={errors.phoneNumber ? 'error' : 'default'} />
              {errors.phoneNumber && <div className={styles.fieldError}>{errors.phoneNumber.message}</div>}
            </FormGroup>

            <FormGroup label="Password" isRequired fieldId="password">
              <PasswordInput id="password" {...register('password')} validated={errors.password ? 'error' : 'default'} />
              {errors.password && <div className={styles.fieldError}>{errors.password.message}</div>}
            </FormGroup>

            <FormGroup label="Confirm password" isRequired fieldId="confirmPassword">
              <PasswordInput id="confirmPassword" {...register('confirmPassword')} validated={errors.confirmPassword ? 'error' : 'default'} />
              {errors.confirmPassword && <div className={styles.fieldError}>{errors.confirmPassword.message}</div>}
            </FormGroup>

            <ActionGroup>
              <Button type="submit" isLoading={isSubmitting} variant="primary">Create admin account</Button>
            </ActionGroup>
          </Form>

          <p className={styles.loginLink}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </CardBody>
      </Card>
    </PageSection>
  );
}
