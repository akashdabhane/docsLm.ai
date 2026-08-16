const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function streamChatResponse({ notebookId, content, conversationId, onToken, onCitations, onComplete, onError }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content, conversation_id: conversationId }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Streaming chat request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() || ''; // Keep incomplete trailing chunk in buffer

      for (const rawEvent of events) {
        if (!rawEvent.trim()) continue;
        
        const lines = rawEvent.split('\n');
        let eventType = 'message';
        let eventDataStr = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            eventDataStr = line.replace('data:', '').trim();
          }
        }

        try {
          const parsedData = JSON.parse(eventDataStr);
          if (eventType === 'token' && onToken) {
            onToken(parsedData.token);
          } else if (eventType === 'citations' && onCitations) {
            onCitations(parsedData.citations);
          } else if (eventType === 'metadata' && onComplete) {
            onComplete({ metadata: parsedData });
          } else if (eventType === 'done' && onComplete) {
            onComplete({ done: true });
          }
        } catch (err) {
          // Ignored parse fallback
        }
      }
    }
  } catch (err) {
    if (onError) onError(err);
  }
}
