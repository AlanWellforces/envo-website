import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/projects'
import { INDUSTRY_LABELS } from '@/lib/projects'

type Props = { project: Project }

export function ProjectCard({ project }: Props) {
  const cover = typeof project.cover === 'string' ? project.cover : project.cover?.url
  const coverAlt =
    typeof project.cover === 'object' && project.cover?.alt ? project.cover.alt : project.title

  const metaParts: string[] = []
  if (project.location) metaParts.push(project.location)
  if (project.completedYear) metaParts.push(String(project.completedYear))

  return (
    <Link href={`/projects/${project.slug}`} className="project-card">
      <div className="project-card-cover">
        {cover && (
          <Image
            src={cover}
            alt={coverAlt}
            width={640}
            height={400}
            sizes="(min-width: 1100px) 33vw, (min-width: 641px) 50vw, 100vw"
          />
        )}
      </div>
      <div className="project-card-body">
        <div className="project-card-chips">
          {project.industry.map((i) => (
            <span key={i} className="project-card-chip">{INDUSTRY_LABELS[i]}</span>
          ))}
        </div>
        <h3 className="project-card-title">{project.title}</h3>
        <p className="project-card-excerpt">{project.excerpt}</p>
        {metaParts.length > 0 && (
          <div className="project-card-meta">{metaParts.join(' · ')}</div>
        )}
      </div>
    </Link>
  )
}
