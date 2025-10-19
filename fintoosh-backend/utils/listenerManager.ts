// Global listener manager to prevent memory leaks from event listeners
class ListenerManager {
  private listeners = new Set<() => void>();

  // Add a cleanup function to the manager
  add(cleanup: () => void) {
    this.listeners.add(cleanup);
  }

  // Execute all cleanup functions and clear the set
  cleanup() {
    this.listeners.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during listener cleanup:', error);
      }
    });
    this.listeners.clear();
  }

  // Get the number of active listeners (for debugging)
  get size() {
    return this.listeners.size;
  }
}

// Singleton instance for global listener management
export const globalListenerManager = new ListenerManager();

// Helper function to create a cleanup-enabled callback
export const createCleanupCallback = <T extends any[], R>(
  callback: (...args: T) => R | Promise<R>,
  cleanup?: () => void
) => {
  let isMounted = true;

  const wrappedCallback = async (...args: T): Promise<R | undefined> => {
    if (!isMounted) return undefined;

    try {
      return await callback(...args);
    } catch (error) {
      console.error('Error in cleanup-enabled callback:', error);
      return undefined;
    }
  };

  const destroy = () => {
    isMounted = false;
    if (cleanup) {
      try {
        cleanup();
      } catch (error) {
        console.error('Error in cleanup function:', error);
      }
    }
  };

  // Register with global manager
  globalListenerManager.add(destroy);

  return {
    callback: wrappedCallback,
    destroy,
  };
};
