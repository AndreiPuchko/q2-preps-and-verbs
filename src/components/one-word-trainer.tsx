import React, { useEffect, useRef, useState } from "react";


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
            <div>{ex.key}</div>
            <div className="sentence">
                {ex.sentence}
            </div>
            <div className="word-pool" >
                {ex.words.map((w) => {
                    return <div>{w}</div>
                })}
            </div>
        </div>
    );
};

export default OneWordTrainer;
