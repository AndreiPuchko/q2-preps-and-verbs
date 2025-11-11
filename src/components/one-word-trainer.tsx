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
    const [shuffledWords, setShuffledWords] = React.useState<string[]>([]);

    // Initialize state from cookie
    const [passCount, setPassCount] = React.useState(() => loadStatsFromCookie().passCount);
    const [answers, setAnswers] = React.useState<Record<number, {
        correct: boolean;
        lastPassNumber?: number;
        correctCount?: number;
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
        // Every 4rd attempt should be an unanswered exercise if available
        if (passCount > 0 && (passCount + 1) % 4 === 0) {
            const unanswered = data
                .map((_, i) => i)
                .filter(i => !answers[i] && i !== currentIndex);

            if (unanswered.length > 0) {
                return unanswered[Math.floor(Math.random() * unanswered.length)];
            }
        }

        // Every 3th attempt → previously incorrect if available
        if (passCount > 0 && (passCount + 1) % 3 === 0) {
            const incorrect = data
                .map((_, i) => i)
                .filter(i => answers[i] && !answers[i].correct && i !== currentIndex);

            if (incorrect.length > 0) {
                return incorrect[Math.floor(Math.random() * incorrect.length)];
            }
        }

        // Build list of eligible indices
        const available = data
            .map((_, i) => i)
            .filter(i => {
                const a = answers[i];
                if (i === currentIndex) return false;
                if (a?.correctCount >= 6) return false;
                if (a?.correct && a.lastPassNumber !== undefined && passCount - a.lastPassNumber < 100)
                    return false;
                return true;
            });

        // If all are excluded, fall back to any except current
        const pool = available.length > 0
            ? available
            : data.map((_, i) => i).filter(i => i !== currentIndex);

        // Pick random from pool
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const handleNext = async () => {
        if (selectedWord && !isChecked) {
            const isCorrect = handleCheck();
            const msgForm = await App.instance?.showMsg(
                ex.sentence + ":\n\n" +
                (isCorrect ? "Richtig! 👍" : `Falsch! Die richtige Antwort ist: ${answer}`),
                isCorrect ? "success" : "error"
            );
            if (msgForm) {
                setTimeout(() => {
                    msgForm.closeDialog()
                }, 2000);
            }
        }
        // Proceed to next exercise
        setPassCount((prev: number) => prev + 1);
        const nextIndex = getRandomIndex();
        setCurrentIndex(nextIndex);
        // Shuffle words for the next question
        setShuffledWords([...data[nextIndex].words].sort(() => Math.random() - 0.5));
        setSelectedWord("");
        setIsChecked(false);
    };

    const ex = data[currentIndex];
    // Initialize shuffled words if empty (first render)
    React.useEffect(() => {
        if (shuffledWords.length === 0) {
            setShuffledWords([...ex.words].sort(() => Math.random() - 0.5));
        }
    }, [ex.words, shuffledWords.length]);

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

    // Handle check when selectedWord changes
    React.useEffect(() => {
        if (selectedWord && !isChecked) {
            handleCheck();
        }
    }, [selectedWord]); // Only run when selectedWord changes

    const handleCheck = () => {
        setIsChecked(true);
        const isCorrect = selectedWord === answer;
        const newAnswers = {
            ...answers,
            [currentIndex]: {
                correct: isCorrect,
                lastPassNumber: isCorrect ? passCount : undefined,
                correctCount: isCorrect ? (answers[currentIndex]?.correctCount ? answers[currentIndex].correctCount + 1 : 1) : undefined
            }
        };
        setAnswers(newAnswers);
        // Save to cookie after updating
        saveStatsToCookie(newAnswers, passCount);
        return isCorrect;
    };

    const handleReset = async () => {
        // Reset current exercise state
        const ask = await App.instance?.showMsg("Darf ich die Statistik zurücksetzten?", "Question", ["Ok", "Cancel"]);
        await ask?.waitForClose();
        if (ask?.payload["button"] === 0) {
            setIsChecked(false);
            setSelectedWord("");
            // Reset statistics
            setAnswers({});
            setPassCount(0);
            // Shuffle words for the current question
            setShuffledWords([...data[currentIndex].words].sort(() => Math.random() - 0.5));
            // Save empty stats to cookie
            saveStatsToCookie({}, 0);
        }
    };

    const sentenceParts = processSentence(ex.sentence);

    return (
        <div className="exercise-container">
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
            <h3>{ex.key}</h3>
            <div className="word-pool">
                {shuffledWords.map((w, index) => (
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
                <button onClick={handleNext}>Next</button>
                <button onClick={handleReset}>Reset</button>
            </div>
            {selectedWord && selectedWord !== answer ? <div className="error-message">
                Du hast einen Fehler gemacht. Versuch es noch mal.
            </div> : null}

        </div>
    );
};

export default OneWordTrainer;
