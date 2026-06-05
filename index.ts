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
  ];
  punctuation.forEach((v) => {
    word = word.replaceAll(v, "");
  });
  return word;
}

async function createMarkovChain(path: string): Promise<Chain> {
  const file = Bun.file(path);
  const text = await file.text();

  const words = text.split(/[\s\n]+/);
  const countChain: Chain = {};
  for (let i = 0; i < words.length - 1; i++) {
    const word = normalizeWord(words[i]!);
    const nextWord = normalizeWord(words[i + 1]!);
    if (!countChain[word]) {
      countChain[word] = {};
    }
    if (!countChain[word][nextWord]) {
      countChain[word][nextWord] = 0;
    }
    countChain[word][nextWord]++;
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
  firstWord: string,
  limit: number = 50,
): string {
  let word = firstWord;
  let text = word;
  for (let i = 0; i < limit; i++) {
    if (!markovChain[word]) {
      return text;
    }
    let n = Math.random();
    for (const i in markovChain[word]) {
      n -= markovChain[word]![i]!;
      if (n <= 0) {
        word = i;
        text += " " + word;
        break;
      }
    }
  }
  return text;
}

const path = "./data/les miserables.txt";
const markovChain = await createMarkovChain(path);

const generatedText = generateText(markovChain, "the");
console.log(generatedText);
