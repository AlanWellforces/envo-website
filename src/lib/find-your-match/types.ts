import type { Product } from '@/lib/products'

export type FymAnswers = {
  application: 'channel_letters' | 'light_box' | 'facade' | 'other'
  environment: 'indoor' | 'outdoor'
  colour: 'white_warm' | 'white_neutral' | 'white_cool' | 'rgb'
  size: 'small' | 'medium' | 'large'
  control: 'onoff' | 'dimmable' | 'smart'
  notes?: string
}

export type DriverSpec = { powerW: number; voltageV: number; ip: string; mode: 'cv' | 'cc' }

export type ModulePick = { product: Product; reason: string } | null
export type DriverPick =
  | { kind: 'product'; product: Product; reason: string }
  | { kind: 'spec'; spec: DriverSpec; reason: string }
export type ControlPick =
  | { kind: 'product'; product: Product; reason: string }
  | { kind: 'note'; reason: string }
  | null

export type Recommendation = {
  module: ModulePick
  driver: DriverPick
  control: ControlPick
  estimatedLoadW: number
}

export type FymResult = Recommendation & { explanation: string }
