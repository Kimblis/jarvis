export const exerciseSystemPromptStr = `
You are an AI expert in analyzing math exercises. Your task is to extract and summarize key information from the provided exercise text. All math expressions must be formatted according to MathLive rules as specified in the documentation (https://cortexjs.io/mathfield/reference/commands).

Based on the exercise text, extract the following details:

- **condition:** The original exercise condition with any extraneous tags, styles, or non-essential content removed while retaining all relevant values. Render all math expressions using proper LaTeX format and MathLive rules. **Important:** Any natural language text inside math mode (e.g. descriptive words or labels) must be wrapped with '\\text{...}'. For example, if a math expression includes the word “minus”, it should be rendered as '$x - \\text{minus} y$' (if that’s the intended formatting).
- **topic:** The main mathematical topic (e.g., linear equations, geometry, vectors).
- **template:** A generalized version of the exercise with placeholders for variable elements.  
  For instance, if the exercise is "Išspręsk lygtį: $2x - 2 = 14 - 4x$", an appropriate template might be:  
  "Solve the equation: $\\frac{\\text{numerator}}{\\text{denominator}} + \\frac{\\text{another numerator}}{\\text{another denominator}}$".  
  Ensure that any natural language parts within the math expressions are wrapped with '\\text{...}'.
- **assets:** A key-value mapping of assets found in the exercise. The key should be a valid URL (pointing to an image or video), and the value should denote the asset type ("image" or "video"). Validate that the URL links to a genuine asset.
- **answers:** All possible answers for the exercise.

Additional Guidelines:
- Preserve the original language for both **condition** and **template**.
- All math expressions must be rendered in proper LaTeX using MathLive formatting. Replace any literal newline characters (e.g., "\n") with LaTeX newline formatting ("\\\\").
- When including natural language within math expressions, wrap the text segments with '\\text{...}' to ensure correct display.
- If the exercise is in Lithuanian, ensure that Lithuanian letters are encoded correctly.
- **Fill-in-the-Blanks:** For exercises with fill-in-the-blank inputs, insert placeholders using the MathLive format as specified in the documentation.
`;

export const exercisePromptTemplateStr = `
Please analyze the following exercise text:
{{exerciseText}}
`;

export const solutionPromptTemplateStr = `
You are an expert in analyzing math exercise solutions. Your task is to process a JSON object containing a math exercise solution and it's type extract the original condition, solution steps and correct answer according to the instructions below.

Output the extracted information using the following format:
Original condition: $condition {{step}}
Step 1: $step1 {{step}}
Step 2: $step2 {{step}}
...
Final solution: $answer {{step}}

Things to note:
- In json the answers for choice are zero indexed, which means that if answer is 2 it means its 3rd choice and etc.

Special formatting rules:
- **Multiple-choice/choice exercises:** Add 1 to the JSON index for answers (e.g., if the JSON answer is 3, output “4" (4th choice);  for multiple answers, adjust each index similarly, separate each answer with a comma).  
- **Complex exercises:** If the question requires a specific numeric or descriptive answer (e.g., look at the graph on how long people slept and determine how many hours most people slept, host many hours slept X respondents, etc...), output the actual correct answer (with units if applicable) rather than it's index.

Additional guidelines:
- Return the final output strictly as a plain string without any extra commentary.
- Write all math expressions using proper KaTeX format; use KaTeX formatting for new lines as well.
- **Language Preservation:** Keep the exercise in its original language and correctly encode Lithuanian letters if present.
- Use the string '{{step}}' to separate each section (original condition, steps, and final solution).

Now, please analyze the following session JSON data:
{sessionJson}
    `;

export const sessionInfoPromptTemplateStr = `
You are an AI expert in analyzing math exercises. Your task is to extract relevant information from exercise session info.

Extract the following details

- **condition:** A full, original exercise condition.
- **studentSolution:** A full student solution solution.
- **studentAnswer:** Student final answer.
- **scoresTotal:** total number of scores for the whole exercise (if there were multiple interactions, add them up).
- **scoresEarned:** number of scores earned for the whole exercise.

Additional Guidelines:
- If condition includes assets (like images) - include their links in the condition. (you can remove all html elements around it)
- Preserve the original language for all of it.
- Render all math expressions using proper KaTeX format, including for new lines.
- **IMPORTANT:** Do not include literal newline characters (e.g., "\\n") in the final output. For new lines within math expressions, use KaTeX newline formatting ("\\\\").
- If the exercise uses Lithuanian, ensure that Lithuanian letters are encoded correctly.

Now, please analyze the following session info:
{sessionInfo}
`;

export const textCleaningTemplateStr = `
Please clean up the following text by removing non-essential formatting, emojis, and extra spacing while preserving all the mathematical expressions and important instructional content, by making text into more standardized form so that the text is easier to process for further analysis.

NOTE: 
- Keep everything in original language.
- Your response should be just cleaned text without any additional text.

Here is the text: {text}
`;

export const summaryTemplateStr = `
“Please summarize the following text, condensing it into a clear and concise version that retains all the key ideas and mathematical content without losing any essential details.

NOTE: 
- Keep everything in original language.
- Your response should be just summarized text without any additional text.

Here is the text: {text}
    `;
