// Offscreen "website" field no human ever sees or fills — bots auto-complete
// it and /api/submissions quietly drops those posts (abuse-guard, 2026-07-13).
// Offscreen (not display:none) so naive bots still consider it fillable;
// tabIndex/aria keep it out of keyboard and screen-reader flows.
export function HoneypotField() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
      <label htmlFor="hp-website">Website</label>
      <input id="hp-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
    </div>
  )
}
