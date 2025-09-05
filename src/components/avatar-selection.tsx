"use client";
import React, { useState } from "react";
import { User } from "lucide-react";

interface AvatarSelectionProps {
  currentAvatar?: string;
  onAvatarSelect: (avatarUrl: string) => void;
}

const AvatarSelection = ({ currentAvatar, onAvatarSelect }: AvatarSelectionProps) => {
  // Generate avatar options using different seeds
  const avatarOptions = [
    { id: 1, name: "Avatar 1", url: "https://ui-avatars.com/api/?name=User1&background=6366f1&color=fff&size=128" },
    { id: 2, name: "Avatar 2", url: "https://ui-avatars.com/api/?name=User2&background=8b5cf6&color=fff&size=128" },
    { id: 3, name: "Avatar 3", url: "https://ui-avatars.com/api/?name=User3&background=ec4899&color=fff&size=128" },
    { id: 4, name: "Avatar 4", url: "https://ui-avatars.com/api/?name=User4&background=10b981&color=fff&size=128" },
    { id: 5, name: "Avatar 5", url: "https://ui-avatars.com/api/?name=User5&background=3b82f6&color=fff&size=128" },
    { id: 6, name: "Avatar 6", url: "https://ui-avatars.com/api/?name=User6&background=f59e0b&color=fff&size=128" },
    { id: 7, name: "Avatar 7", url: "https://ui-avatars.com/api/?name=User7&background=ef4444&color=fff&size=128" },
    { id: 8, name: "Avatar 8", url: "https://ui-avatars.com/api/?name=User8&background=06b6d4&color=fff&size=128" },
    { id: 9, name: "Avatar 9", url: "https://ui-avatars.com/api/?name=User9&background=84cc16&color=fff&size=128" },
    { id: 10, name: "Avatar 10", url: "https://ui-avatars.com/api/?name=User10&background=a855f7&color=fff&size=128" },
    { id: 11, name: "Avatar 11", url: "https://ui-avatars.com/api/?name=User11&background=f97316&color=fff&size=128" },
    { id: 12, name: "Avatar 12", url: "https://ui-avatars.com/api/?name=User12&background=0ea5e9&color=fff&size=128" },
  ];

  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || "");

  const handleAvatarClick = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    onAvatarSelect(avatarUrl);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium text-center mb-4">Change head portrait</h3>
      <div className="grid grid-cols-4 gap-4">
        {avatarOptions.map((avatar) => (
          <div
            key={avatar.id}
            className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-all ${
              selectedAvatar === avatar.url
                ? "bg-indigo-100 border-2 border-indigo-500"
                : "hover:bg-gray-100"
            }`}
            onClick={() => handleAvatarClick(avatar.url)}
          >
            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200">
              <img
                src={avatar.url}
                alt={avatar.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvatarSelection;
