"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { AvatarSelector } from "../ui/avatar-selector";
import { Button } from "../ui/button";
import { User, Settings, Info } from "lucide-react";

/**
 * Example component demonstrating how to use the reusable Modal and AvatarSelector components
 */
export const ModalUsageExamples: React.FC = () => {
  // States for different modal examples
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    "https://images.unsplash.com/photo-1494790108755-2616b332c6d7?w=80&h=80&fit=crop&crop=face"
  );

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    console.log("New avatar selected:", avatarUrl);
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Reusable Modal Components Examples
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Modal Example */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Basic Modal</h3>
          <p className="text-gray-600 mb-4">
            Simple modal with custom content and title.
          </p>
          <Button onClick={() => setIsBasicModalOpen(true)}>
            <Info className="w-4 h-4 mr-2" />
            Open Basic Modal
          </Button>
        </div>

        {/* Avatar Selector Example */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Avatar Selector</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-200">
              <img
                src={selectedAvatar}
                alt="Selected avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-gray-600">Current avatar</p>
          </div>
          <Button onClick={() => setIsAvatarModalOpen(true)}>
            <User className="w-4 h-4 mr-2" />
            Change Avatar
          </Button>
        </div>

        {/* Settings Modal Example */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Settings Modal</h3>
          <p className="text-gray-600 mb-4">
            Modal with form content and custom size.
          </p>
          <Button onClick={() => setIsSettingsModalOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Open Settings
          </Button>
        </div>
      </div>

      {/* Basic Modal */}
      <Modal
        isOpen={isBasicModalOpen}
        onClose={() => setIsBasicModalOpen(false)}
        title="Information"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            This is a basic modal example using the reusable Modal component.
          </p>
          <p className="text-gray-700">
            You can customize the size, title, and content as needed.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsBasicModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsBasicModalOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={handleAvatarSelect}
        selectedAvatar={selectedAvatar}
        title="Choose Your Avatar"
      />

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Settings"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your display name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Notifications
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-700">Marketing emails</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-700">Security alerts</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsSettingsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsSettingsModalOpen(false)}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModalUsageExamples;
