import Navbar from "./Components/Navbar/Navbar";
import Home from "./Pages/Home";
import Kmap from "./Pages/KarnaughMap/KarnaughMap";
import ProofTree from "./Pages/ProofTrees/ProofTree";
import { Route, Routes } from "react-router-dom";
import SyntaxTreeD3 from "./Pages/AbstractSyntaxTrees/AST";
import ASTSelection from "./Pages/AbstractSyntaxTrees/ASTSelection";
import LoginForm from "./Pages/AuthForms/LoginForm";
import RegisterForm from "./Pages/AuthForms/RegisterForm";
import { AuthProvider } from "./context/AuthContext";
import KarnaughMapSelection from "./Pages/KarnaughMap/KarnaughMapSelection";
import ProofTreeSelection from "./Pages/ProofTrees/ProofTreeSelection";
import Analytics from "./Pages/Analytics";
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
            <Route
              path="/karnaugh-maps/edit/:id"
              element={<Kmap></Kmap>}
            ></Route>

            <Route path="/ast" element={<ASTSelection></ASTSelection>}></Route>
            <Route
              path="/ast/create"
              element={<SyntaxTreeD3></SyntaxTreeD3>}
            ></Route>
            <Route
              path="/ast/edit/:id"
              element={<SyntaxTreeD3></SyntaxTreeD3>}
            ></Route>
            <Route
              path="/proof-trees"
              element={<ProofTreeSelection></ProofTreeSelection>}
            ></Route>
            <Route
              path="/proof-trees/create"
              element={<ProofTree></ProofTree>}
            ></Route>
            <Route
              path="/proof-trees/edit/:id"
              element={<ProofTree></ProofTree>}
            ></Route>
            <Route path="/login" element={<LoginForm></LoginForm>}></Route>
            <Route
              path="/register"
              element={<RegisterForm></RegisterForm>}
            ></Route>
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
