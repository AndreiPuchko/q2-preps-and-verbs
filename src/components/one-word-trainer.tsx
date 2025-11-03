import React from "react";
import "./one-word-trainer.css"


type WordEntry = {
    key: string;
    sentence: string;
    words: [string, ...string[]]; // tuple with at least one string
};


interface OneWordTrainerData {
    data: WordEntry[];
}

export const OneWordTrainer: React.FC<OneWordTrainerData> = ({ data }) => {
    const ex = data[0];
    const [selectedWord, setSelectedWord] = React.useState<string>("");
    const [isChecked, setIsChecked] = React.useState(false);
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
    };

    const handleReset = () => {
        setIsChecked(false);
        setSelectedWord("");
    };
    
    const sentenceParts = processSentence(ex.sentence);
    
    return (
        <div className="exercise-container">
            <h2>{ex.key}</h2>
            <div className="sentence">
                {sentenceParts.map((part, index) => 
                    part.isBlank ? 
                        <div 
                            key={index} 
                            className={`blank ${
                                isChecked ? 
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
                {ex.words.map((w, index) => (
                    <div 
                        key={index} 
                        className="word" 
                        onClick={() => handleWordClick(w)}
                    >
                        {w}
                    </div>
                ))}
            </div>
            <div className="buttons">
                <button onClick={handleCheck}>Check</button>
                <button>Next</button>
                <button onClick={handleReset}>Reset</button>
            </div>

        </div>
    );
};

export default OneWordTrainer;
