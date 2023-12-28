import React from 'react';
import './ImplicantsList.css'; 
const EdgeImplicantList = ({ edgeImplicants }) => {
  return (
    <div className="implicants-list-container">
      <h3>Edge Implicants:</h3>
      <ul className="implicants-list">
        {edgeImplicants.map((implicant, index) => (
          <li className="implicant-item" key={index}>{`Implicant ${index + 1}: ${implicant.join(', ')}`}</li>
        ))}
      </ul>
    </div>
  );
};

export default EdgeImplicantList;