const PROMPT = `You are a dermatology AI assistant specializing in scalp health for motorcycle helmet users. Analyze this scalp image and provide a detailed assessment. Return ONLY a JSON object with no markdown:
{
  "overall_risk_score": <number 1-10>,
  "scalp_condition_summary": "<string>",
  "redness_score": <number 1-10>,
  "dryness_score": <number 1-10>,
  "oiliness_score": <number 1-10>,
  "dandruff_score": <number 1-10>,
  "inflammation_score": <number 1-10>,
  "hair_density_score": <number 1-10>,
  "thinning_risk": "<low|moderate|high>",
  "observations": ["<string>"],
  "recommendations": ["<string>"],
  "urgent_attention_needed": <true|false>
}`;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeScalpImage(file) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key not configured. Add VITE_GROQ_API_KEY to your .env file.');

  const base64   = await fileToBase64(file);
  const mimeType = file.type || 'image/jpeg';

  const res = await fetch(
    `https://api.groq.com/openai/v1/chat/completions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: PROMPT },
          ],
        }],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response received from Groq');

  // strip optional markdown code fences
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Could not parse Groq response. Try again.');
  }
}
