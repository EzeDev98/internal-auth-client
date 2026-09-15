import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form, FormGroup, TextInput, TextArea, Checkbox, Alert, ClipboardCopy,
  Wizard, WizardStep, WizardFooterWrapper, ActionList, ActionListGroup, ActionListItem,
  useWizardContext, Switch, Tooltip,
} from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { createClient } from './api';
import { createClientSchema } from './createClientSchema';
import styles from './CreateClientPage.module.css';

// Same three grant types the backend actually accepts
// (CreateClientApplicationRequest#grantTypes) - reordered/relabeled to sit
// in Keycloak's own two-column "Authentication flow" layout, not expanded
// with flows this app doesn't support.
const GRANT_TYPE_OPTIONS = [
  { value: 'authorization_code', label: 'Authorization code', help: 'Lets this client obtain tokens via the OAuth 2.0 authorization code flow.' },
  { value: 'refresh_token', label: 'Refresh token', help: 'Lets this client request a refresh token alongside its access token.' },
  { value: 'client_credentials', label: 'Client credentials', help: 'Lets this client authenticate and obtain tokens on its own behalf, without a user.' },
];

// Small "?" trigger for the field-level tooltips below - avoids pulling in
// @patternfly/react-icons for a single glyph.
function HelpTooltip({ content }) {
  return (
    <Tooltip content={content}>
      <span className={styles.helpIcon} tabIndex={0}>?</span>
    </Tooltip>
  );
}

function splitList(value) {
  return (value ?? '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// Custom per-step footer, styled to match PatternFly's own default
// WizardFooter (Next/Create, Back, Cancel), but with a `validate` hook run
// before advancing - the stock footer has no such hook, it just calls
// goToNextStep unconditionally. Passing a component (rather than a plain
// props object) as WizardStep's `footer` makes Wizard treat it as a fully
// custom footer (see @patternfly/react-core's isCustomWizardFooter), which
// is what makes useWizardContext() below available - it's a descendant of
// WizardContextProvider, whereas CreateClientPage itself is an ancestor.
function StepFooter({ nextLabel = 'Next', validate, isLoading }) {
  const { goToNextStep, goToPrevStep, close, activeStep } = useWizardContext();

  const handleNext = async () => {
    const isValid = await validate();
    if (isValid) goToNextStep();
  };

  return (
    <WizardFooterWrapper>
      <ActionList>
        <ActionListGroup>
          <ActionListItem>
            <Button variant="primary" onClick={handleNext} isLoading={isLoading}>
              {nextLabel}
            </Button>
          </ActionListItem>
          <ActionListItem>
            <Button variant="secondary" onClick={() => goToPrevStep()} isDisabled={activeStep?.index === 1}>
              Back
            </Button>
          </ActionListItem>
        </ActionListGroup>
        <ActionListGroup>
          <ActionListItem>
            <Button variant="link" onClick={() => close()}>
              Cancel
            </Button>
          </ActionListItem>
        </ActionListGroup>
      </ActionList>
    </WizardFooterWrapper>
  );
}

// Create client, restyled as a 3-step wizard (General settings / Capability
// config / Login settings) to match Keycloak's own admin console, which
// this reference is - Keycloak's admin console is itself built on
// PatternFly, so this uses PatternFly's own Wizard component rather than
// hand-rolling the stepper look.
//
// Same POST /client-applications call and same post-create secret reveal
// as the modal this replaces - the client secret is still only returned
// once (CreateClientApplicationResponse's own Javadoc), so that reveal
// stays a Modal on top of this page rather than another wizard step.
export default function CreateClientPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [created, setCreated] = useState(null);

  // Purely cosmetic, to match Keycloak's layout - this app always
  // generates a client secret server-side (CreateClientApplicationRequest
  // has no such field), so these two switches don't feed into submission.
  const [clientAuthEnabled, setClientAuthEnabled] = useState(false);
  const [authorizationEnabled, setAuthorizationEnabled] = useState(false);

  const {
    register, handleSubmit, control, trigger, formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createClientSchema),
    defaultValues: { grantTypes: ['authorization_code', 'refresh_token'] },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const result = await createClient({
        clientId: values.clientId,
        name: values.name,
        description: values.description || undefined,
        redirectUris: splitList(values.redirectUris),
        scopes: splitList(values.scopes),
        grantTypes: values.grantTypes,
      });
      setCreated(result);
    } catch (err) {
      setServerError(err.message);
    }
  };

  const goToClients = () => navigate('/clients');

  if (created) {
    return (
      <Modal
        isOpen
        onClose={goToClients}
        title="Client application created"
        footer={<Button variant="primary" onClick={goToClients}>Done</Button>}
      >
        <Alert
          variant="warning"
          isInline
          title="Save this client secret now - it will not be shown again."
          className={styles.secretWarning}
        />
        <p className={styles.secretLabel}>Client secret</p>
        <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
          {created.clientSecret}
        </ClipboardCopy>
      </Modal>
    );
  }

  // Nothing here blocks navigating to a later step first (matching the
  // reference: every step's nav item is a plain clickable link, none
  // disabled), so a skip-ahead visitor can reach "Create" without a valid
  // Client ID/Name. The real gate is still handleSubmit's zodResolver run
  // on submit; this banner just surfaces that failure on the step it's
  // actually visible on, since the General settings fields are unmounted
  // by then.
  const hasEarlierStepErrors = Boolean(errors.clientId || errors.name);

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Clients', to: '/clients' }, { label: 'Create client' }]} />

      <h1 className={styles.title}>Create client</h1>
      <p className={styles.description}>
        Clients are applications and services that can request authentication of a user.
      </p>

      {serverError && <Alert variant="danger" isInline title={serverError} className={styles.serverError} />}

      <Wizard className={styles.wizard} onClose={goToClients} onSave={handleSubmit(onSubmit)}>
        <WizardStep
          name="General settings"
          id="general"
          footer={<StepFooter validate={() => trigger(['clientId', 'name'])} />}
        >
          <Form className={styles.stepBody} isHorizontal>
            <FormGroup label="Client ID" isRequired fieldId="clientId">
              <TextInput id="clientId" {...register('clientId')} validated={errors.clientId ? 'error' : 'default'} />
              {errors.clientId && <div className={styles.fieldError}>{errors.clientId.message}</div>}
            </FormGroup>

            <FormGroup label="Name" isRequired fieldId="name">
              <TextInput id="name" {...register('name')} validated={errors.name ? 'error' : 'default'} />
              {errors.name && <div className={styles.fieldError}>{errors.name.message}</div>}
            </FormGroup>

            <FormGroup label="Description" fieldId="description">
              <TextArea id="description" {...register('description')} />
            </FormGroup>
          </Form>
        </WizardStep>

        <WizardStep
          name="Capability config"
          id="capability"
          footer={<StepFooter validate={() => trigger('grantTypes')} />}
        >
          <Form className={styles.stepBody} isHorizontal>
            <FormGroup
              label="Client authentication"
              fieldId="clientAuthentication"
              labelHelp={<HelpTooltip content="Always on for this app - every client gets a server-generated secret." />}
            >
              <Switch
                id="clientAuthentication"
                label="On"
                labelOff="Off"
                isChecked={clientAuthEnabled}
                onChange={(_event, checked) => setClientAuthEnabled(checked)}
              />
            </FormGroup>

            <FormGroup
              label="Authorization"
              fieldId="authorization"
              labelHelp={<HelpTooltip content="Fine-grained authorization services are not available for this client type yet." />}
            >
              <Switch
                id="authorization"
                label="On"
                labelOff="Off"
                isChecked={authorizationEnabled}
                onChange={(_event, checked) => setAuthorizationEnabled(checked)}
              />
            </FormGroup>

            <FormGroup label="Authentication flow" fieldId="grantTypes">
              <Controller
                name="grantTypes"
                control={control}
                render={({ field }) => (
                  <div className={styles.grantTypeGrid}>
                    {GRANT_TYPE_OPTIONS.map((option) => (
                      <div key={option.value} className={styles.grantTypeItem}>
                        <Checkbox
                          id={`grantType-${option.value}`}
                          label={option.label}
                          isChecked={field.value.includes(option.value)}
                          onChange={(_event, checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, option.value]
                                : field.value.filter((v) => v !== option.value)
                            );
                          }}
                        />
                        <HelpTooltip content={option.help} />
                      </div>
                    ))}
                  </div>
                )}
              />
            </FormGroup>
          </Form>
        </WizardStep>

        <WizardStep
          name="Login settings"
          id="login"
          footer={(
            <StepFooter
              nextLabel="Create"
              isLoading={isSubmitting}
              validate={() => trigger(['redirectUris', 'scopes'])}
            />
          )}
        >
          {hasEarlierStepErrors && (
            <Alert
              variant="danger"
              isInline
              title="Client ID and Name are required. Go back to General settings to fix this."
              className={styles.stepAlert}
            />
          )}
          <Form className={styles.stepBody} isHorizontal>
            <FormGroup label="Redirect URIs" fieldId="redirectUris">
              <TextArea id="redirectUris" {...register('redirectUris')} placeholder="One per line" />
            </FormGroup>

            <FormGroup label="Scopes" fieldId="scopes">
              <TextArea id="scopes" {...register('scopes')} placeholder="One per line, or comma-separated" />
            </FormGroup>
          </Form>
        </WizardStep>
      </Wizard>
    </div>
  );
}
