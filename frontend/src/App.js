import Navbar from "./Components/Navbar/Navbar";
import Home from "./Pages/Home";
import Kmap from "./Pages/KarnaughMap";
import ProofTree from "./Pages/ProofTree";
import { Route, Routes } from "react-router-dom";
import SyntaxTreeD3 from "./Pages/AST";
import LoginForm from "./Pages/LoginForm";
import RegisterForm from "./Pages/RegisterForm";
import { AuthProvider } from "./context/AuthContext";
import KarnaughMapSelection from "./Pages/KarnaughMapSelection";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar></Navbar>
        <div className="content">
          <Routes>
            <Route path="/" element={<Home></Home>} />
            <Route
              path="/karnaugh-maps"
              element={<KarnaughMapSelection></KarnaughMapSelection>}
            />
            <Route path="/karnaugh-maps/create" element={<Kmap></Kmap>}></Route>
            <Route path="/karnaugh-maps/edit" element={<Kmap></Kmap>}></Route>

            <Route path="/ast" element={<SyntaxTreeD3></SyntaxTreeD3>}></Route>
            <Route
              path="/proof-trees"
              element={<ProofTree></ProofTree>}
            ></Route>
            <Route path="/login" element={<LoginForm></LoginForm>}></Route>
            <Route
              path="/register"
              element={<RegisterForm></RegisterForm>}
            ></Route>
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
