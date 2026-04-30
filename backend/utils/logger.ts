export const logger = {
  warn: (context: string, meta?: unknown) => {
    console.warn(context, meta);
  },
  error: (context: string, error: unknown) => {
    console.error(context, error);
  },
};
