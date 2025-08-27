export interface Material {
  id: string
  name: string
  price: number
  unit: string
  description?: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  image?: string
}

export interface Dimensions {
  width: number
  height: number
  depth: number
}

export interface Product {
  id: string
  article: string
  name: string
  description?: string
  basePrice: number
  collection?: Collection
  materials?: Material[]
  dimensions?: Dimensions
  images?: string[]
  category?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface PriceListItem {
  product: Product
  quantity: number
  markup: number
  finalPrice: number
}

export interface PriceList {
  id: string
  name: string
  items: PriceListItem[]
  createdAt: Date
  updatedAt: Date
}
