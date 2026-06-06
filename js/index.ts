import { exit } from "process";
import { parseArgs } from "util";

type Chain = Record<string, Record<string, number>>;

function normalizeWord(word: string): string {
  word = word.toLowerCase();
  const punctuation = [
    ".",
    ",",
    ":",
    ";",
    "!",
    "?",
    "'",
    '"',
    "_",
    "-",
    "(",
    ")",
    "\n",
    "”",
    "“",
    "’",
    "«",
    "»",
  ];
  punctuation.forEach((v) => {
    word = word.replaceAll(v, "");
  });
  return word;
}

async function createMarkovChain(
  path: string,
  order: number = 1,
): Promise<Chain> {
  const file = Bun.file(path);
  const text = await file.text();

  const words = text.split(/[\s\n]+/).map(normalizeWord);
  const countChain: Chain = {};
  for (let i = 0; i < words.length - order; i++) {
    const state = words.slice(i, i + order).join(" ");
    const nextWord = words[i + order]!;
    if (!countChain[state]) {
      countChain[state] = {};
    }
    if (!countChain[state][nextWord]) {
      countChain[state][nextWord] = 0;
    }
    countChain[state][nextWord]++;
  }

  const markovChain: Chain = {};
  for (const i in countChain) {
    markovChain[i] = {};
    let total = 0;
    for (const j in countChain[i]) {
      total += countChain[i][j]!;
    }
    for (const j in countChain[i]) {
      markovChain[i][j] = countChain[i][j]! / total;
    }
  }

  return markovChain;
}

function generateText(
  markovChain: Chain,
  firstWord?: string,
  limit: number = 50,
): string {
  if (!firstWord) {
    const keys = Object.keys(markovChain);
    firstWord = keys[Math.floor(Math.random() * keys.length)];
  }

  let state = firstWord as string;
  let text = state;

  for (let i = 0; i < limit; i++) {
    if (!markovChain[state]) {
      return text;
    }
    let n = Math.random();
    for (const i in markovChain[state]) {
      n -= markovChain[state]![i]!;
      if (n <= 0) {
        const words = state.split(" ");
        words.shift();
        words.push(i);
        state = words.join(" ");
        text += " " + i;
        break;
      }
    }
  }
  return text;
}

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    order: {
      type: "string",
    },
    start: {
      type: "string",
    },
    limit: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

if (positionals.length < 3) {
  console.error("No path provided");
  exit(1);
}

const path = positionals[2];
const markovChain = await createMarkovChain(path!, Number(values.order ?? 1));

const generatedText = generateText(
  markovChain,
  values.start,
  Number(values.limit ?? 50),
);
console.log(generatedText);
