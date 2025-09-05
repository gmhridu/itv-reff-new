"use client"

import { ChevronDown, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

const DashboardHeader = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const languages = [
    {
      name: "English",
      flag: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 32 32"
        >
          <rect
            x="1"
            y="4"
            width="30"
            height="24"
            rx="4"
            ry="4"
            fill="#071b65"
          ></rect>
          <path
            d="M5.101,4h-.101c-1.981,0-3.615,1.444-3.933,3.334L26.899,28h.101c1.981,0,3.615-1.444,3.933-3.334L5.101,4Z"
            fill="#fff"
          ></path>
          <path
            d="M22.25,19h-2.5l9.934,7.947c.387-.353,.704-.777,.929-1.257l-8.363-6.691Z"
            fill="#b92932"
          ></path>
          <path
            d="M1.387,6.309l8.363,6.691h2.5L2.316,5.053c-.387,.353-.704,.777-.929,1.257Z"
            fill="#b92932"
          ></path>
          <path
            d="M5,28h.101L30.933,7.334c-.318-1.891-1.952-3.334-3.933-3.334h-.101L1.067,24.666c.318,1.891,1.952,3.334,3.933,3.334Z"
            fill="#fff"
          ></path>
          <rect x="13" y="4" width="6" height="24" fill="#fff"></rect>
          <rect x="1" y="13" width="30" height="6" fill="#fff"></rect>
          <rect x="14" y="4" width="4" height="24" fill="#b92932"></rect>
          <rect
            x="14"
            y="1"
            width="4"
            height="30"
            transform="translate(32) rotate(90)"
            fill="#b92932"
          ></rect>
          <path
            d="M28.222,4.21l-9.222,7.376v1.414h.75l9.943-7.94c-.419-.384-.918-.671-1.471-.85Z"
            fill="#b92932"
          ></path>
          <path
            d="M2.328,26.957c.414,.374,.904,.656,1.447,.832l9.225-7.38v-1.408h-.75L2.328,26.957Z"
            fill="#b92932"
          ></path>
          <path
            d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
            opacity=".15"
          ></path>
          <path
            d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
            fill="#fff"
            opacity=".2"
          ></path>
        </svg>
      ),
    },
    {
      name: "Urdu",
      flag: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 32 32"
        >
          <rect
            x="1"
            y="4"
            width="30"
            height="24"
            rx="4"
            ry="4"
            fill="#173e1b"
          ></rect>
          <path
            d="M10,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4h5V4Z"
            fill="#fff"
          ></path>
          <path
            d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
            opacity=".15"
          ></path>
          <path
            d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
            fill="#fff"
            opacity=".2"
          ></path>
          <path
            d="M26.268,19.09c-2.692,2.393-6.815,2.151-9.209-.542-2.393-2.692-2.151-6.815,.542-9.209,.113-.1,.229-.196,.346-.287-2.87,.917-4.948,3.605-4.948,6.779,0,3.93,3.186,7.116,7.116,7.116,2.878,0,5.357-1.709,6.478-4.168-.104,.106-.213,.21-.326,.311Z"
            fill="#fff"
          ></path>
          <path
            fill="#fff"
            d="M22.984 13.282L23.153 14.997 24.024 13.51 25.708 13.879 24.563 12.591 25.434 11.104 23.855 11.795 22.71 10.507 22.88 12.222 21.301 12.913 22.984 13.282z"
          ></path>
        </svg>
      ),
    },
  ];

  const currentLanguage = languages.find(
    (lang) => lang.name === selectedLanguage
  );

  const handleLanguageSelect = (languageName) => {
    setSelectedLanguage(languageName);
    setIsDropdownOpen(false);
  };

  return (
    <header className="h-[48px] bg-black/70 text-white">
      <div className="flex items-center justify-between p-2">
        {/* Language Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 hover:bg-white/10"
          >
            {currentLanguage?.flag}
            <span className="text-sm font-medium">{selectedLanguage}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </Button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 min-w-[120px]">
              {languages.map((language) => (
                <button
                  key={language.name}
                  onClick={() => handleLanguageSelect(language.name)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 transition-colors first:rounded-t-md last:rounded-b-md ${
                    selectedLanguage === language.name ? "bg-gray-700" : ""
                  }`}
                >
                  {language.flag}
                  <span className="text-sm">{language.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <h1 className="text-lg font-semibold text-center flex-1">iTV</h1>

        <div>
          <Button size="icon" variant="ghost">
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
