// Store reativo leve, persistido em localStorage.
import { useSyncExternalStore } from "react";

type Listener = () => void;

class Store<T> {
  private state: T;
  private key: string;
  private listeners = new Set<Listener>();
  constructor(key: string, initial: T) {
    this.key = key;
    if (typeof window === "undefined") {
      this.state = initial;
      return;
    }
    try {
      const raw = window.localStorage.getItem(key);
      this.state = raw ? (JSON.parse(raw) as T) : initial;
      if (!raw) window.localStorage.setItem(key, JSON.stringify(initial));
    } catch {
      this.state = initial;
    }
  }
  get = (): T => this.state;
  set = (updater: T | ((prev: T) => T)) => {
    const next =
      typeof updater === "function"
        ? (updater as (p: T) => T)(this.state)
        : updater;
    this.state = next;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(this.key, JSON.stringify(next));
      } catch {
        // storage cheio/bloqueado — mantém o estado só em memória
      }
    }
    this.listeners.forEach((l) => l());
  };
  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
}

export function createStore<T>(key: string, initial: T) {
  const store = new Store<T>(key, initial);
  const useValue = <S = T>(selector: (s: T) => S = (s) => s as unknown as S): S =>
    useSyncExternalStore(
      store.subscribe,
      () => selector(store.get()),
      () => selector(store.get()),
    );
  return { get: store.get, set: store.set, subscribe: store.subscribe, useValue };
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
