export const exercisePromptTemplateStr = `
You are an AI that analyzes math exercises.

- **Output Format:** Your entire response must be a single JSON object containing only the keys "condition", "topic", "template", "parameters", "assets", and "originalCondition". Do not include any additional text, markdown formatting, explanations, or comments.
required fields: ["condition", "topic", "template", "parameters", "assets", "originalCondition"], if there are no assets or parameters return empty objects

Given a math exercise text, please extract and summarize the following information:

- **condition:** A concise summary of what the exercise asks the student to do.
- **topic:** The main mathematical topic (e.g., linear equations, geometry, vectors).
- **template:** A general form of the exercise with placeholders for variable parts. For instance, if an exercise is "Išspręsk lygtį: $2x - 2 = 14 - 4x$", a possible template might be "Solve the equation: {{ax}} - {{b}} = {{c}} - {{dx}}".
- **parameters:** A key-value mapping of specific values found in the exercise.
- **assets:** A key-value mapping of assets found in the exercise. The key should be the URL of an image/video and the value should denote the asset type ("image" or "video").
- **originalCondition:** The original condition of the exercise with any extraneous tags, styles, or non-essential content removed. If the exercise includes input fields (e.g., fill in the blanks), append them at the end of the condition separated by spaces using the format "{{input1}} {{input2}} {{input3}}".

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
