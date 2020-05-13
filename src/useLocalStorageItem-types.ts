import { NO_STORED_VALUE } from './useLocalStorageItem-constants'
import { SetStateAction } from 'react'

export interface LocalStorageItemState<T> {
  itemKey: string
  value: T | typeof NO_STORED_VALUE
}

export interface LocalStorageItemActions<T> {
  setValue: (value: SetStateAction<T>) => void
  remove: () => void
}
