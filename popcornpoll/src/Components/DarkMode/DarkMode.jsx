import React , { useState, useEffect } from "react";

import "./DarkMode.css";
import Sun from "../../assets/Sun.svg";
import Moon from "../../assets/Moon.svg";

const DarkMode = () => {
    const[theme,setTheme]=useState(localStorage.getItem("selectedTheme")||"dark");
    useEffect(()=>{
        document.body.setAttribute("data-theme",theme);
        localStorage.setItem("selectedTheme",theme);
    },[theme]);
    const toggleTheme=(e)=>{
        setTheme(e.target.checked?"dark":"light");
    }
    return (
        <div className='dark_mode'>
            <input
                className='dark_mode_input'
                type='checkbox'
                id='darkmode-toggle'
                onChange={toggleTheme}
                defaultChecked={theme !== "light"}
            />
            <label className='dark_mode_label' htmlFor='darkmode-toggle'>
                <img src={Sun} className="sun" alt="sun" />
                <img src={Moon} className="moon" alt="moon" />
            </label>
        </div>
    );
};

export default DarkMode;