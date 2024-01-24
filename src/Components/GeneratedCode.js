import React from 'react'
// import { CodeBlock } from "react-code-blocks";
import { CopyBlock, atomOneLight } from 'react-code-blocks';
import '/home/el486ug/bachelors-app/src/Pages/index.css'
// import Kmap from './Kmap';
// import { useLocation } from 'react-router-dom';

const  GeneratedCode = ({code,disabled}) => {



  return (
    <CopyBlock
    text={code}
    language='latex'
    showLineNumbers={true}
    theme={atomOneLight}
    disabled={disabled}
    codeBlock
    
  />
    // <CodeBlock
    //   text={code}
    //   language='javascript'
    //   showLineNumbers={true}
    //   theme='atom-one-dark'
    // />
  )
}

export default GeneratedCode