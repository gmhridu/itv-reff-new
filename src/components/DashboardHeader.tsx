"use client";

import { ChevronDown, MessageCircle, Bell, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { NotificationPopover } from "./notification-popover";
import { Badge } from "./ui/badge";
import Image from "next/image";

const DashboardHeader = ({ user }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const languages = [
    {
      name: "English",
      flag: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 32 32"
          className="rounded-sm"
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
            d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.657,0,3,1.343,3,3V24Z"
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
  ];

  const currentLanguage = languages.find(
    (lang) => lang.name === selectedLanguage,
  );

  const handleLanguageSelect = (languageName) => {
    setSelectedLanguage(languageName);
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Main Header */}
      <div className="h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Left Section - Language Dropdown */}
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-slate-100 transition-all duration-200 rounded-xl px-3 py-2 text-slate-700 hover:text-slate-900 border border-slate-200/50 hover:border-slate-300/50 shadow-sm hover:shadow-md"
            >
              {currentLanguage?.flag}
              {currentLanguage?.name}
            </Button>
          </div>

          {/* Center Section - Logo */}
          <div className="flex-1 flex justify-center">
            <Image
              src={"/logo.png"}
              alt="ICL Finance Logo"
              width={84}
              height={58}
              priority={true}
            />
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <NotificationPopover user={user} />
            </div>
          </div>
        </div>

        {/* Decorative bottom border */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
      </div>
    </header>
  );
};

export default DashboardHeader;
