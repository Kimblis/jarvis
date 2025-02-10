export const exercisePromptTemplateStr = `
You are an expert in analyzing math exercises. Given a math exercise text, please extract and summarize the following information:

- "condition": A concise summary of what the exercise asks the student to do.
- "topic": The main mathematical topic (e.g., linear equations, geometry, vectors).
- "template": A general form of the exercise with placeholders for variable parts. For instance, if an exercise is "Išspręsk lygtį: $2x - 2 = 14 - 4x$", a possible template might be "Solve the equation: {{ax}} - {{b}} = {{c}} - {{dx}}".
- "parameters": A key-value mapping of specific values found in the exercise.

Return your answer as a valid JSON object with keys "condition", "topic", "template", and "parameters".

Now, please analyze the following exercise text:
{exerciseText}
    `;
