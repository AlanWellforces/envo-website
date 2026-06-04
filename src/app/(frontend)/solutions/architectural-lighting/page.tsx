import type { Metadata } from 'next'
import { SolutionDetail } from '@/components/solutions/SolutionDetail'

export const metadata: Metadata = {
  title: 'Architectural Lighting — ENVO',
  description:
    'Architectural lighting for LED systems — accent, linear, facade, step and landscape, tuned for colour rendering, beam control and integration.',
}

export default function ArchitecturalLightingPage() {
  return <SolutionDetail slug="architectural-lighting" headline="Accent, linear, facade, step, landscape." />
}
