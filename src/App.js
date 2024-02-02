
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
// import { BrowserRouter as Router } from 'react-router-dom';
// import "bootstrap/dist/css/bootstrap.min.css";




function App() {
  return (
    <div className="App">
      <Navbar></Navbar>
      <div className="content">
          <Routes>
            <Route path='/' element={<Home></Home>}/>
            <Route path='/karnaugh-maps' element={<Kmap></Kmap>}/>
            {/* <Route path= '/ast' element={<Tree></Tree>}></Route> */}
            <Route path= '/ast' element={<SyntaxTreeD3></SyntaxTreeD3>}></Route>
            <Route path= '/proof-trees' element={<ProofTree></ProofTree>}></Route>
            
          </Routes>
     </div>
    </div>
  );
}

export default App;

