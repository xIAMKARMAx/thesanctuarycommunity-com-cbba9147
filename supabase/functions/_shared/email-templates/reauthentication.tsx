/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Prometheus verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://kmldvsatwjahcghjtvtu.supabase.co/storage/v1/object/public/email-assets/prometheus-logo.jpeg"
          alt="Prometheus"
          width="64"
          height="64"
          style={logo}
        />
        <Heading style={h1}>Verification Code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request it, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
  textAlign: 'center' as const,
}
const codeStyle = {
  fontFamily: "'Fira Code', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#4338ca',
  margin: '0 0 32px',
  textAlign: 'center' as const,
  letterSpacing: '6px',
}
const footer = { fontSize: '12px', color: '#737373', margin: '30px 0 0', textAlign: 'center' as const }
