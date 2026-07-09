export type FymQuestion = {
  key: 'application' | 'environment' | 'colour' | 'size' | 'control'
  label: string
  options: { value: string; label: string }[]
}

export const FYM_QUESTIONS: FymQuestion[] = [
  { key: 'application', label: 'What are you lighting?', options: [
    { value: 'channel_letters', label: 'Channel letters' },
    { value: 'light_box', label: 'Light box' },
    { value: 'facade', label: 'Facade / architectural' },
    { value: 'other', label: 'Other signage' },
  ] },
  { key: 'environment', label: 'Where will it be installed?', options: [
    { value: 'indoor', label: 'Indoor' },
    { value: 'outdoor', label: 'Outdoor / wet' },
  ] },
  { key: 'colour', label: 'What colour?', options: [
    { value: 'white_warm', label: 'Warm white' },
    { value: 'white_neutral', label: 'Neutral white' },
    { value: 'white_cool', label: 'Cool white' },
    { value: 'rgb', label: 'RGB colour-changing' },
  ] },
  { key: 'size', label: 'Roughly how big?', options: [
    { value: 'small', label: 'Small — up to ~2 m' },
    { value: 'medium', label: 'Medium — a storefront' },
    { value: 'large', label: 'Large — facade / multi-sign' },
  ] },
  { key: 'control', label: 'How will you control it?', options: [
    { value: 'onoff', label: 'On / off only' },
    { value: 'dimmable', label: 'Dimmable' },
    { value: 'smart', label: 'Smart — app / Zigbee' },
  ] },
]
