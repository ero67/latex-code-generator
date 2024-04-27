import React from 'react';
import './ImplicantsList.css'; 

const Instructions = () => {
    return (
        <div className="containerText">
            <p id="question" style={{ fontWeight: 'bold' }}>How to use?</p>
            <p><b>1.</b> Choose dimensions of the map</p>
            <p><b>2.</b> Fill the map with values</p>
            <p><b>3.</b> After pressing submit, mark the needed implicants</p>
            
            <p id="question2" style={{ fontWeight: 'bold' }}>How to mark implicants?</p>
            <p>- If marking a rectangular implicant, click opposite corners of the rectangle in any order</p>
            <p>- If marking a implicant in single row or column click the beginning and the end of the implicant</p>
            <p>- If marking an edge implicant, click opposite corners of the rectangle of desired implicant.</p>
        </div>
    );
};

export default Instructions;
