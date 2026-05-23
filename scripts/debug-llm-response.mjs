const BUILT_IN_FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const BUILT_IN_FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;

if (!BUILT_IN_FORGE_API_KEY || !BUILT_IN_FORGE_API_URL) {
  console.error('BUILT_IN_FORGE_API_KEY or BUILT_IN_FORGE_API_URL not set');
  process.exit(1);
}

async function testLLMResponse() {
  const prompt = `Translate these Korean example sentences to English. Return ONLY the translations, one per line.

Korean: 가
Example: 공원의 중앙에는 잔디밭이 있고 가에는 울타리가 둘러쳐져 있었다.

Korean: 나
Example: 나는 학교에 간다.`;

  const payload = {
    model: "gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content: "You are a Korean-English translator. Translate Korean example sentences to natural English. Be concise and accurate. Return only the translations, one per line.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  console.log('📤 Sending request to:', `${BUILT_IN_FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`);
  console.log('📋 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${BUILT_IN_FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BUILT_IN_FORGE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('\n📥 Response status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Parsed response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.choices?.[0]?.message?.content) {
        console.log('\n📝 Message content:');
        console.log(data.choices[0].message.content);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLLMResponse();
