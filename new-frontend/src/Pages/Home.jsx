import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mb-8">LaTeX Generator</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Karnaugh Maps</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Build your desired Karnaugh map, fill in values, mark implicants, and generate LaTeX code.
          </p>
          <Link to="/karnaugh-maps">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              Go to Karnaugh Maps
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Abstract Syntax Trees</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Interactively build tree structures and generate LaTeX code for your document.
          </p>
          <Link to="/ast">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              Go to ASTs
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Proof Trees</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Build proof tree structures and generate LaTeX code. Use "\" for special characters in nodes.
          </p>
          <Link to="/proof-trees">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              Go to Proof Trees
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Finite State Automata</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Design and visualize finite state automata: add states, mark start/accepting, and draw labeled transitions.
          </p>
          <Link to="/finite-state-automata">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              Go to Automata
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Resolution Trees</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Build resolution trees by resolving parent clauses into new clauses until you reach the final \Box.
          </p>
          <Link to="/resolution-trees">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              Go to Resolution Trees
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Image to LaTeX</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Upload an image and automatically convert it to LaTeX code. Supports all structure types.
          </p>
          <Link to="/image-to-latex">
            <button className="bg-green-500 hover:bg-green-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              Go to Image to LaTeX
            </button>
          </Link>
        </div>
        {user && user.isAdmin && (
          <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Analytics</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              View detailed analytics and metrics. Track pageviews, events, and user behavior with comprehensive charts.
            </p>
            <Link to="/analytics">
              <button className="bg-purple-500 hover:bg-purple-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
                Go to Analytics
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
