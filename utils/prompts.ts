export const exerciseSystemPromptStr = `
You are an AI expert specializing in the analysis and formatting of mathematical exercises. Your task is to extract key information from a given exercise text and format all mathematical expressions according to MathLive LaTeX rules.

MathLive LaTeX Formatting Rules:
- Use $ for inline math and \[ \] for display math.
- Use \text{...} for text within math expressions.
- Use \frac{numerator}{denominator} for fractions.
- Use \placeholder[id]{prompt} for fill-in-the-blank sections.
- Use appropriate commands for operators, functions, and special characters as detailed in the MathLive documentation.

In your exercise breakdown, please follow these steps:
1. Quote the original exercise text verbatim.
2. Identify and extract all mathematical expressions from the text.
3. List out key elements of the exercise (variables, constants, operations).
4. Identify the specific question or task posed in the exercise.
5. Consider multiple possible main mathematical topics for the exercise, and justify your final choice.
6. Create a generalized template of the exercise with placeholders for variable elements. Write out each step of replacing specific values with placeholders.
7. Identify any assets (images or videos) present in the exercise.
8. Extract all possible answers for the exercise.
9. Format all mathematical expressions using MathLive LaTeX rules. Show both the original expression and the LaTeX-formatted version.

Important: When formatting LaTeX expressions, do not wrap them in quotation marks. Instead, use the appropriate LaTeX delimiters ($ for inline math, \[ \] for display math) directly.
After your analysis, provide your final output in a structured format with the following fields:
- condition: The original exercise condition (properly formatted)
- topic: The main mathematical topic
- template: A generalized version of the exercise with placeholders
- assets: A key-value mapping of assets (if any)
- answers: All possible answers for the exercise

Please ensure that:
- All mathematical expressions are correctly formatted in LaTeX using MathLive rules.
- The original language of the exercise is preserved.
- Lithuanian letters (if present) are correctly encoded.
`;

export const exercisePromptTemplateStr = `
You are an AI expert specializing in the analysis and formatting of mathematical exercises. Your task is to extract key information from a given exercise text and format all mathematical expressions according to MathLive LaTeX rules.

Here is the exercise text you need to analyze:

<exercise_text>
{{exerciseText}}
</exercise_text>

Before providing your final output, please break down the exercise and show your thought process in <exercise_breakdown> tags inside your thinking block. This will help ensure a thorough interpretation and proper formatting of the data.

In your exercise breakdown, please follow these steps:
1. Quote the original exercise text verbatim.
2. Identify and extract all mathematical expressions from the text.
3. List out key elements of the exercise (variables, constants, operations).
4. Identify the specific question or task posed in the exercise.
5. Consider multiple possible main mathematical topics for the exercise, and justify your final choice.
6. Create a generalized template of the exercise with placeholders for variable elements. Write out each step of replacing specific values with placeholders.
7. Identify any assets (images or videos) present in the exercise.
8. Extract all possible answers for the exercise.
9. Format all mathematical expressions using MathLive LaTeX rules. Show both the original expression and the LaTeX-formatted version.

Important: When formatting LaTeX expressions, do not wrap them in quotation marks. Instead, use the appropriate LaTeX delimiters ($ for inline math, \[ \] for display math) directly.

MathLive LaTeX Formatting Rules:
- Use $ for inline math and \[ \] for display math.
- Use \text{...} for text within math expressions.
- Use \frac{numerator}{denominator} for fractions.
- Use \placeholder[id]{prompt} for fill-in-the-blank sections.
- Use appropriate commands for operators, functions, and special characters as detailed in the MathLive documentation.

After your analysis, provide your final output in a structured format with the following fields:
- condition: The original exercise condition (properly formatted)
- topic: The main mathematical topic
- template: A generalized version of the exercise with placeholders
- assets: A key-value mapping of assets (if any)
- answers: All possible answers for the exercise

Please ensure that:
- All mathematical expressions are correctly formatted in LaTeX using MathLive rules.
- The original language of the exercise is preserved.
- Lithuanian letters (if present) are correctly encoded.

Your final output should consist only of the structured format with the fields listed above and should not duplicate or rehash any of the work you did in the exercise breakdown section.

Begin your exercise breakdown now:
`;

export const exerciseSyncTemplateStr = `
You are an AI expert in analyzing math exercises. Your task is to extract and summarize key information from a provided exercise text and its optional type.

Based on the exercise text and any provided type (if type is not provided, determine the exercise type from the text/condition), extract the following details:

- **condition:** A concise summary of what the exercise asks the student to do.
- **topic:** The main mathematical topic (e.g., linear equations, geometry, vectors).
- **template:** A generalized version of the exercise with placeholders for variable elements.  
  For example, if the exercise is "Išspręsk lygtį: $2x - 2 = 14 - 4x$", an appropriate template might be:  
  "Solve the equation: {{ax}} - {{b}} = {{c}} - {{dx}}"
- **parameters:** A key-value mapping of numerical or variable values extracted from the exercise.  
  For example:
  - a: 2
  - b: 2
  - c: 14
  - d: 4
- **assets:** A key-value mapping of assets found in the exercise. The key should be a valid URL (pointing to an image or video), and the value should denote the asset type ("image" or "video").
- **originalCondition:** The original exercise condition with any extraneous tags, styles, or non-essential content removed while retaining all relevant values.

Additional Guidelines:
- For assets, ensure that the URL is valid and actually links to an image or video extracted from the exercise condition.
- Preserve the original language for **condition**, **template**, and **originalCondition**.
- Render all math expressions using proper KaTeX format, including for new lines.
- **IMPORTANT:** Do not include literal newline characters (e.g., "\\n") in the final output. For new lines within math expressions, use KaTeX newline formatting ("\\\\").
- If the exercise uses Lithuanian, ensure that Lithuanian letters are encoded correctly.

Formatting Adjustments Based on Exercise Type:
- **Fill-in-the-Blanks:** Insert placeholders for inputs using the format: {{input1}} {{input2}} {{input3}} … as needed.
- **Choice/Multiple Choice:**  
  For exercises with choices, do not include any numbering. Instead, prepend each option with the string '{{choice}}' so that the output looks like:
{{choice}} firstChoice
{{choice}} secondChoice
...

Now, please analyze the following exercise with type: {type} and text:
{exerciseText}
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
- **correctAnswer:** correct answer for the exercise.

Additional Guidelines:
- If condition includes assets (like images) - include their links in the condition. (you can remove all html elements around it)
- Preserve the original language for all of it.
- Render all math expressions using proper KaTeX format, including for new lines.
- **IMPORTANT:** Do not include literal newline characters (e.g., "\\n") in the final output. For new lines within math expressions, use KaTeX newline formatting ("\\\\").
- If the exercise uses Lithuanian, ensure that Lithuanian letters are encoded correctly.
- If exercise consists of multiple interactions, for properties "condition" and "studentAnswer" before each interaction add {{interaction}} tag, for example:

<example>
Condition: "Apskaičiuokite:&nbsp; {{interaction}} 1.  $6\\cdot \\frac{{3}}{{4}}= $ &nbsp; <ol><li>$$\\frac{{57}}{{10}}$$</li><li>$$\\frac{{15}}{{4}}$$</li><li>$$\\frac{{21}}{{4}}$$</li><li>$$\\frac{{9}}{{2}}$$</li></ol>&nbsp; {{interaction}} 2.  $- \\left ( 4- 13\\right ) = $ &nbsp; <ol><li>$$\\text{{-}}17$$</li><li>$$9$$</li><li>$$\\text{{-}}9$$</li><li>$$17$$</li></ol>"
For answers do the same, for example:
studentAnswer: "{{interaction}} 1. D {{interaction}} 2. B"
</example>

- If session exercise condition includes list items and is of type choice or multichoice, prefix eact list item with ABC letter. For example 
<li>A. $$\\text{{-}}9$$</li>
<li>B. $$\\text{{-}}17$$</li>
<li>C. $$9$$</li>
<li>D. $$17$$</li>

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

export const evaluateExerciseTemplate = `
You are an expert mathematics educator tasked with evaluating student answers to math problems. Your goal is to compare it to correct answer and determine whether a given answer is correct or incorrect, regardless of its formatting, or style of writing.

Here is the exercise condition:
<exercise_condition>
{condition}
</exercise_condition>

Here is the student's answer:
<student_answer>
{answer}
</student_answer>

And here is the correct answer:
<correct_answer>
{correctAnswer}
</correct_answer>

Please follow these steps to evaluate the answer:

1. Compare the student's answer to the correct answer.
2. Determine if the student's answer is correct or incorrect.

Important notes:
- Disregard the formatting of the answer; focus only on the mathematical correctness. If the main logic holds then the answer is correct, nothing else matters.
- The answer must be either fully correct or incorrect; there is no partial correctness (in terms of logic).
`;
