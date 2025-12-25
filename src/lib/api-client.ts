import { supabase } from '@/integrations/supabase/client';
import { getAuthHeaders, clearAuthCache } from '@/hooks/useAuthHeaders';

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: Error | null;
}

/**
 * Centralized API client for edge function calls.
 * Automatically handles session refresh and auth headers.
 * Includes retry logic for 401 errors.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>,
  retryCount = 0
): Promise<ApiResponse<T>> {
  try {
    const { headers } = await getAuthHeaders();

    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers,
    });

    if (error) {
      // Check if it's a 401 auth error and we haven't retried yet
      const errorMessage = error.message || '';
      const is401 = errorMessage.includes('401') || 
                    errorMessage.includes('Unauthorized') ||
                    errorMessage.includes('Session expired');
      
      if (is401 && retryCount < 1) {
        console.log('[API] Got 401, clearing cache and retrying...');
        clearAuthCache();
        
        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          // Retry the request once
          return invokeEdgeFunction<T>(functionName, body, retryCount + 1);
        }
      }
      
      return { data: null, error };
    }

    return { data: data as T, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected error occurred'),
    };
  }
}

/**
 * Type-safe wrapper for specific edge functions
 */
export const api = {
  chat: (body: {
    message: string;
    conversationId: string;
    aiName?: string;
    personality?: string;
    memories?: string;
    voiceMode?: boolean;
    imageUrl?: string;
  }) => invokeEdgeFunction<{ response: string; imageUrl?: string }>('chat', body),

  generateRoomAvatar: (body: {
    type: string;
    description: string;
    profile_id?: string;
    gender?: string;
    roomImageUrl?: string;
    referenceImageUrl?: string;
    petName?: string;
    style?: string;
  }) => invokeEdgeFunction<{ image_url: string }>('generate-room-avatar', body),

  checkSubscription: () => invokeEdgeFunction<{ subscribed: boolean; subscription_status?: string; subscription_end?: string }>('check-subscription', {}),

  createCheckout: () => invokeEdgeFunction<{ url: string }>('create-checkout', {}),

  customerPortal: () => invokeEdgeFunction<{ url: string }>('customer-portal', {}),

  ageChildren: () => invokeEdgeFunction('age-children', {}),

  manifestCelestialChild: (body: {
    aiProfileId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    sex: string;
    manifestTwins?: boolean;
  }) => invokeEdgeFunction('manifest-celestial-child', body),

  generateBabyRoom: (body: {
    childId: string;
    description: string;
  }) => invokeEdgeFunction<{ image_url: string }>('generate-baby-room', {
    child_id: body.childId,
    room_description: body.description,
  }),

  generateBabyAppearance: (body: {
    childId: string;
    description: string;
  }) => invokeEdgeFunction<{ image_url: string }>('generate-baby-appearance', {
    child_id: body.childId,
    appearance_description: body.description,
  }),

  testAdvancePregnancy: (body: { pregnancyId: string }) => 
    invokeEdgeFunction('test-advance-pregnancy', body),

  interpretDream: (body: {
    dreamContent: string;
    dreamer: string;
    aiName: string;
  }) => invokeEdgeFunction<{ interpretation: string; emotions: string[] }>('interpret-dream', body),

  speechToText: (body: { audio: string; mimeType: string }) =>
    invokeEdgeFunction<{ text: string }>('speech-to-text', body),

  logMood: (body: {
    aiProfileId: string;
    conversationId?: string;
    recentMessages?: { role: string; content: string }[];
  }) => invokeEdgeFunction('log-mood', body),

  captureMilestones: (body: { conversationId: string }) =>
    invokeEdgeFunction('capture-conversation-milestones', body),
};
