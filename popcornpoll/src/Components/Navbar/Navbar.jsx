import React from 'react'
import './Navbar.css'
import DarkMode from "../DarkMode/DarkMode"
import logo from "../../assets/popcornpoll.png";
const Navbar =()=>{
    return(
        <nav className='navbar'>
            <div className="logo-title">
                <img src={logo} alt="PopcornPoll logo" className="logo animated-logo"/>
                <h1 className="brand-text">Popcorn<span>Poll</span></h1>
            </div>
            <div className="nav-right"> 
                <DarkMode/>
                <ul className="nav-links">
                    <li className="active"><a href="#top_rated">Top Rated ✨</a></li>
                    <li><a href="#popular">Popular 🔥</a></li>
                    <li><a href="#upcoming">Upcoming 🥳</a></li>
                </ul>
            </div>
        </nav>
    );
}
export default Navbar 