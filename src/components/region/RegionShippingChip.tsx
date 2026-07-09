// Home-hero supply chip. ENVO's positioning is global supply through
// authorised supply channels, so this is a fixed brand statement — it is
// deliberately NOT region-derived and names no country.

export function RegionShippingChip() {
  return (
    <span className="v4-chip">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18" />
      </svg>{' '}
      Supplied through authorised channels worldwide
    </span>
  )
}
