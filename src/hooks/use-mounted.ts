import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Returns false during SSR/hydration and true once mounted on the client,
// without the extra render + lint issues of a `useEffect(() => setMounted(true), [])`.
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
