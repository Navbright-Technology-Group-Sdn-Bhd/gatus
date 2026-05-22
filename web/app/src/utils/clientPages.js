export const clientPages = [
  {
    slug: 'ggrmotor',
    title: 'GGR Motor',
    domain: 'ggrmotor.com',
    monitorNames: [
      'ggrmotor website',
      'ggrmotor SSL certificate',
      'ggrmotor domain expiry',
      'ggrmotor DNS',
    ],
  },
  {
    slug: 'navbright',
    title: 'Navbright',
    domain: 'navbright.com',
    monitorNames: [
      'navbright website',
      'navbright SSL certificate',
      'navbright domain expiry',
      'navbright DNS',
    ],
  },
  {
    slug: 'brillionex',
    title: 'Brillionex',
    domain: 'brillionex.com',
    monitorNames: [
      'brillionex website',
      'brillionex SSL certificate',
      'brillionex domain expiry',
      'brillionex DNS',
    ],
  },
  {
    slug: 'easehubs',
    title: 'EaseHubs',
    domain: 'easehubs.com',
    monitorNames: [
      'easehubs website',
      'easehubs SSL certificate',
      'easehubs domain expiry',
      'easehubs DNS',
    ],
  },
  {
    slug: 'erp-thecopierguy-my',
    title: 'The Copier Guy ERP',
    domain: 'erp.thecopierguy.my',
    monitorNames: [
      'erp.thecopierguy.my website',
      'erp.thecopierguy.my SSL certificate',
      'thecopierguy.my domain expiry',
      'erp.thecopierguy.my DNS',
    ],
  },
  {
    slug: 'rg50-ga611bol-org',
    title: 'RG50',
    domain: 'rg50.ga611bol.org',
    monitorNames: [
      'rg50.ga611bol.org website',
      'rg50.ga611bol.org SSL certificate',
      'ga611bol.org domain expiry',
      'rg50.ga611bol.org DNS',
    ],
  },
  {
    slug: 'ga611-navbright-com',
    title: 'GA611',
    domain: 'ga611.navbright.com',
    monitorNames: [
      'ga611.navbright.com website',
      'ga611.navbright.com SSL certificate',
      'navbright domain expiry',
      'ga611.navbright.com DNS',
    ],
  },
  {
    slug: 'massivecap',
    title: 'MassiveCap',
    domain: 'massivecap.my',
    monitorNames: [
      'massivecap.my website',
      'massivecap.my SSL certificate',
      'massivecap.my domain expiry',
      'massivecap.my DNS',
    ],
  },
  {
    slug: 'premiumscreen',
    title: 'Premium Screen',
    domain: 'premiumscreen.my',
    monitorNames: [
      'premiumscreen.my website',
      'premiumscreen.my SSL certificate',
      'premiumscreen.my domain expiry',
      'premiumscreen.my DNS',
    ],
  },
  {
    slug: 'roheemedic',
    title: 'Rohee Medic',
    domain: 'roheemedic.com',
    monitorNames: [
      'roheemedic.com website',
      'roheemedic.com SSL certificate',
      'roheemedic.com domain expiry',
      'roheemedic.com DNS',
    ],
  },
]

export const normalizeMonitorName = (name) => {
  return (name || '').trim().toLowerCase()
}

export const normalizeClientSlug = (value) => {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const getClientPageBySlug = (slug) => {
  const normalizedSlug = normalizeClientSlug(slug)
  return clientPages.find((client) => {
    return client.slug === normalizedSlug || normalizeClientSlug(client.domain) === normalizedSlug
  })
}

export const isEndpointForClient = (endpoint, client) => {
  if (!endpoint || !client) {
    return false
  }
  const monitorNames = client.monitorNames.map(normalizeMonitorName)
  return monitorNames.includes(normalizeMonitorName(endpoint.name))
}

export const getLatestResult = (endpoint) => {
  if (!endpoint || !endpoint.results || endpoint.results.length === 0) {
    return null
  }
  return endpoint.results[endpoint.results.length - 1]
}
