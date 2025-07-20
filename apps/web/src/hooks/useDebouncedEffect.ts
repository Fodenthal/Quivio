import { useEffect, useRef, EffectCallback, DependencyList } from 'react';

/**
 * Debounced effect hook for performance optimization of user input.
 * Delays effect execution until dependencies stop changing for the specified delay.
 * 
 * This hook is particularly useful for:
 * - Auto-saving user input after typing stops
 * - API calls triggered by search input
 * - Real-time validation that shouldn't fire on every keystroke
 * 
 * @param effect - Function to execute after debounce delay
 * @param deps - Dependencies to watch for changes  
 * @param delay - Debounce delay in milliseconds
 * 
 * @example
 * ```typescript
 * // Auto-save user input after 500ms of inactivity
 * useDebouncedEffect(() => {
 *   saveToServer(userInput);
 * }, [userInput], 500);
 * 
 * // API search with debouncing
 * useDebouncedEffect(() => {
 *   if (searchQuery) {
 *     performSearch(searchQuery);
 *   }
 * }, [searchQuery], 300);
 * ```
 */
export function useDebouncedEffect(
  effect: EffectCallback, 
  deps: DependencyList, 
  delay: number
): void {
  const effectRef = useRef<EffectCallback>(effect);
  
  // Update the effect ref whenever effect changes
  useEffect(() => {
    effectRef.current = effect;
  });

  useEffect(() => {
    const handler = setTimeout(() => effectRef.current(), delay);
    
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
} 