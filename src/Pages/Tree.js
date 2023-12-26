import React, { useState } from 'react'
import './index.css'
import strom from "./images/fulltree.png"
import emptystrom from "./images/emptytree.png"
import GeneratedCode from './GeneratedCode'
function Tree() {

  const [image, setImage] = useState(emptystrom);
  const [generatedCode, setGeneratedCode]= useState("");


  const handleClick = () =>{
    setImage(strom);
  };

  const handleGenerateClick = () =>{
    setGeneratedCode("\\usepackage{forest}\n    \\begin{document}\n    \\begin{forest}\n        [ $ \\neg x1 $\n             [ $\\wedge x2 $\n                 [p]\n                 [ $ \\vee x3$        \n                    [q] \n                    [$ \\neg x4 $\n                  [r]\n                  ]\n                ]\n       ]\n          \\end{forest}\n\\end{document}\n");

  };

  return (
	<div className='ast'>
    <h1 id='asth1' style={{placeSelf: "center"}}>Abstract syntax trees</h1>
    <div className="settings">
            {/* <div className="tableSize"> */}
                {/* <label htmlFor="tableSize" disabled={disabled}>Select Table Size: </label> */}
                <select id="tableSize" >
                    <option value="0x0">Select formula</option>
                    <option value="2x1">\phi = \neg (p \and (q \or \neg r))</option>
                    <option value="2x2">\phi = \neg p \and r \impl q\or s</option>
                    <option value="2x4">\phi p \and q \or r</option>
                </select>
            {/* </div> */}
            <div className='Buttons'>
                
                <button id="submitBtn" onClick={handleClick}>Generate Tree</button>
                
                 {/* <button id="submitBtn" onClick={()=>generateCodeLaTeX()} disabled={!disabled}>Generate code </button> */}
                
            </div>
        </div>
    <img id="fulltree" src={image} alt='logo' style={{border: "1px solid black"}} />
    <button id="generateBtn" onClick={handleGenerateClick} >Generate code </button>
    <GeneratedCode id="generatedCode" code={generatedCode}>
              </GeneratedCode>
  </div>
  )
}

export default Tree