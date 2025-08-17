import type { DifficultyString } from "./types";

export interface StaticPrompt {
  id: string;
  text: string;
  category: string;
  difficulty: DifficultyString;
  answer: string;
}

export const STATIC_PROMPTS: StaticPrompt[] = [
  { id: "geo_1", text: "What is the capital of France?", category: "Geography", difficulty: "easy", answer: "Paris" },
  { id: "geo_2", text: "What is the largest country in the world by land area?", category: "Geography", difficulty: "easy", answer: "Russia" },
  { id: "geo_3", text: "What is the capital of Japan?", category: "Geography", difficulty: "easy", answer: "Tokyo" },
  { id: "geo_4", text: "What is the longest river in the world?", category: "Geography", difficulty: "medium", answer: "Nile" },
  { id: "geo_5", text: "What is the highest mountain in the world?", category: "Geography", difficulty: "easy", answer: "Mount Everest" },
  { id: "geo_6", text: "What is the capital of Australia?", category: "Geography", difficulty: "medium", answer: "Canberra" },
  { id: "geo_7", text: "What is the largest desert in the world?", category: "Geography", difficulty: "medium", answer: "Sahara" },
  { id: "geo_8", text: "What is the capital of Brazil?", category: "Geography", difficulty: "medium", answer: "Brasília" },
  { id: "hist_1", text: "In what year did World War II end?", category: "History", difficulty: "easy", answer: "1945" },
  { id: "hist_2", text: "Who was the first President of the United States?", category: "History", difficulty: "easy", answer: "George Washington" },
  { id: "hist_3", text: "In what year did Columbus discover America?", category: "History", difficulty: "medium", answer: "1492" },
  { id: "hist_4", text: "What ancient wonder was located in Alexandria?", category: "History", difficulty: "hard", answer: "Lighthouse" },
  { id: "hist_5", text: "Who was the first Emperor of Rome?", category: "History", difficulty: "medium", answer: "Augustus" },
  { id: "hist_6", text: "In what year did the Berlin Wall fall?", category: "History", difficulty: "medium", answer: "1989" },
  { id: "hist_7", text: "Who was the first woman to win a Nobel Prize?", category: "History", difficulty: "hard", answer: "Marie Curie" },
  { id: "hist_8", text: "What year did the Titanic sink?", category: "History", difficulty: "medium", answer: "1912" },
  { id: "pop_1", text: "What is the name of the main character in the movie 'Titanic'?", category: "Pop Culture", difficulty: "easy", answer: "Jack" },
  { id: "pop_2", text: "Who played Iron Man in the Marvel Cinematic Universe?", category: "Pop Culture", difficulty: "easy", answer: "Robert Downey Jr" },
  { id: "pop_3", text: "What is the name of the fictional town where 'The Simpsons' live?", category: "Pop Culture", difficulty: "medium", answer: "Springfield" },
  { id: "pop_4", text: "What year did the first iPhone come out?", category: "Pop Culture", difficulty: "medium", answer: "2007" },
  { id: "pop_5", text: "Who is the lead singer of Queen?", category: "Pop Culture", difficulty: "easy", answer: "Freddie Mercury" },
  { id: "pop_6", text: "What is the name of the main character in 'Breaking Bad'?", category: "Pop Culture", difficulty: "medium", answer: "Walter White" },
  { id: "pop_7", text: "What is the name of the fictional school in 'Harry Potter'?", category: "Pop Culture", difficulty: "easy", answer: "Hogwarts" },
  { id: "pop_8", text: "Who created the TV show 'The Office' (US version)?", category: "Pop Culture", difficulty: "hard", answer: "Greg Daniels" },
  { id: "sci_1", text: "What is the chemical symbol for gold?", category: "Science", difficulty: "easy", answer: "Au" },
  { id: "sci_2", text: "What is the hardest natural substance on Earth?", category: "Science", difficulty: "medium", answer: "Diamond" },
  { id: "sci_3", text: "What is the largest planet in our solar system?", category: "Science", difficulty: "easy", answer: "Jupiter" },
  { id: "sci_4", text: "What is the atomic number of carbon?", category: "Science", difficulty: "medium", answer: "6" },
  { id: "sci_5", text: "What is the speed of light in miles per second?", category: "Science", difficulty: "hard", answer: "186282" },
  { id: "sci_6", text: "What is the name of the force that keeps planets in orbit?", category: "Science", difficulty: "easy", answer: "Gravity" },
  { id: "sci_7", text: "What is the chemical formula for water?", category: "Science", difficulty: "easy", answer: "H2O" },
  { id: "sci_8", text: "What is the largest organ in the human body?", category: "Science", difficulty: "medium", answer: "Skin" },
  { id: "sport_1", text: "What country has won the most FIFA World Cups?", category: "Sports", difficulty: "medium", answer: "Brazil" },
  { id: "sport_2", text: "What is the national sport of Japan?", category: "Sports", difficulty: "hard", answer: "Sumo" },
  { id: "sport_3", text: "How many players are on a basketball court at once?", category: "Sports", difficulty: "easy", answer: "10" },
  { id: "sport_4", text: "What is the name of the trophy awarded to the winner of the Super Bowl?", category: "Sports", difficulty: "medium", answer: "Vince Lombardi Trophy" },
  { id: "sport_5", text: "What year did the first modern Olympic Games take place?", category: "Sports", difficulty: "medium", answer: "1896" },
  { id: "sport_6", text: "What is the most popular sport in the world?", category: "Sports", difficulty: "easy", answer: "Soccer" },
  { id: "sport_7", text: "How many Grand Slam tennis tournaments are there?", category: "Sports", difficulty: "medium", answer: "4" },
  { id: "sport_8", text: "What is the nickname of the New York Yankees?", category: "Sports", difficulty: "hard", answer: "The Bronx Bombers" }
];


