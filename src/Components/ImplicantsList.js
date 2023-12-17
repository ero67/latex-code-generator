// ImplicantsList.js
import React from 'react';
import './ImplicantsList.css'; 
const ImplicantsList = ({ implicants }) => {
  return (
    <div className="implicants-list-container">
      <h3>Implicants:</h3>
      <ul className="implicants-list">
        {implicants.map((implicant, index) => (
          <li className="implicant-item" key={index}>{`Implicant ${index + 1}: ${implicant.join(', ')}`}</li>
        ))}
      </ul>
    </div>
  );
};

export default ImplicantsList;

// ImplicantsList.js
// import React from 'react';
// import './ImplicantsList.css'; // Import a CSS file for styling

// const ImplicantsList = ({ implicants, onImplicantHover }) => {
//   return (
//     <div className="implicants-list-container">
//       <h3>Implicants:</h3>
//       <ul className="implicants-list">
//         {implicants.map((implicant, index) => (
//           <li
//             key={index}
//             onMouseEnter={() => onImplicantHover(implicant)}
//             onMouseLeave={() => onImplicantHover(null)}
//             className="implicant-item"
//           >{`Implicant ${index + 1}: ${implicant.join(', ')}`}</li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default ImplicantsList;
