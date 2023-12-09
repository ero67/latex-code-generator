import { Link } from 'react-router-dom';
import { FaTableCells } from "react-icons/fa6";
import { CiMenuBurger } from "react-icons/ci";
import { AiFillDribbbleCircle } from "react-icons/ai";
import './index.css'
import { BsTreeFill } from "react-icons/bs";
import { BsTree } from "react-icons/bs";
import { FaHome } from "react-icons/fa";
const Navbar = () => {

    const clickActiveSidebar = () =>{
        let sidebar = document.querySelector(".sidebar")
        sidebar.classList.toggle("active");
        console.log("heloo")
    }

    return (  
        <div className="sidebar">
            <div className="top">
                <div className="logo">
                
                   <i><img src="/Uni_kosice_logo.png" alt="photome" className="tuke_logo"></img></i> 
                    <span className="bold"> LaTeX Generator</span>
                </div>
                 <CiMenuBurger id="btn" onClick={clickActiveSidebar} /> 
            </div>


            <div className="user">
                <img src="image.jpg" alt="photome" class="user-img"></img>
                <div>
                    <p className="bold">Erik L.</p>
                    <p>Admin</p>
                </div>
            </div>


            <ul>
                <li>
                    <Link to="/">
                        <i><FaHome /></i>
                        <span className="nav-item">Domov</span>
                        <span className="tooltip">Domov</span>
                    </Link>
                </li>
                <li>
                    <a href='/karnaugh-map'>
                        <i><FaTableCells /></i>
                        <span className="nav-item">KM</span>
                    </a>
                    <span className="tooltip">KM</span>
                </li>
                <li>
                    <a href="/">
                        <i><BsTreeFill /></i>
                        <span className="nav-item">AST</span>
                    </a>
                    <span className="tooltip">EasterChlieb</span>
                </li>

                <li>
                    <a href="https://www.google.com/">
                        <i><BsTree /></i>
                        <span className="nav-item">PT</span>
                    </a>
                    <span className="tooltip">KM</span>
                </li>
            </ul>
        </div>
    );
}
 
export default Navbar;
