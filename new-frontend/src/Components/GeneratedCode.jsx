import { CopyBlock, atomOneLight } from "react-code-blocks";
// import "../Pages/index.css";

const GeneratedCode = ({ code, disabled }) => {
  return (
    <CopyBlock
      text={code}
      language="latex"
      showLineNumbers={true}
      theme={atomOneLight}
      disabled={disabled}
      codeBlock
    />
  );
};

export default GeneratedCode;
