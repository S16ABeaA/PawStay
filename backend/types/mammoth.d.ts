declare module "mammoth" {
  export interface ExtractRawTextResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
      error?: unknown;
    }>;
  }

  export function extractRawText(input: {
    path?: string;
    buffer?: Buffer;
  }): Promise<ExtractRawTextResult>;
}
