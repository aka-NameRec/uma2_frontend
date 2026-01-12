export function useLogger(context: string) {
  const log = (message: string, ...args: unknown[]) => {
    console.log(`[${context}]`, message, ...args);
  };
  
  const error = (message: string, ...args: unknown[]) => {
    console.error(`[${context}]`, message, ...args);
  };
  
  const warn = (message: string, ...args: unknown[]) => {
    console.warn(`[${context}]`, message, ...args);
  };
  
  return { log, error, warn };
}
