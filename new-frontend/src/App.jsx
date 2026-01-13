// src/App.jsx
import Navbar from "./Components/Navbar/Navbar";
import Home from "./Pages/Home";
import Kmap from "./Pages/KarnaughMap/KarnaughMap";
import ProofTree from "./Pages/ProofTrees/ProofTree";
import { Route, Routes } from "react-router-dom";
import SyntaxTreeD3 from "./Pages/AbstractSyntaxTrees/AST";
import ASTSelection from "./Pages/AbstractSyntaxTrees/ASTSelection";
import LoginForm from "./Pages/AuthForms/LoginForm";
import RegisterForm from "./Pages/AuthForms/RegisterForm";
import SSOCallback from "./Pages/AuthForms/SSOCallback";
import { AuthProvider } from "./context/AuthContext.jsx";
import KarnaughMapSelection from "./Pages/KarnaughMap/KarnaughMapSelection.jsx";
import ProofTreeSelection from "./Pages/ProofTrees/ProofTreeSelection";
import Analytics from "./Pages/Analytics";
import ImageToLatex from "./Pages/ImageToLatex/ImageToLatex";
import UserProfile from "./Pages/UserProfile";
import ProtectedRoute from "./Components/ProtectedRoute";
import ResolutionTree from "./Pages/ResolutionTrees/ResolutionTree";
import FiniteStateAutomata from "./Pages/FiniteStateAutomata/FiniteStateAutomata";
import FiniteStateAutomataSelection from "./Pages/FiniteStateAutomata/FiniteStateAutomataSelection";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

// Your original App component
function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <Navbar />
        <main className="flex-1 min-w-0 pt-14 md:pt-0">
          <div className="p-4 md:p-6">
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
            <Route
              path="/resolution-trees"
              element={<ResolutionTree></ResolutionTree>}
            ></Route>
            <Route
              path="/finite-state-automata"
              element={<FiniteStateAutomataSelection />}
            />
            <Route
              path="/finite-state-automata/create"
              element={<FiniteStateAutomata />}
            />
            <Route
              path="/finite-state-automata/edit/:id"
              element={<FiniteStateAutomata />}
            />
            <Route path="/login" element={<LoginForm></LoginForm>}></Route>
            <Route
              path="/register"
              element={<RegisterForm></RegisterForm>}
            ></Route>
            <Route
              path="/auth/callback"
              element={<SSOCallback></SSOCallback>}
            ></Route>
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/image-to-latex" element={<ImageToLatex />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
          </Routes>
          </div>
        </main>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </AuthProvider>
  );
}

export default App;
