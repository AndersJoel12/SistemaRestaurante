import React from "react";

const Quantity = ({ value = 0, onIncrease, onDecrease, disabled = false }) => {
  const canDecrease = !disabled && value > 0;

  return (
    <div className="flex justify-center space-x-2 mt-auto pt-2">
      <button
        onClick={onDecrease}
        disabled={!canDecrease}
        className={`p-2 w-full rounded-lg font-extrabold text-xl
                    transition-colors active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-yellow-400
                    ${
                      canDecrease
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
      >
        -
      </button>

      <button
        onClick={onIncrease}
        className="p-2 w-full bg-red-700 text-yellow-400 hover:bg-red-600 rounded-lg font-extrabold text-xl
                  transition-colors active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        +
      </button>
    </div>
  );
};

export default Quantity;
