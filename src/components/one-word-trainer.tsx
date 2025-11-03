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
    // console.log(ex)
    return (
        <div className="exercise-container">
            <h2>{ex.key}</h2>
            <div className="sentence">
                {ex.sentence}
            </div>
            <div className="word-pool" >
                {ex.words.map((w) => {
                    return <div className="word">{w}</div>
                })}
            </div>
            <div className="buttons">
                <button>Prüfen</button>
                <button>Zurücksetzen</button>
            </div>

        </div>
    );
};

export default OneWordTrainer;
