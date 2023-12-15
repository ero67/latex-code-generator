
import Navbar from './Components/Navbar/Navbar';
import GeneratedCode from './Pages/GeneratedCode';
import Home from './Pages/Home'
import Kmap from './Pages/Kmap'

import {Route, Routes} from 'react-router-dom';
// import { BrowserRouter as Router } from 'react-router-dom';
// import "bootstrap/dist/css/bootstrap.min.css";


function App() {
  return (
    <div className="App">
      <Navbar></Navbar>
      <div className="content">
          <Routes>
            <Route path='/' element={<Home></Home>}/>
            <Route path='/karnaughove-mapy' element={<Kmap></Kmap>}/>
            <Route path='/generated-code' element={<GeneratedCode></GeneratedCode>}></Route>
            {/* <Route path='/ast' element={<Tree></Tree>}/> */}
          </Routes>
     </div>
    </div>
  );
}

export default App;

