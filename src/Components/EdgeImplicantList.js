import React from 'react';
import './ImplicantsList.css'; 


const EdgeImplicantList = ({ edgeImplicants,onImplicantClick,onRemoveEdgeImplicant,isEightEdgeImplicant,changeDirectionofEdgeImplicant }) => {
  return (
    <div className="implicants-list-container">
      <h3>Edge Implicants:</h3>
      <ul className="implicants-list">
        {edgeImplicants.map((implicant, index) => (
          <li className="implicant-item" key={index} onMouseEnter={() => onImplicantClick(index,"edge")} onMouseLeave={() => onImplicantClick(null,"edge")}>
          {`Implicant ${index + 1}: ${implicant.join(', ')}`}
          {/* <button disabled={isEightEdgeImplicant} onClick={() => changeDirectionofEdgeImplicant(false)} className="remove-implicant-btn">{isEightEdgeImplicant ? "Set Vertical" : "Set Horizontal"}</button> */}
          <button onClick={() => onRemoveEdgeImplicant(index)} className="remove-implicant-btn">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EdgeImplicantList;