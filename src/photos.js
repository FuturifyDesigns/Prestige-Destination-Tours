import { media } from './data'
import variants from './photo-variants.json'

export function imageSource(name) {
  const candidates = variants[name]
  return {
    src: media(name),
    srcSet: candidates?.length > 1 ? candidates.map(([width, file]) => media(file) + ' ' + width + 'w').join(', ') : undefined,
  }
}
