import { readFileSync } from 'node:fs';

interface EvalCase {
  id: string;
  domain: string;
  question: string;
  expectedFacts: string[];
  expectedSources: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

function parseJsonl(path: string): EvalCase[] {
  const content = readFileSync(path, 'utf8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line) as EvalCase;
      } catch (error) {
        throw new Error(`Invalid JSONL at line ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

function validateCase(testCase: EvalCase): string[] {
  const errors: string[] = [];

  if (!testCase.id) errors.push('missing id');
  if (!testCase.domain) errors.push('missing domain');
  if (!testCase.question) errors.push('missing question');
  if (!Array.isArray(testCase.expectedFacts)) errors.push('expectedFacts must be an array');
  if (!Array.isArray(testCase.expectedSources)) errors.push('expectedSources must be an array');
  if (!['easy', 'medium', 'hard'].includes(testCase.difficulty)) errors.push('invalid difficulty');
  if (!Array.isArray(testCase.tags)) errors.push('tags must be an array');

  return errors;
}

const datasetPath = process.argv[2] ?? 'eval/questions.example.jsonl';
const cases = parseJsonl(datasetPath);
const validationErrors = cases.flatMap((testCase) =>
  validateCase(testCase).map((error) => ({ id: testCase.id || '(missing id)', error })),
);

if (validationErrors.length > 0) {
  console.error(JSON.stringify({ status: 'failed', validationErrors }, null, 2));
  process.exit(1);
}

const byDomain = cases.reduce<Record<string, number>>((acc, testCase) => {
  acc[testCase.domain] = (acc[testCase.domain] ?? 0) + 1;
  return acc;
}, {});

console.log(
  JSON.stringify(
    {
      status: 'ok',
      datasetPath,
      totalCases: cases.length,
      byDomain,
      note: 'This skeleton validates the eval dataset shape. Later phases should call deployed APIs and score outputs.',
    },
    null,
    2,
  ),
);
