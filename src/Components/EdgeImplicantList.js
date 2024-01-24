import React from 'react';
import './ImplicantsList.css'; 


const EdgeImplicantList = ({ edgeImplicants,onImplicantClick }) => {
  return (
    <div className="implicants-list-container">
      <h3>Edge Implicants:</h3>
      <ul className="implicants-list">
        {edgeImplicants.map((implicant, index) => (
          <li className="implicant-item" key={index} onMouseEnter={() => onImplicantClick(index,"edge")} onMouseLeave={() => onImplicantClick(null,"edge")}>
          {`Implicant ${index + 1}: ${implicant.join(', ')}`}</li>
        ))}
      </ul>
    </div>
  );
};

export default EdgeImplicantList;