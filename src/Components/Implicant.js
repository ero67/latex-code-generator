import React from 'react';

function Implicant({top, right, bottom, left, color}) {
  return (
    <div className="implicant" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      border: `5px solid ${color}`,
      clipPath: `rect(${top}px, ${right}px, ${bottom}px, ${left}px)`
    }}></div>
  );
}

export default Implicant;
