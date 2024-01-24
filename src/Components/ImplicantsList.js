// ImplicantsList.js
import React from 'react';
import './ImplicantsList.css'; 


const ImplicantsList = ({ implicants, onImplicantClick }) => {
  return (
    <div className="implicants-list-container">
      <h3>Implicants:</h3>
      <ul className="implicants-list">
        {implicants.map((implicant, index) => (
          <li className="implicant-item" key={index} onMouseEnter={() => onImplicantClick(index,"default")} onMouseLeave={() => onImplicantClick(null,"default")}>
            {`Implicant ${index + 1}: ${implicant.join(', ')}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ImplicantsList;

