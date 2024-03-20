import React from 'react';
import './ImplicantsList.css'; 

const ImplicantsList = ({ implicants, onImplicantClick, onRemoveImplicant }) => {
  return (
    <div className="implicants-list-container">
      <h3>Implicants:</h3>
      <ul className="implicants-list">
        {implicants.map((implicant, index) => (
          <li className="implicant-item" key={index} onMouseEnter={() => onImplicantClick(index, "default")} onMouseLeave={() => onImplicantClick(null, "default")}>
            {`Implicant ${index + 1}: ${implicant.join(', ')}`}
            <button onClick={() => onRemoveImplicant(index)} className="remove-implicant-btn">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ImplicantsList;



// ImplicantsList.js
// import React from 'react';
// import './ImplicantsList.css'; 


// const ImplicantsList = ({ implicants, onImplicantClick }) => {
//   return (
//     <div className="implicants-list-container">
//       <h3>Implicants:</h3>
//       <ul className="implicants-list">
//         {implicants.map((implicant, index) => (
//           <li className="implicant-item" key={index} onMouseEnter={() => onImplicantClick(index,"default")} onMouseLeave={() => onImplicantClick(null,"default")}>
//             {`Implicant ${index + 1}: ${implicant.join(', ')}`}
//             {/* {`Implicant ${index + 1}: ${implicant[index].row },${implicant[index].col}`} */}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default ImplicantsList;

