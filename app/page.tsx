import SophisticatedFlowPage from '@/app/redesign/sophisticated-flow/page'

export default function Home() {
  // Hardcoded to always show sophisticated flow
  // Feature flags were not working reliably in production
  return <SophisticatedFlowPage />
}
