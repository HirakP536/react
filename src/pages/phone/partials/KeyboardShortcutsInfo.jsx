import { useState } from "react";
import { BiKeyboard } from "react-icons/bi";
import { IoClose } from "react-icons/io5";

const KeyboardShortcutsInfo = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { action: "Answer Call", keys: "Ctrl + A" },
    { action: "End Call", keys: "Ctrl + E" },
    { action: "Mute/Unmute", keys: "Ctrl + Shift + M" },
    { action: "Decline Call", keys: "Ctrl + D" },
    { action: "Attended Transfer", keys: "Ctrl + Shift + A" },
    { action: "Blind Transfer", keys: "Ctrl + Shift + B" },
    { action: "Hold Call", keys: "Ctrl + Shift + H" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-gray-600 hover:text-blue-500"
        title="Keyboard Shortcuts"
      >
        <BiKeyboard size={24} />
        <span className="text-xs ml-1">Shortcuts</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 bg-white shadow-lg rounded-lg p-4 w-72 z-50">
          <div className="flex justify-between items-center mb-2 border-b pb-2">
            <h3 className="font-semibold">Keyboard Shortcuts</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <IoClose size={20} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {shortcuts.map((shortcut, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="py-1.5 px-2">{shortcut.action}</td>
                    <td className="py-1.5 px-2 text-right">
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                        {shortcut.keys}
                      </kbd>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardShortcutsInfo;
