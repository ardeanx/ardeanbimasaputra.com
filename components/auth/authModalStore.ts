export type AuthMode = "signin" | "signup";

type State = { open: boolean; mode: AuthMode };

let state: State = { open: false, mode: "signin" };
let listeners: Array<() => void> = [];

function emit() {
  for (const l of listeners) l();
}

export function openAuthModal(mode: AuthMode = "signin") {
  state = { open: true, mode };
  emit();
}

export function closeAuthModal() {
  state = { ...state, open: false };
  emit();
}

export function setAuthMode(mode: AuthMode) {
  state = { ...state, mode };
  emit();
}

export function subscribeAuthModal(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getAuthModalState(): State {
  return state;
}

export function getAuthModalServerState(): State {
  return { open: false, mode: "signin" };
}
