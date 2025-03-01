import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mb-8">LaTeX Generator</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Karnaugh Maps</h2>
          <p className="mb-4">
            This part of the application lets you build your desired Karnaugh
            map, fill in the values, mark implicants, and finally generate LaTeX
            code for your Karnaugh map so you can use it in your document.
          </p>
          <Link to="/karnaugh-maps">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded w-full">
              Go to Karnaugh Maps
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Abstract Syntax Trees</h2>
          <p className="mb-4">
            This part of the application lets you interactively build tree
            structures and generate LaTeX code for the same structure so you can
            use it in your document.
          </p>
          <Link to="/ast">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded w-full">
              Go to ASTs
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Proof Trees</h2>
          <p className="mb-4">
            This part of the application lets you interactively build a proof
            tree structure and generate LaTeX code for it. It also allows you to
            use "\" for special characters in the values of the nodes.
          </p>
          <Link to="/proof-trees">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded w-full">
              Go to Proof Trees
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
