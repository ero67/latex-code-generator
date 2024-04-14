import { Link } from "react-router-dom";
import "./index.css";

const Home = () => {
  return (
    <div className="homeMain">
      <h1>LaTeX Generator</h1>
      <div className="home">
        <div className="kmaps" id="kmapsid">
          <span>
            <h2>Karnaugh Maps</h2>
          </span>
          <div>
            This part of application lets you to build your desired karnaugh
            map, fill in the values, mark implicants and finally generate LaTeX
            code for your karnaugh map so you can use it in your document.
          </div>
          <Link to="/latex-code-generator/karnaugh-maps">
      <button id="homePageButton">Go to Karnaugh Maps</button>
    </Link>
        </div>
        <div className="asts" id="astsid">
          <span>
            <h2>Abstract Syntax Trees</h2>
          </span>
          <div>
            This part of the application lets you interactively build tree
            structure and generating LaTeX code for the same structure so you
            can use it in your document.
          </div>
          <Link to="/latex-code-generator/ast">
          <button id="homePageButton">Go to ASTs</button>
    </Link>
        </div>
        <div className="prooftrees" id="prooftreesid">
          <span>
            <h2>Proof Trees</h2>
          </span>
          <div>
            This part of the application lets you interactively build a proof
            tree structure and generate LaTeX code for it . It also allows you
            to use "\" for specials characters in the values of the nodes.{" "}
          </div>
          <Link to="/latex-code-generator/proof-trees">
          <button id="homePageButton">Go to Proof Trees</button>
    </Link>
        
        </div>
      </div>
    </div>
  );
};

export default Home;
