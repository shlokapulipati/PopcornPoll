import React from "react";
import { useTheme } from "../../context/ThemeContext";
import "./DarkMode.css";
import Sun from "../../assets/Sun.svg";
import Moon from "../../assets/Moon.svg";

const DarkMode = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="dark_mode">
      <input
        className="dark_mode_input"
        type="checkbox"
        id="darkmode-toggle"
        onChange={toggleTheme}
        checked={theme === "dark"}
      />
      <label className="dark_mode_label" htmlFor="darkmode-toggle">
        <img src={Sun} className="sun" alt="sun" />
        <img src={Moon} className="moon" alt="moon" />
      </label>
    </div>
  );
};

export default DarkMode;