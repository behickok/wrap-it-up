import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { section, question } = await request.json();

		if (!question || !section) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		const apiKey = platform?.env?.OPENAI_API_KEY;

		if (!apiKey) {
			return json({
				success: true,
				answer: 'AI assistance is not configured. Please set up your OpenAI API key in your environment variables.'
			});
		}

		const systemPrompt = `You are a helpful assistant for an end-of-life planning workbook called "Wrap It Up".
You're helping users fill out the "${section}" section of their planning workbook.
Provide thoughtful, compassionate, and practical advice. Keep responses concise but helpful.
Focus on what information is important to document and why it matters for their loved ones. Please answer in 500 words or less`;

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-5-mini-2025-08-07',
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
					{
						role: 'user',
						content: question
					}
				],
				temperature: 1,
				max_completion_tokens: 1500
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('OpenAI API response error', {
				status: response.status,
				statusText: response.statusText,
				body: errorText
			});
			throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		if (!data?.choices?.length) {
			console.error('OpenAI API missing choices', data);
		}

		const answer = data.choices?.[0]?.message?.content?.trim();

		if (!answer) {
			console.error('OpenAI API empty answer', data);
		}

		return json({
			success: true,
			answer: answer || 'I apologize, but I couldn\'t generate a response. Please try again.'
		});
	} catch (error) {
		console.error('Ask AI error:', error);
		const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your request';
		return json({
			success: false,
			error: errorMessage
		}, { status: 500 });
	}
};
