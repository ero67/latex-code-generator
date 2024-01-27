import React from 'react';
import './ImplicantsList.css'; 

const Instructions = () => {
    return (
        <div className="containerText">
            <p id="question" style={{ fontWeight: 'bold' }}>How to use?</p>
            <p>1. Choose dimensions of the map</p>
            <p>2. Fill the map with values</p>
            <p>3. After pressing submit, mark the needed implicants</p>
            
            <p id="question2" style={{ fontWeight: 'bold' }}>How to mark implicants?</p>
            <p>- If marking a rectangular implicant, click the upper left corner and bottom right corner of desired implicant</p>
            <p>- If marking a implicant in single row or column click the beginning and the end of the implicant</p>
            <p>- If marking an edge implicant, click the corresponding cells on edge.</p>
        </div>
    );
};

export default Instructions;
