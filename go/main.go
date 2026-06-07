package main

import (
	"flag"
	"fmt"
	"math/rand"
	"os"
	"regexp"
	"strings"
)

type Chain = map[string]map[string]float64

func normalizeWord(word string) string {
	word = strings.ToLower(word)
	punctuation := []string{
		".", ",", ":", ";", "!", "?", "'", "\"", "_", "-", "(", ")", "\n",
		"”",
		"“",
		"’",
		"«",
		"»",
	}
	for _, v := range punctuation {
		word = strings.ReplaceAll(word, v, "")
	}
	return word
}

func createMarkovChain(path string, order int) Chain {
	data, err := os.ReadFile(path)
	if err != nil {
		panic(err)
	}

	re := regexp.MustCompile(`[\s\n]+`)
	words := re.Split(string(data), -1)
	for i, v := range words {
		words[i] = normalizeWord(v)
	}
	countChain := Chain{}

	for i := 0; i < len(words)-order; i++ {
		state := strings.Join(words[i:i+order], " ")
		nextWord := words[i+order]
		if _, in := countChain[state]; !in {
			countChain[state] = make(map[string]float64)
		}
		if _, in := countChain[state][nextWord]; !in {
			countChain[state][nextWord] = 0
		}
		countChain[state][nextWord]++
	}

	markovChain := Chain{}
	for i, v := range countChain {
		markovChain[i] = make(map[string]float64)
		total := 0.0
		for _, w := range v {
			total += w
		}
		for j, w := range v {
			markovChain[i][j] = w / total
		}
	}

	return markovChain
}

func generateText(markovChain Chain, firstWord string, limit int) string {
	if firstWord == "" {
		keys := make([]string, 0, len(markovChain))
		for key := range markovChain {
			keys = append(keys, key)
		}
		firstWord = keys[rand.Intn(len(keys))]
	}

	state := firstWord
	text := state

	for range limit {
		if _, in := markovChain[state]; !in {
			return text
		}

		n := rand.Float64()
		for j, v := range markovChain[state] {
			n -= v
			if n <= 0 {
				words := strings.Split(state, " ")
				words = words[1:]
				words = append(words, j)
				state = strings.Join(words, " ")
				text += " " + j
				break
			}
		}
	}

	return text
}

func main() {
	if len(os.Args) < 2 {
		panic("No path provided")
	}
	path := os.Args[1]
	order := flag.Int("order", 1, "Order of the Markov chain")
	start := flag.String("start", "", "First words of the generated text")
	limit := flag.Int("limit", 50, "Number of words in the generated text")

	markovChain := createMarkovChain(path, *order)
	generatedText := generateText(markovChain, *start, *limit)
	fmt.Println(generatedText)
}
