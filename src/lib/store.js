import { writable } from 'svelte/store'

export const items = writable([])
export let colCount = writable(0)
