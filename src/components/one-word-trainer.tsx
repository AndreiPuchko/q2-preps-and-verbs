import React from "react";
import "./one-word-trainer.css"
import { App } from '../App'
import Cookies from "js-cookie";


type WordEntry = {
    key: string;
    sentence: string;
    words: [string, ...string[]]; // tuple with at least one string
};


interface OneWordTrainerData {
    data: WordEntry[];
}

const COOKIE_NAME = 'prep_trainer_stats';

// Helper functions for cookie operations
const saveStatsToCookie = (answers: Record<number, { correct: boolean; lastPassNumber?: number }>, passCount: number) => {
    const data = { answers, passCount };
    Cookies.set(COOKIE_NAME, JSON.stringify(data), { expires: 365, path: '/' }); // 1 year expiration
};

const loadStatsFromCookie = () => {
    const cookieData = Cookies.get(COOKIE_NAME);
    if (cookieData) {
        try {
            const data = JSON.parse(cookieData);
            return { answers: data.answers, passCount: data.passCount };
        } catch {
            return { answers: {}, passCount: 0 };
        }
    }
    return { answers: {}, passCount: 0 };
};

export const OneWordTrainer: React.FC<OneWordTrainerData> = ({ data }) => {
    const [currentIndex, setCurrentIndex] = React.useState(() =>
        Math.floor(Math.random() * data.length)
    );
    const [selectedWord, setSelectedWord] = React.useState<string>("");
    const [isChecked, setIsChecked] = React.useState(false);
    
    // Initialize state from cookie
    const [passCount, setPassCount] = React.useState(() => loadStatsFromCookie().passCount);
    const [answers, setAnswers] = React.useState<Record<number, {
        correct: boolean;
        lastPassNumber?: number;
    }>>(() => loadStatsFromCookie().answers);

    // Calculate statistics
    const stats = React.useMemo(() => {
        const total = Object.values(answers).length;
        const correct = Object.values(answers).filter(a => a.correct).length;
        return {
            total,
            correct,
            wrong: total - correct,
            percentage: total ? Math.round((correct / total) * 100) : 0
        };
    }, [answers]);

    const getRandomIndex = () => {
        // Get new random index different from current one
        let newIndex;
        let attempts = 0;
        const maxAttempts = data.length * 2; // Prevent infinite loop

        do {
            newIndex = Math.floor(Math.random() * data.length);
            const answer = answers[newIndex];
            // Accept index if:
            // 1. Never answered before
            // 2. Previously answered incorrectly
            // 3. Correctly answered but more than 100 passes ago
            const isValid = !answer ||
                !answer.correct ||
                (answer.correct && answer.lastPassNumber !== undefined &&
                    passCount - answer.lastPassNumber >= 100);

            if (isValid && newIndex !== currentIndex) {
                return newIndex;
            }

            attempts++;
            // If we can't find a perfect match after many attempts,
            // fall back to any unanswered or incorrect exercise
            if (attempts >= maxAttempts) {
                const fallbackIndices = data.map((_, i) => i).filter(i =>
                    !answers[i] || !answers[i].correct
                );
                if (fallbackIndices.length > 0) {
                    return fallbackIndices[Math.floor(Math.random() * fallbackIndices.length)];
                }
                // If all exercises are correct and within 100 passes, reset pass count
                setPassCount(0);
                return Math.floor(Math.random() * data.length);
            }
        } while (true);
    };

    const handleNext = () => {
        if (selectedWord && !isChecked) {
            const isCorrect = handleCheck();
            App.instance?.showMsg(
                ex.sentence + ":\n\n" +
                (isCorrect ? "Richtig! 👍" : `Falsch! Die richtige Antwort ist: ${answer}`),
                isCorrect ? "success" : "error"
            );
        }
        // Proceed to next exercise
        setPassCount((prev: number) => prev + 1);
        setCurrentIndex(getRandomIndex());
        setSelectedWord("");
        setIsChecked(false);
    };

    const ex = data[currentIndex];
    let answer: string = "";

    // Process the sentence once - extract answer and split into parts
    const processSentence = (sentence: string) => {
        const parts = sentence.split(/(\{.*?\})/);
        const match = sentence.match(/\{(.*?)\}/);
        if (match) {
            answer = match[1]; // Save the word inside curly braces to answer
        }
        return parts.map(part => ({
            isBlank: part.startsWith('{') && part.endsWith('}'),
            text: part
        }));
    };

    const handleWordClick = (word: string) => {
        setSelectedWord(word);
    };

    const handleCheck = () => {
        setIsChecked(true);
        const isCorrect = selectedWord === answer;
        const newAnswers = {
            ...answers,
            [currentIndex]: {
                correct: isCorrect,
                lastPassNumber: isCorrect ? passCount : undefined
            }
        };
        setAnswers(newAnswers);
        // Save to cookie after updating
        saveStatsToCookie(newAnswers, passCount);
        return isCorrect;
    };

    const handleReset = () => {
        // Reset current exercise state
        setIsChecked(false);
        setSelectedWord("");
        // Reset statistics
        setAnswers({});
        setPassCount(0);
        // Save empty stats to cookie
        saveStatsToCookie({}, 0);
        App.instance?.showMsg("Statistik zurückgesetzt", "info");
    };

    const sentenceParts = processSentence(ex.sentence);

    return (
        <div className="exercise-container">
            <h2>{ex.key}</h2>
            <div className="stats">
                <span>Correct: {stats.correct}</span>
                <span>Wrong: {stats.wrong}</span>
                <span>Total: {stats.total}</span>
                <span>Success Rate: {stats.percentage}%</span>
            </div>
            <div className="sentence">
                {sentenceParts.map((part, index) =>
                    part.isBlank ?
                        <div
                            key={index}
                            className={`blank ${isChecked ?
                                selectedWord === answer ? 'correct' : 'wrong'
                                : ''
                                }`}
                        >
                            {selectedWord}
                        </div>
                        : part.text
                )}
            </div>
            <div className="word-pool">
                {[...ex.words].sort(() => Math.random() - 0.5).map((w, index) => (
                    <div
                        key={`${w}-${index}`}
                        className="word"
                        onClick={() => handleWordClick(w)}
                    >
                        {w}
                    </div>
                ))}
            </div>
            <div className="buttons">
                <button
                    onClick={handleCheck}
                    disabled={isChecked || !selectedWord}
                >
                    Check
                </button>
                <button onClick={handleNext}>Next</button>
                <button onClick={handleReset}>Reset</button>
            </div>

        </div>
    );
};

export default OneWordTrainer;
