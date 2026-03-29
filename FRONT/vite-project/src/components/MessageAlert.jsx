import React from "react";

const MessageAlert = ({ msg }) => {
  if (!msg) return null;
  const color =
    msg.type === "error"
      ? "bg-red-100 text-red-800 border-red-400"
      : msg.type === "warning"
      ? "bg-yellow-100 text-yellow-800 border-yellow-400"
      : "bg-green-100 text-green-800 border-green-400";
  return (
    <div className={`p-3 mb-4 rounded ${color} font-medium border-l-4`}>
      {msg.text}
    </div>
   );
};

export default MessageAlert;