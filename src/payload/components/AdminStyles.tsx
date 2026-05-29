// Injects small global admin-panel style overrides. Wired as an
// admin.components.providers entry in payload.config.ts so it wraps every
// admin page (this version of Payload has no admin.css config option).

import React from 'react'

// The Content (rich text) editor is the only richText field in the project.
// Give its editable area a tall default so it reads as a real text box rather
// than a one-line input that grows as you type.
const CSS = `
.ContentEditable__root { min-height: 360px; padding-bottom: 1rem; }
`

export const AdminStyles: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: CSS }} />
    {children}
  </>
)

export default AdminStyles
