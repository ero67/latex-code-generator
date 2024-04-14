
import Navbar from './Components/Navbar/Navbar';
// import Navbar from './Navbar';
// import GeneratedCode from './Pages/GeneratedCode';
import Home from './Pages/Home'
import Kmap from './Pages/KarnaughMap'
// import Tree from './Pages/Tree'
// import SyntaxTree from './Components/AST/SyntaxTree';
// import AbstractTree from './Pages/AbstractTree';
import ProofTree from './Pages/ProofTree';
import {Route, Routes} from 'react-router-dom';
import SyntaxTreeD3 from './Pages/AST';




function App() {
  return (
    <div className="App">
      <Navbar></Navbar>
      <div className="content">
          <Routes>
            <Route path='/latex-code-generator' element={<Home></Home>}/>
            <Route path='/latex-code-generator/karnaugh-maps' element={<Kmap></Kmap>}/>
            {/* <Route path= '/ast' element={<Tree></Tree>}></Route> */}
            <Route path= '/latex-code-generator/ast' element={<SyntaxTreeD3></SyntaxTreeD3>}></Route>
            <Route path= '/latex-code-generator/proof-trees' element={<ProofTree></ProofTree>}></Route>
            
          </Routes>
     </div>
    </div>
  );
}

export default App;

