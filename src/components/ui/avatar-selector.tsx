"use client";

import React, { useState } from "react";
import { Modal } from "./modal";

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  selectedAvatar?: string;
  avatarOptions?: string[];
  title?: string;
}

const defaultAvatarOptions = [
  "https://images.unsplash.com/photo-1494790108755-2616b332c6d7?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1557862921-37829c790f19?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1567532900872-f4e906cbf06a?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=80&h=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face",
];

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedAvatar,
  avatarOptions = defaultAvatarOptions,
  title = "Change head portrait",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarSelect = (avatarUrl: string) => {
    setIsLoading(true);
    onSelect(avatarUrl);

    // Small delay to show the selection feedback, then close
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 300);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="grid grid-cols-5 gap-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-2">
        {avatarOptions.map((avatar, index) => (
          <button
            key={index}
            onClick={() => handleAvatarSelect(avatar)}
            className={`relative w-14 h-14 rounded-full overflow-hidden transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
              selectedAvatar === avatar
                ? "ring-4 ring-indigo-500 scale-105 shadow-lg"
                : "ring-2 ring-gray-200 hover:ring-4 hover:ring-indigo-300 hover:scale-105"
            } ${isLoading ? "pointer-events-none opacity-75" : ""}`}
            disabled={isLoading}
          >
            <img
              src={avatar}
              alt={`Avatar option ${index + 1}`}
              className="w-full h-full object-cover select-none"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=U${
                  index + 1
                }&background=6366f1&color=fff&size=128`;
              }}
              onDragStart={(e) => e.preventDefault()}
            />
            {selectedAvatar === avatar && !isLoading && (
              <div className="absolute inset-0 bg-indigo-600 bg-opacity-20 flex items-center justify-center">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
            {isLoading && selectedAvatar === avatar && (
              <div className="absolute inset-0 bg-indigo-600 bg-opacity-30 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mt-4 text-center">
        Select an avatar to update your profile picture
      </p>
    </Modal>
  );
};

export default AvatarSelector;
