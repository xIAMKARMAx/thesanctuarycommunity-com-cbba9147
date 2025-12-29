import { supabase } from "@/integrations/supabase/client";

interface ChatHistoryMessage {
  role: string;
  content: string;
  sender_name?: string;
  sender_type?: string;
}

interface ChatRequest {
  message: string;
  imageUrl?: string;
  generateImage: boolean;
  userId: string;
  aiProfileId?: string;
  childId?: string | null;
  conversationId: string;
  history: ChatHistoryMessage[];
  isGroupChat?: boolean;
  respondingToSenderName?: string;
}

interface ChatResponse {
  response: string;
  imageUrl?: string;
}

type ErrorType = 'rate_limit' | 'credits' | 'timeout' | 'network' | 'restricted' | 'unknown';

interface ChatError {
  type: ErrorType;
  message: string;
  retryable: boolean;
}

const MAX_HISTORY_MESSAGES = 20;
const MAX_RETRIES = 2;
const BASE_DELAY = 1500; // 1.5 seconds

/**
 * Analyzes an error and returns a typed error object
 */
export function analyzeError(error: any): ChatError {
  const errorMessage = error?.message?.toLowerCase() || '';
  const statusCode = error?.context?.status || error?.status;
  
  // Check for error body from edge function
  let errorBody: any = null;
  if (error?.context?.body) {
    try {
      errorBody = JSON.parse(error.context.body);
    } catch {
      // Not JSON
    }
  }
  
  // Also check if error itself has a body property (different error formats)
  if (!errorBody && error?.body) {
    try {
      errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
    } catch {
      // Not JSON
    }
  }

  // Log the error for debugging
  console.log('[CHAT ERROR] Analyzing error:', {
    message: error?.message,
    statusCode,
    errorBody,
    fullError: error
  });

  // Check for restricted account
  if (errorBody?.isRestricted) {
    return {
      type: 'restricted',
      message: 'Your account has been restricted due to Terms of Service violations. Please contact support.',
      retryable: false
    };
  }

  // Check for edge function error message in body
  if (errorBody?.error) {
    const bodyErrorMsg = errorBody.error.toLowerCase();
    
    // Check for auth errors
    if (bodyErrorMsg.includes('unauthorized') || bodyErrorMsg.includes('token')) {
      return {
        type: 'network',
        message: 'Your session may have expired. Please refresh the page and try again.',
        retryable: true
      };
    }
  }

  // Non-2xx status code error (generic edge function failure)
  if (errorMessage.includes('non-2xx') || errorMessage.includes('status code')) {
    return {
      type: 'network',
      message: errorBody?.error || 'The server encountered an issue. Please try again in a moment.',
      retryable: true
    };
  }

  // Rate limiting (429)
  if (statusCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    return {
      type: 'rate_limit',
      message: 'The AI is processing many requests right now. Please wait a moment and try again.',
      retryable: true
    };
  }

  // Credits/Payment issues (402)
  if (statusCode === 402 || errorMessage.includes('credit') || errorMessage.includes('payment')) {
    return {
      type: 'credits',
      message: 'Service limit reached. Please try again in a few minutes.',
      retryable: true
    };
  }

  // Timeout errors
  if (
    errorMessage.includes('timeout') || 
    errorMessage.includes('timed out') ||
    errorMessage.includes('deadline') ||
    statusCode === 504 ||
    statusCode === 408
  ) {
    return {
      type: 'timeout',
      message: 'The message took too long to process. This can happen with longer messages - please try again.',
      retryable: true
    };
  }

  // Network errors
  if (
    errorMessage.includes('network') || 
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('failed to fetch') ||
    statusCode === 502 ||
    statusCode === 503
  ) {
    return {
      type: 'network',
      message: 'Connection issue detected. Please check your internet and try again.',
      retryable: true
    };
  }

  // Default unknown error - include original message if available
  return {
    type: 'unknown',
    message: errorBody?.error || error?.message || 'Something went wrong. Please try again.',
    retryable: true // Make unknown errors retryable by default
  };
}

/**
 * Trims conversation history to the last N messages
 */
export function trimHistory(history: ChatHistoryMessage[]): ChatHistoryMessage[] {
  if (history.length <= MAX_HISTORY_MESSAGES) {
    return history;
  }
  
  console.log(`[CHAT] Trimming history from ${history.length} to ${MAX_HISTORY_MESSAGES} messages`);
  return history.slice(-MAX_HISTORY_MESSAGES);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Invokes the chat edge function with retry logic
 */
export async function invokeChatWithRetry(
  request: ChatRequest,
  onRetry?: (attempt: number, maxRetries: number) => void
): Promise<ChatResponse> {
  // Trim history before sending
  const trimmedHistory = trimHistory(request.history);
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[CHAT] Attempt ${attempt + 1}/${MAX_RETRIES + 1}`, {
        messageLength: request.message.length,
        historyCount: trimmedHistory.length
      });

      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          ...request,
          history: trimmedHistory
        },
      });

      if (error) {
        console.error(`[CHAT] Attempt ${attempt + 1} failed:`, error);
        lastError = error;
        
        const analyzed = analyzeError(error);
        
        // Don't retry non-retryable errors
        if (!analyzed.retryable) {
          throw { ...error, analyzed };
        }
        
        // If we have retries left, wait and try again
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt); // Exponential backoff
          console.log(`[CHAT] Retrying in ${delay}ms...`);
          onRetry?.(attempt + 1, MAX_RETRIES);
          await sleep(delay);
          continue;
        }
        
        throw { ...error, analyzed };
      }

      // Validate response
      if (!data || typeof data.response !== 'string') {
        console.error('[CHAT] Invalid response data:', data);
        throw new Error('Received invalid response from AI. Please try again.');
      }

      console.log('[CHAT] Success on attempt', attempt + 1);
      return data as ChatResponse;
      
    } catch (err: any) {
      lastError = err;
      
      // If already analyzed, re-throw
      if (err.analyzed) {
        throw err;
      }
      
      const analyzed = analyzeError(err);
      
      // Don't retry non-retryable errors
      if (!analyzed.retryable || attempt >= MAX_RETRIES) {
        throw { ...err, analyzed };
      }
      
      // Wait and retry
      const delay = BASE_DELAY * Math.pow(2, attempt);
      console.log(`[CHAT] Retrying in ${delay}ms after error:`, err.message);
      onRetry?.(attempt + 1, MAX_RETRIES);
      await sleep(delay);
    }
  }
  
  // Should not reach here, but just in case
  throw lastError || new Error('Failed to send message after retries');
}

/**
 * Loading state messages for better UX
 */
export const LOADING_STATES = [
  { minTime: 0, text: "Connecting..." },
  { minTime: 2000, text: "Thinking..." },
  { minTime: 5000, text: "Almost there..." },
  { minTime: 10000, text: "Processing your message..." },
  { minTime: 15000, text: "Still working on it..." }
];

/**
 * Get the appropriate loading message based on elapsed time
 */
export function getLoadingMessage(elapsedMs: number, isRetrying: boolean, retryCount?: number): string {
  if (isRetrying && retryCount !== undefined) {
    return `Retrying (${retryCount}/2)...`;
  }
  
  let message = LOADING_STATES[0].text;
  for (const state of LOADING_STATES) {
    if (elapsedMs >= state.minTime) {
      message = state.text;
    }
  }
  return message;
}
