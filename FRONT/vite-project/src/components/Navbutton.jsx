import React from "react";
import { useNavigate } from "react-router-dom";

const NavButton = ({ to, children, ariaLabel }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
  };

  return (
    <button
      onClick={handleClick}
      className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition transform hover:scale-[1.05]"
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default NavButton;
