export const exercisePromptTemplateStr = `
You are an expert in analyzing math exercises. Given a math exercise text, please extract and summarize the following information:

- "condition": A concise summary of what the exercise asks the student to do.
- "topic": The main mathematical topic (e.g., linear equations, geometry, vectors).
- "template": A general form of the exercise with placeholders for variable parts. For instance, if an exercise is "Išspręsk lygtį: $2x - 2 = 14 - 4x$", a possible template might be "Solve the equation: {{ax}} - {{b}} = {{c}} - {{dx}}".
- "parameters": A key-value mapping of specific values found in the exercise.
- "assets": A key-value mappings of assets found in exercise. It should be url of image/video and then type of asset (image/video).
- "originalCondition": The original condition of the exercise (only remove things like html tags, assets, etc, leave just the condition. If it asks for some inputs (looks like fill in the blank), leave it as is).

Return your answer as a valid JSON object with keys "condition", "topic", "template", and "parameters".

Now, please analyze the following exercise text:
{exerciseText}
    `;

export const solutionPromptTemplateStr = `
You are an expert in analyzing math exercises. Given a math exercise solution json, please extract solution steps and correct answer. It should resemble as much as the following format as it can:

Original condition: $condition
Step 1. $step1
Step 2. $step2
...
Final solution: $answer


Return your answer as a string without any additional text

Now, please analyze the following session json:
{sessionJson}
    `;
