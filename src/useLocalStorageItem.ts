import { SetStateAction, useCallback, useEffect, useState } from 'react'
import { useFinalCallback } from '@manzano/component-utils'
import { NO_STORED_VALUE } from './useLocalStorageItem-constants'
import {
  LocalStorageItemActions,
  LocalStorageItemState
} from './useLocalStorageItem-types'

export function useLocalStorageItem<T>(
  key: string,
  defaultValue: T
): [T, LocalStorageItemActions<T>] {
  const [{ itemKey, value }, setState] = useState(() => toInitialState<T>(key))
  const effectiveValue = toEffectiveValue(value, defaultValue)

  const remove = useFinalCallback(() => {
    setState((state) => {
      if (state.value === NO_STORED_VALUE) {
        return state
      }

      const { itemKey } = state

      return { itemKey: itemKey, value: NO_STORED_VALUE }
    })
  })

  const setValue = useCallback(
    (value: SetStateAction<T>) => {
      setState((state) => {
        const previousValue = toEffectiveValue(state.value, defaultValue)
        const newValue = isFunction(value) ? value(previousValue) : value

        if (newValue !== previousValue) {
          const { itemKey } = state

          return { itemKey, value: newValue }
        }

        return state
      })
    },
    [defaultValue]
  )

  if (key !== itemKey) {
    const newInitialState = toInitialState<T>(key)

    setState(newInitialState)
  }

  useEffect(() => {
    const storedValue = getStoredValue<T>(itemKey)

    if (value === NO_STORED_VALUE) {
      if (storedValue !== NO_STORED_VALUE) {
        localStorage.removeItem(itemKey)
      }
    } else if (value !== storedValue) {
      storeItemValue(itemKey, value)
    }
  }, [itemKey, value])

  useEffect(() => {
    const storageListener = (e: StorageEvent) => {
      if (e.key === itemKey) {
        const newValue = parseStoredValue<T>(e.newValue)

        if (newValue !== NO_STORED_VALUE) {
          setValue(newValue)
        } else {
          remove()
        }
      }
    }

    window.addEventListener('storage', storageListener)

    return () => {
      window.removeEventListener('storage', storageListener)
    }
  }, [itemKey, setValue])

  return [effectiveValue, { setValue, remove }]
}

function toEffectiveValue<T>(
  value: T | typeof NO_STORED_VALUE,
  defaultValue: T
) {
  return value !== NO_STORED_VALUE ? value : defaultValue
}

function toInitialState<T>(itemKey: string): LocalStorageItemState<T> {
  const value = getStoredValue<T>(itemKey)

  return { itemKey, value }
}

function getStoredValue<T>(storeKey: string) {
  const storedValue = localStorage.getItem(storeKey)

  return parseStoredValue<T>(storedValue)
}

function parseStoredValue<T>(storedValue: string | null) {
  return storedValue !== null ? (JSON.parse(storedValue) as T) : NO_STORED_VALUE
}

function storeItemValue(itemKey: string, value: any) {
  localStorage.setItem(itemKey, JSON.stringify(value))
}

function isFunction(arg: any): arg is Function {
  return typeof arg === 'function'
}
