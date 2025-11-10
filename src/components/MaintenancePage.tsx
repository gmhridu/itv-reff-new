"use client";
import React from "react";
import { motion } from "framer-motion";
import { WrenchIcon } from "lucide-react"; // you can replace with your own logo
import Image from "next/image";

const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-6">
      {/* LOGO */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 flex items-center space-x-2"
      >
        {/* Replace this with your logo */}
        {/* <WrenchIcon className="w-10 h-10 text-blue-600" /> */}
        <Image
          src={"/logo.png"}
          width={100}
          height={100}
          alt="Logo"
          priority={true}
        />
        <span className="text-2xl font-bold text-gray-900 tracking-tight">
          ICL FINANCE
        </span>
      </motion.div>

      {/* MAIN CONTENT */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-lg w-full text-center space-y-6"
      >
        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900">
          We’re Improving Your Experience
        </h1>

        <p className="text-base md:text-lg text-gray-600 leading-relaxed">
          Our website is currently undergoing scheduled maintenance. We’re
          working hard to make things better and will be back shortly.
        </p>

        {/* OPTIONAL COUNTDOWN or INFO */}
        <div className="pt-2">
          <p className="text-sm text-gray-500">
            Estimated back online:{" "}
            <span className="font-medium text-gray-800">Soon</span>
          </p>
        </div>

        {/* CONTACT SUPPORT or BUTTON */}
        {/* <div className="pt-6">
          <a
            href="mailto:support@yourbrand.com"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-sm transition-all duration-200"
          >
            Contact Support
          </a>
        </div> */}
      </motion.div>

      {/* FOOTER */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 text-xs text-gray-400"
      >
        © {new Date().getFullYear()} ICL FINANCE Inc. All rights reserved.
      </motion.footer>
    </div>
  );
};

export default MaintenancePage;
