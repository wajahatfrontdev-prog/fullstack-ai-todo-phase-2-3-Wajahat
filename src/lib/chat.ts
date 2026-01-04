export interface ChatResponse {
  conversation_id: string;
  response: string;
  tool_calls?: Array<{
    tool: string;
    arguments: Record<string, unknown>;
    result?: Record<string, unknown>;
  }>;
}

export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  // Use fixed test token for demo
  const token = 'demo-token-123';
  
  const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || 'https://hackathon-todo-app-by-wajahat-ali-lastof-250bbwsmx.vercel.app/api/chat';
  
  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return await response.json();
}