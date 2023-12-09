// sdasdasdasdas?
import Navbar from './Navbar';
import Home from './Home'
import Kmap from './Kmap'
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
            <Route path='/karnaugh-map' element={<Kmap></Kmap>}/>
            {/* <Route path='/ast' element={<Tree></Tree>}/> */}
          </Routes>
     </div>
    </div>
  );
}

export default App;

