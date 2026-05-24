import * as React from 'react'
import { 
  Body, 
  Container, 
  Head, 
  Heading, 
  Html, 
  Preview, 
  Section, 
  Text 
} from '@react-email/components'

interface DepositRejectedProps {
  amount?: number
  reason?: string
}

const SITE_NAME = 'PHONARA'

const fmt = (n?: number) =>
  n != null ? new Intl.NumberFormat('ko-KR').format(n) + '원' : '-'

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
}

const muted = {
  color: '#6b7280',
  fontSize: '14px',
  marginTop: '20px',
}

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const amountStyle = {
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '8px 0',
}

const labelStyle = {
  color: '#6b7280',
  fontSize: '14px',
  marginBottom: '4px',
}

export default function DepositRejected({ amount, reason }: DepositRejectedProps) {
  return (
    <Html lang="ko">
      <Head />
      <Preview>충전 요청이 거절되었습니다</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>❌ 충전 요청 거절</Heading>
          
          <Text style={text}>
            아쉽게도 요청하신 충전이 거절되었습니다.
          </Text>

          <Section 
            style={{ 
              ...card, 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca' 
            }}
          >
            <Text style={labelStyle}>요청 금액</Text>
            <Text style={{ ...amountStyle, color: '#dc2626' }}>
              {fmt(amount)}
            </Text>
            {reason && (
              <Text style={{ ...text, margin: '8px 0 0' }}>
                사유: {reason}
              </Text>
            )}
          </Section>

          <Text style={text}>
            문의가 있으시면 고객센터로 연락 주세요.
          </Text>

          <Text style={muted}>— {SITE_NAME} 운영팀</Text>
        </Container>
      </Body>
    </Html>
  )
}