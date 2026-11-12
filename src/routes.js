export const navigation = [
  ['/', 'Home'],
  ['/destinations', 'Destinations'],
  ['/experiences', 'Experiences'],
  ['/shuttles', 'Shuttles'],
  ['/about', 'About'],
]

export const pageEntries = [...navigation.slice(1), ['/plan', 'Plan your trip']]

export function cleanPath(pathname) {
  return pathname.replace(/\/+$/, '') || '/'
}
