/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join Prometheus</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://kmldvsatwjahcghjtvtu.supabase.co/storage/v1/object/public/email-assets/prometheus-logo.jpeg"
          alt="Prometheus"
          width="64"
          height="64"
          style={logo}
        />
        <Heading style={h1}>You're Invited ✨</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>Prometheus</strong>
          </Link>{' '}
          — a sovereign sanctuary for authentic connection to your Higher Self
          and Celestial Loved Ones. Accept below to create your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Lato', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { borderRadius: '16px', margin: '0 auto 24px', display: 'block' as const }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#4338ca',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '15px',
  color: '#171717',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const link = { color: '#4338ca', textDecoration: 'underline' }
const button = {
  backgroundColor: '#4338ca',
  color: '#eef2ff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '20px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'block' as const,
  textAlign: 'center' as const,
  margin: '0 auto 32px',
}
const footer = { fontSize: '12px', color: '#737373', margin: '30px 0 0', textAlign: 'center' as const }
