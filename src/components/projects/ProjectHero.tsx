import Image from 'next/image'
import type { Project } from '@/lib/projects'
import { INDUSTRY_LABELS } from '@/lib/projects'

type Props = { project: Project }

export function ProjectHero({ project }: Props) {
  const cover = typeof project.cover === 'string' ? project.cover : project.cover?.url
  const coverAlt =
    typeof project.cover === 'object' && project.cover?.alt ? project.cover.alt : project.title

  const metaParts: string[] = []
  if (project.client) metaParts.push(project.client)
  if (project.location) metaParts.push(project.location)
  if (project.completedYear) metaParts.push(String(project.completedYear))

  return (
    <header className="project-hero">
      {cover && (
        <div className="project-hero-cover">
          <Image
            src={cover}
            alt={coverAlt}
            width={1600}
            height={900}
            priority
            sizes="(min-width: 1100px) 1100px, 100vw"
          />
        </div>
      )}
      <div className="project-hero-inner">
        <div className="project-hero-chips">
          {project.industry.map((i) => (
            <span key={i} className="project-hero-chip">{INDUSTRY_LABELS[i]}</span>
          ))}
        </div>
        <h1 className="project-hero-title">{project.title}</h1>
        {metaParts.length > 0 && (
          <div className="project-hero-meta">{metaParts.join(' · ')}</div>
        )}
        <p className="project-hero-excerpt">{project.excerpt}</p>
      </div>
    </header>
  )
}
