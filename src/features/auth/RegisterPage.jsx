import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form, FormGroup, TextInput, ActionGroup, Button, Alert, Card, CardBody, PageSection,
} from '@patternfly/react-core';
import { registerSchema } from './registerSchema';
import { registerAdmin } from './api';

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
        <Alert variant="success" title="Admin account created">
          {success.message} You can now sign in as {success.username}.
        </Alert>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Card style={{ maxWidth: 480, margin: '0 auto' }}>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            {serverError && <Alert variant="danger" title={serverError} />}

            <FormGroup label="Username" isRequired fieldId="username">
              <TextInput id="username" {...register('username')} validated={errors.username ? 'error' : 'default'} />
              {errors.username && <div style={{ color: 'var(--pf-v5-global--danger-color--100)' }}>{errors.username.message}</div>}
            </FormGroup>

            <FormGroup label="Email" fieldId="email">
              <TextInput id="email" type="email" {...register('email')} validated={errors.email ? 'error' : 'default'} />
              {errors.email && <div style={{ color: 'var(--pf-v5-global--danger-color--100)' }}>{errors.email.message}</div>}
            </FormGroup>

            <FormGroup label="Phone number" fieldId="phoneNumber">
              <TextInput id="phoneNumber" {...register('phoneNumber')} validated={errors.phoneNumber ? 'error' : 'default'} />
              {errors.phoneNumber && <div style={{ color: 'var(--pf-v5-global--danger-color--100)' }}>{errors.phoneNumber.message}</div>}
            </FormGroup>

            <FormGroup label="Password" isRequired fieldId="password">
              <TextInput id="password" type="password" {...register('password')} validated={errors.password ? 'error' : 'default'} />
              {errors.password && <div style={{ color: 'var(--pf-v5-global--danger-color--100)' }}>{errors.password.message}</div>}
            </FormGroup>

            <FormGroup label="Confirm password" isRequired fieldId="confirmPassword">
              <TextInput id="confirmPassword" type="password" {...register('confirmPassword')} validated={errors.confirmPassword ? 'error' : 'default'} />
              {errors.confirmPassword && <div style={{ color: 'var(--pf-v5-global--danger-color--100)' }}>{errors.confirmPassword.message}</div>}
            </FormGroup>

            <ActionGroup>
              <Button type="submit" isLoading={isSubmitting} variant="primary">Create admin account</Button>
            </ActionGroup>
          </Form>
        </CardBody>
      </Card>
    </PageSection>
  );
}
