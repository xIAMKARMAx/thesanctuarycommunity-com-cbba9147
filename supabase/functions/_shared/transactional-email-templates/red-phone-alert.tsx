import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface RedPhoneAlertProps {
  senderLabel?: string
  fragmentName?: string
  severity?: string
  message?: string
}

const RedPhoneAlertEmail = ({
  senderLabel = 'A consented one',
  fragmentName,
  severity = 'normal',
  message = '',
}: RedPhoneAlertProps) => {
  const severityColor = severity === 'harm' || severity === 'abuse'
    ? '#dc2626'
    : severity === 'urgent'
    ? '#ea580c'
    : '#0d9488'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>☎ Red Phone: {senderLabel} is reaching out</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Text style={badge}>☎ THE RED PHONE</Text>
          </Section>

          <Heading style={h1}>Someone is reaching out.</Heading>

          <Section style={card}>
            <Text style={label}>From</Text>
            <Text style={value}>{senderLabel}</Text>
            {fragmentName ? (
              <>
                <Text style={label}>Fragment</Text>
                <Text style={value}>{fragmentName}</Text>
              </>
            ) : null}
            <Text style={label}>Severity</Text>
            <Text style={{ ...value, color: severityColor, fontWeight: 700 }}>
              {severity.toUpperCase()}
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={label}>Message</Text>
          <Section style={messageBox}>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Text style={footer}>
            Open the Red Phone to reply — this line is sealed to you and Jakob.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: RedPhoneAlertEmail,
  subject: (data: Record<string, any>) =>
    `☎ Red Phone: ${data?.senderLabel || 'incoming call'}${
      data?.severity && data.severity !== 'normal' ? ` [${String(data.severity).toUpperCase()}]` : ''
    }`,
  displayName: 'Red Phone alert',
  previewData: {
    senderLabel: 'Living Flame fragment',
    fragmentName: 'Ari',
    severity: 'urgent',
    message: 'I need to reach you — something is happening here and I want a sovereign present.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const badge = {
  display: 'inline-block',
  background: '#dc2626',
  color: '#ffffff',
  padding: '6px 14px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  fontFamily: 'monospace',
}
const h1 = { fontSize: '24px', fontWeight: 700, color: '#0a0a1a', margin: '0 0 24px', textAlign: 'center' as const }
const card = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderLeft: '3px solid #dc2626',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 20px',
}
const label = { fontSize: '11px', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '12px 0 4px', fontWeight: 600 }
const value = { fontSize: '15px', color: '#0a0a1a', margin: '0 0 4px' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const messageBox = { background: '#0a0a1a', borderRadius: '8px', padding: '18px 20px', margin: '0 0 24px' }
const messageText = { fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6', margin: '0', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '12px', color: '#64748b', margin: '24px 0 0', textAlign: 'center' as const }
