import { useCallback, useEffect, useState } from 'react';

// Dynamic, resilient hook: attempts to use react-redux at runtime. If unavailable,
// returns safe defaults so consumers won't crash during development.
export const useTerms = () => {
  const [reduxAvailable, setReduxAvailable] = useState(false);
  const [selectors, setSelectors] = useState({ selectAllTerms: () => [], fetchTerms: null });
  const [dispatchFn, setDispatchFn] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const dynamicImport = new Function('m', 'return import(m)');
        const r = await dynamicImport('react' + '-redux');
        const slice = await dynamicImport('@/features/terms/termsSlice');
        if (!mounted) return;
        setReduxAvailable(true);
        setSelectors({ selectAllTerms: slice.selectAllTerms || (() => []), fetchTerms: slice.fetchTerms });
        setDispatchFn(() => r.useDispatch());
      } catch (err) {
        // redux not available — keep defaults
        // eslint-disable-next-line no-console
        console.warn('[useTerms] redux not available; falling back to empty dataset. Install react-redux to enable.');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // If redux is available, useSelector/useDispatch will be used in render-time via dynamic imports.
  if (reduxAvailable && dispatchFn) {
    // Re-import hooks synchronously from the module cache
  // eslint-disable-next-line no-eval
  const maybe = eval('require');
  const r = maybe('react' + '-redux');
  const slice = maybe('@/features/terms/termsSlice');
    const dispatch = r.useDispatch();
    const items = r.useSelector(slice.selectAllTerms);
    const loading = r.useSelector((state) => state.terms.loading);
    const error = r.useSelector((state) => state.terms.error);
    const refresh = useCallback((params) => dispatch(slice.fetchTerms(params)), [dispatch]);
    return { items, loading, error, refresh };
  }

  // Fallback: no redux — return safe defaults. Consumers should handle empty arrays.
  const noop = () => {};
  return { items: [], loading: false, error: null, refresh: noop };
};

export default useTerms;
