import { Fragment } from 'react'

/** Render CMS multi-line text: each newline becomes a <br/>. */
export function Lines({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  )
}
