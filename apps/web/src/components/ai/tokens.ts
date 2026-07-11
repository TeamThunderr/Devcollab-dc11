/**
 * AI page design tokens — light & dark variants.
 * Import `aiTokens(dark)` and spread into inline styles.
 */
export function aiTokens(dark: boolean) {
  return {
    // ── Layout ────────────────────────────────────────────────────────────────
    pageBg:              dark ? '#09090b'                    : '#ffffff',
    panelBg:             dark ? '#0a0a0f'                    : '#f9f9fb',

    // ── Surfaces & borders ────────────────────────────────────────────────────
    surface1:            dark ? 'rgba(255,255,255,0.04)'     : 'rgba(0,0,0,0.03)',
    surface2:            dark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.05)',
    borderWeak:          dark ? 'rgba(255,255,255,0.07)'     : 'rgba(0,0,0,0.08)',
    borderMid:           dark ? 'rgba(255,255,255,0.09)'     : 'rgba(0,0,0,0.10)',
    borderFocused:       dark ? 'rgba(255,255,255,0.16)'     : 'rgba(0,0,0,0.22)',
    borderStrong:        dark ? 'rgba(255,255,255,0.12)'     : 'rgba(0,0,0,0.13)',
    topBarBorder:        dark ? 'rgba(255,255,255,0.07)'     : 'rgba(0,0,0,0.08)',

    // ── Text ──────────────────────────────────────────────────────────────────
    textPrimary:         dark ? '#f4f4f5'   : '#09090b',
    textSecondary:       dark ? '#a1a1aa'   : '#3f3f46',
    textMuted:           dark ? '#71717a'   : '#71717a',
    textDim:             dark ? '#52525b'   : '#a1a1aa',
    textFaint:           dark ? '#3f3f46'   : '#d4d4d8',

    // ── Accent (AI monochrome) ────────────────────────────────────────────────
    accent:              dark ? '#ffffff'   : '#09090b',
    accentGrad:          dark
      ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)'
      : 'linear-gradient(135deg, rgba(0,0,0,0.09) 0%, rgba(0,0,0,0.05) 100%)',
    accentBorder:        dark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.22)',

    // ── Semantic ──────────────────────────────────────────────────────────────
    onlineColor:         dark ? '#22c55e' : '#16a34a',

    // ── Glow / spotlight ─────────────────────────────────────────────────────
    spotlight:           dark
      ? 'radial-gradient(ellipse 640px 200px at 50% -10px, rgba(255,255,255,0.07) 0%, transparent 70%)'
      : 'radial-gradient(ellipse 640px 200px at 50% -10px, rgba(0,0,0,0.04) 0%, transparent 70%)',

    // ── Icon box ──────────────────────────────────────────────────────────────
    iconBoxBg:           dark ? 'rgba(255,255,255,0.05)'     : 'rgba(0,0,0,0.05)',
    iconBoxBorder:       dark ? 'rgba(255,255,255,0.12)'     : 'rgba(0,0,0,0.12)',
    iconBoxGlow:         dark ? '0 0 40px rgba(255,255,255,0.05)' : '0 0 24px rgba(0,0,0,0.08)',

    // ── Input ─────────────────────────────────────────────────────────────────
    inputBg:             dark ? 'rgba(255,255,255,0.04)'     : 'rgba(0,0,0,0.03)',
    inputGlow:           dark ? '0 0 0 3px rgba(255,255,255,0.04)' : '0 0 0 3px rgba(0,0,0,0.04)',
    inputIconColor:      dark ? '#52525b' : '#a1a1aa',
    inputIconHover:      dark ? '#a1a1aa' : '#3f3f46',
    inputPlaceholder:    dark ? '#52525b' : '#a1a1aa',
    footerColor:         dark ? '#3f3f46' : '#c4c4c4',

    // ── Send button ───────────────────────────────────────────────────────────
    sendBg:              dark ? '#f4f4f5' : '#09090b',
    sendColor:           dark ? '#09090b' : '#f4f4f5',
    sendDisabledBg:      dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    sendDisabledColor:   dark ? '#3f3f46' : '#c4c4c4',

    // ── Chips ─────────────────────────────────────────────────────────────────
    chipBg:              dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    chipBorder:          dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
    chipColor:           dark ? '#a1a1aa' : '#52525b',
    chipHoverBg:         dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    chipHoverBorder:     dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)',
    chipHoverColor:      dark ? '#e8eaed' : '#09090b',

    // ── Right panel ───────────────────────────────────────────────────────────
    badgeBg:             dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    badgeBorder:         dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
    badgeColor:          dark ? '#a1a1aa' : '#52525b',
    histGroupColor:      dark ? '#3f3f46' : '#d4d4d8',
    convoHoverBg:        dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    upgradeBtnBg:        dark ? '#f4f4f5' : '#09090b',
    upgradeBtnColor:     dark ? '#09090b' : '#f4f4f5',
    upgradeBtnHoverBg:   dark ? '#e4e4e7' : '#1a1a1a',

    // ── ThinkingSkeleton ──────────────────────────────────────────────────────
    skeletonAvatarBg:    dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    shimmerGrad:         dark
      ? 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 100%)'
      : 'linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%)',
    thinkBubbleBg:       dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    thinkBubbleBorder:   dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    stepActiveColor:     dark ? '#e8eaed' : '#09090b',
    stepDoneColor:       dark ? '#52525b' : '#a1a1aa',
    stepPendingColor:    dark ? '#3f3f46' : '#d4d4d8',
    stepDotPendingBorder: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
    stepDotDoneBg:       dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.22)',

    // ── Feature card accent sub2 colors ───────────────────────────────────────
    featureAccents: dark
      ? ['#ffffff', '#e4e4e7', '#d4d4d8', '#a1a1aa']
      : ['#09090b', '#27272a', '#3f3f46', '#52525b'],
  } as const
}

export type AITokens = ReturnType<typeof aiTokens>
