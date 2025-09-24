"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DoingTab } from "./doing-tab";
import { CompletedTasksTab } from "./completed-tasks-tab";
import { AuditTab } from "./audit-tab";

const TaskOverview = () => {
  const [activeTab, setActiveTab] = useState("doing");

  const handleSwitchToDoingTab = () => {
    setActiveTab("doing");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-center">Task List</h1>

      <div className="mt-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-x-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              className="cursor-pointer
            data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full data-[state=active]:shadow-none
            "
              value="doing"
            >
              Doing
            </TabsTrigger>
            <TabsTrigger
              className="cursor-pointer
            data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full data-[state=active]:shadow-none
            "
              value="complete"
            >
              Complete
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doing">
            <DoingTab />
          </TabsContent>

          <TabsContent value="complete">
            <CompletedTasksTab onSwitchToDoingTab={handleSwitchToDoingTab} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TaskOverview;
