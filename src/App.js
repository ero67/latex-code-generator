
import Navbar from './Components/Navbar/Navbar';
import Home from './Pages/Home'
import Kmap from './Pages/Kmap'
// Bootstrap CSS
// import "bootstrap/dist/css/bootstrap.min.css";
// // Bootstrap Bundle JS
// import "bootstrap/dist/js/bootstrap.bundle.min";


// import Tree from './Tree'
// import ReactDOM from 'react-dom';
// import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import {Route, Routes} from 'react-router-dom';
import { BrowserRouter as Router } from 'react-router-dom';
// import Implicant from "./Components/Implicant"

function App() {
  return (
    <div className="App">
      <Navbar></Navbar>
      <div className="content">
          <Routes>
            <Route path='/' element={<Home></Home>}/>
            <Route path='/karnaughove-mapy' element={<Kmap></Kmap>}/>
            {/* <Route path='/ast' element={<Tree></Tree>}/> */}
          </Routes>
     </div>
    </div>
  );
}

export default App;

