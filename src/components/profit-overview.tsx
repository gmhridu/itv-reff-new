import React from "react";
import { Button } from "./ui/button";

const ProfitOverview = () => {
  // Default data if none is provided
  const defaultTableData = {
    headers: [
      "Position level",
      "Job Security Deposit",
      "Number of Tasks",
      "Unit Price",
      "Daily income",
      "Monthly income",
      "Annual income",
    ],
    rows: [
      {
        position: "Intern",
        jobSecurityDeposite: "0",
        numberOfTasks: "5",
        unitPrice: "13",
        dailyIncome: "65",
        monthlyIncome: "---",
        annualIncome: "---",
      },
      {
        position: "L1",
        jobSecurityDeposite: "2,000",
        numberOfTasks: "5",
        unitPrice: "13",
        dailyIncome: "65",
        monthlyIncome: "1,950",
        annualIncome: "23,725",
      },
      {
        position: "L2",
        jobSecurityDeposite: "5,000",
        numberOfTasks: "8",
        unitPrice: "21",
        dailyIncome: "168",
        monthlyIncome: "5,040",
        annualIncome: "61,320",
      },
      {
        position: "L3",
        jobSecurityDeposite: "20,000",
        numberOfTasks: "10",
        unitPrice: "72",
        dailyIncome: "720",
        monthlyIncome: "21,600",
        annualIncome: "262,800",
      },
      {
        position: "L4",
        jobSecurityDeposite: "50,000",
        numberOfTasks: "15",
        unitPrice: "123",
        dailyIncome: "1,845",
        monthlyIncome: "55,350",
        annualIncome: "673,425",
      },
      {
        position: "L5",
        jobSecurityDeposite: "100,000",
        numberOfTasks: "20",
        unitPrice: "192",
        dailyIncome: "3,840",
        monthlyIncome: "115,200",
        annualIncome: "1,401,600",
      },
      {
        position: "L6",
        jobSecurityDeposite: "250,000",
        numberOfTasks: "22",
        unitPrice: "454",
        dailyIncome: "9,988",
        monthlyIncome: "299,640",
        annualIncome: "3,645,620",
      },
      {
        position: "L7",
        jobSecurityDeposite: "500,000",
        numberOfTasks: "25",
        unitPrice: "836",
        dailyIncome: "20,900",
        monthlyIncome: "627,000",
        annualIncome: "7,628,500",
      },
      {
        position: "L8",
        jobSecurityDeposite: "1,000,000",
        numberOfTasks: "27",
        unitPrice: "1,611",
        dailyIncome: "43,497",
        monthlyIncome: "1,304,910",
        annualIncome: "15,876,405",
      },
      {
        position: "L9",
        jobSecurityDeposite: "2,000,000",
        numberOfTasks: "30",
        unitPrice: "3,033",
        dailyIncome: "90,990",
        monthlyIncome: "2,729,700",
        annualIncome: "33,212,850",
      },
      {
        position: "L10",
        jobSecurityDeposite: "4,000,000",
        numberOfTasks: "31",
        unitPrice: "6,129",
        dailyIncome: "189,999",
        monthlyIncome: "5,699,970",
        annualIncome: "69,349,635",
      },
      {
        position: "L11",
        jobSecurityDeposite: "8,000,000",
        numberOfTasks: "32",
        unitPrice: "12,500",
        dailyIncome: "400,000",
        monthlyIncome: "12,000,000",
        annualIncome: "146,000,000",
      },
    ],
  };

  const defaultPositionDescriptions = [
    {
      level: "Intern",
      description:
        "Interns do not need a work deposit, and can receive 5 tasks per day. The income for each task is 13 PKR, and the daily income is 65 PKR. The internship period is 4 days.",
    },
    {
      level: "L1",
      description:
        "The job deposit for L1 is 2,000 PKR. The number of tasks per day is 5, and the income for each task is 13 PKR. The daily income is 65 PKR, the monthly income is 1,950 PKR, and the annual income is 23,725 PKR. The validity period is 365 days.",
    },
    {
      level: "L2",
      description:
        "The job deposit for L2 is 5,000 PKR. The number of tasks per day is 8, and the income for each task is 21 PKR. The daily income is 168 PKR, the monthly income is 5,040 PKR, and the annual income is 61,320 PKR. The validity period is 365 days.",
    },
    {
      level: "L3",
      description:
        "The job deposit for L3 is 20,000 PKR. The number of tasks per day is 10, and the income for each task is 72 PKR. The daily income is 720 PKR, the monthly income is 21,600 PKR, and the annual income is 262,800 PKR. The validity period is 365 days.",
    },
    {
      level: "L4",
      description:
        "The job deposit for L4 is 50,000 PKR. The number of tasks per day is 15, and the income for each task is 123 PKR. The daily income is 1,845 PKR, the monthly income is 55,350 PKR, and the annual income is 673,425 PKR. The validity period is 365 days.",
    },
    {
      level: "L5",
      description:
        "The job deposit for L5 is 100,000 PKR. The number of tasks per day is 20, and the income for each task is 192 PKR. The daily income is 3,840 PKR, the monthly income is 115,200 PKR, and the annual income is 1,401,600 PKR. The validity period is 365 days.",
    },
    {
      level: "L6",
      description:
        "The job deposit for L6 is 250,000 PKR. The number of tasks per day is 22, and the income for each task is 454 PKR. The daily income is 9,988 PKR, the monthly income is 299,640 PKR, and the annual income is 3,645,620 PKR. The validity period is 365 days.",
    },
    {
      level: "L7",
      description:
        "The job deposit for L7 is 500,000 PKR. The number of tasks per day is 25, and the income for each task is 836 PKR. The daily income is 20,900 PKR, the monthly income is 627,000 PKR, and the annual income is 7,628,500 PKR. The validity period is 365 days.",
    },
    {
      level: "L8",
      description:
        "The job deposit for L8 is 1,000,000 PKR. The number of tasks per day is 27, and the income for each task is 1,611 PKR. The daily income is 43,497 PKR, the monthly income is 1,304,910 PKR, and the annual income is 15,876,405 PKR. The validity period is 365 days.",
    },
    {
      level: "L9",
      description:
        "The job deposit for L9 is 2,000,000 PKR. The number of tasks per day is 30, and the income for each task is 3,033 PKR. The daily income is 90,990 PKR, the monthly income is 2,729,700 PKR, and the annual income is 33,212,850 PKR. The validity period is 365 days.",
    },
    {
      level: "L10",
      description:
        "The job deposit for L10 is 4,000,000 PKR. The number of tasks per day is 31, and the income for each task is 6,129 PKR. The daily income is 189,999 PKR, the monthly income is 5,699,970 PKR, and the annual income is 69,349,635 PKR. The validity period is 365 days.",
    },
    {
      level: "L11",
      description:
        "The job deposit for L11 is 8,000,000 PKR. The number of tasks per day is 32, and the income for each task is 12,500 PKR. The daily income is 400,000 PKR, the monthly income is 12,000,000 PKR, and the annual income is 146,000,000 PKR. The validity period is 365 days.",
    },
  ];

  const defaultInvitationRewardsTable = {
    headers: [
      "Job Level",
      "Income ratio of invited subordinates",
      "Invite A.level rewards",
      "Invite B.level rewards",
      "Invite C.level rewards",
    ],
    rows: [
      {
        position: "L1",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "5",
        bLevelRewards: "2",
        cLevelRewards: "1",
      },
      {
        position: "L2",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "13",
        bLevelRewards: "5",
        cLevelRewards: "2",
      },
      {
        position: "L3",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "58",
        bLevelRewards: "22",
        cLevelRewards: "7",
      },
      {
        position: "L4",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "148",
        bLevelRewards: "55",
        cLevelRewards: "18",
      },
      {
        position: "L5",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "307",
        bLevelRewards: "115",
        cLevelRewards: "38",
      },
      {
        position: "L6",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "799",
        bLevelRewards: "300",
        cLevelRewards: "100",
      },
      {
        position: "L7",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "1,672",
        bLevelRewards: "627",
        cLevelRewards: "209",
      },
      {
        position: "L8",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "3,480",
        bLevelRewards: "1,305",
        cLevelRewards: "435",
      },
      {
        position: "L9",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "7,279",
        bLevelRewards: "2,730",
        cLevelRewards: "910",
      },
      {
        position: "L10",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "15,200",
        bLevelRewards: "5,700",
        cLevelRewards: "1,900",
      },
      {
        position: "L11",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "32,000",
        bLevelRewards: "12,000",
        cLevelRewards: "4,000",
      },
    ],
  };

  const defaultTaskManagementBonus = {
    headers: [
      "Recommended level",
      "Task Management Bonus Ratio",
      "For example: Subordinate completes Per Task of 1,000 PKR",
    ],
    rows: [
      { level: "A-level", ratio: "6%", example: "60 PKR" },
      { level: "B-level", ratio: "3%", example: "30 PKR" },
      { level: "C-level", ratio: "1%", example: "10 PKR" },
    ],
  };

  const defaultIncomeRules =
    "Income is calculated based on daily task completion. Each position level has specific requirements and rewards. Monthly income is calculated based on 30 days of consistent task completion.";

  // Use provided data or defaults
  const data = defaultTableData;
  const descriptions = defaultPositionDescriptions;
  const rewards = defaultInvitationRewardsTable;
  const bonus = defaultTaskManagementBonus;
  const rules = defaultIncomeRules;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header with Logo */}
      <h1 className="text-4xl font-bold text-blue-600 text-center">{"itv"}</h1>

      {/* Main Table */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Position level And Income
        </h2>
        <Button className="mb-4 bg-blue-600 hover:bg-blue-800 text-white">
          Currency Unit (PKR)
        </Button>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                {data.headers.map((header, index) => (
                  <th
                    key={index}
                    className="py-3 px-4 border-b text-left font-semibold text-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="py-3 px-4 border-b font-medium">
                    {row.position}
                  </td>
                  <td className="py-3 px-4 border-b">
                    {row.jobSecurityDeposite}
                  </td>
                  <td className="py-3 px-4 border-b">{row.numberOfTasks}</td>
                  <td className="py-3 px-4 border-b">{row.unitPrice}</td>
                  <td className="py-3 px-4 border-b">{row.dailyIncome}</td>
                  <td className="py-3 px-4 border-b">{row.monthlyIncome}</td>
                  <td className="py-3 px-4 border-b">{row.annualIncome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Position Descriptions */}
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Position Descriptions
        </h3>
        <div className="space-y-3">
          {descriptions.map((desc, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 mt-1 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <span className="font-bold text-blue-700 text-lg">
                    {desc.level}:
                  </span>
                  <p className="text-gray-700 mt-2 leading-relaxed">
                    {desc.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invitation Rewards */}
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Invitation Rewards
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-blue-100">
                {rewards.headers.map((header, index) => (
                  <th
                    key={index}
                    className="py-3 px-4 border-b text-left font-semibold text-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rewards.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? "bg-blue-50" : "bg-white"}
                >
                  <td className="py-3 px-4 border-b font-medium">
                    {row.position}
                  </td>
                  <td className="py-3 px-4 border-b">{row.incomeRatio}</td>
                  <td className="py-3 px-4 border-b">{row.aLevelRewards}</td>
                  <td className="py-3 px-4 border-b">{row.bLevelRewards}</td>
                  <td className="py-3 px-4 border-b">{row.cLevelRewards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral Rewards Instructions */}
      <div className="mb-10">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border border-red-200 shadow-sm">
          <h3 className="text-2xl font-bold mb-6 text-red-600 flex items-center">
            <span className="mr-3">🎯</span>
            Referral Rewards Instructions
          </h3>

          {/* Invitation Rewards Section */}
          <div className="bg-white p-5 rounded-lg border border-red-100 mb-6">
            <h4 className="text-lg font-bold mb-4 text-red-500 flex items-center">
              <span className="mr-2">👉</span>
              Invitation Rewards Structure
            </h4>
            <div className="space-y-3">
              <div className="flex items-start bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                <span className="text-green-600 font-bold mr-3">Level A:</span>
                <span className="text-gray-700">
                  If <strong>you</strong> invite <strong>A</strong> and they
                  become <strong>L1</strong>, you earn{" "}
                  <strong className="text-green-600">5 PKR</strong>
                </span>
              </div>
              <div className="flex items-start bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                <span className="text-blue-600 font-bold mr-3">Level B:</span>
                <span className="text-gray-700">
                  If <strong>A</strong> invites <strong>B</strong> and they
                  become <strong>L1</strong>, you earn{" "}
                  <strong className="text-blue-600">2 PKR</strong>
                </span>
              </div>
              <div className="flex items-start bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                <span className="text-purple-600 font-bold mr-3">Level C:</span>
                <span className="text-gray-700">
                  If <strong>B</strong> invites <strong>C</strong> and they
                  become <strong>L1</strong>, you earn{" "}
                  <strong className="text-purple-600">1 PKR</strong>
                </span>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                <p className="text-yellow-800 font-semibold flex items-center">
                  <span className="mr-2">✅</span>
                  You earn rewards from your direct invites AND from your team's
                  invites too!
                </p>
              </div>
            </div>
          </div>

          {/* Key Examples Section */}
          <div className="bg-white p-5 rounded-lg border border-red-100">
            <h4 className="text-lg font-bold mb-4 text-red-500 flex items-center">
              <span className="mr-2">💡</span>
              Key Examples & Rules
            </h4>

            <div className="mb-4">
              <h5 className="font-bold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">👉</span>
                When a subordinate has a higher level than you:
              </h5>
              <div className="space-y-3">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="font-semibold text-orange-700 mb-2">
                    Example 1:
                  </div>
                  <p className="text-gray-700">
                    If you are{" "}
                    <span className="bg-orange-200 px-2 py-1 rounded font-bold">
                      L1
                    </span>{" "}
                    and your subordinate A becomes{" "}
                    <span className="bg-orange-200 px-2 py-1 rounded font-bold">
                      L2
                    </span>
                    , you receive{" "}
                    <span className="bg-green-200 px-2 py-1 rounded font-bold">
                      8% of the L1 invitation reward (5 PKR)
                    </span>{" "}
                    — that's{" "}
                    <span className="text-green-600 font-bold">0.4 PKR</span>
                  </p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="font-semibold text-indigo-700 mb-2">
                    Example 2:
                  </div>
                  <p className="text-gray-700">
                    If you are{" "}
                    <span className="bg-indigo-200 px-2 py-1 rounded font-bold">
                      L4
                    </span>{" "}
                    and your subordinate A becomes{" "}
                    <span className="bg-indigo-200 px-2 py-1 rounded font-bold">
                      L4
                    </span>
                    , you receive{" "}
                    <span className="bg-green-200 px-2 py-1 rounded font-bold">
                      8% of the L4 invitation reward (148 PKR)
                    </span>{" "}
                    — that's{" "}
                    <span className="text-green-600 font-bold">12 PKR</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <p className="font-bold text-blue-700 mb-2">
                    Important Rule:
                  </p>
                  <p className="text-gray-700 mb-3">
                    If you invite someone of a higher level, you only get{" "}
                    <span className="bg-yellow-200 px-2 py-1 rounded font-bold">
                      8%
                    </span>{" "}
                    of that level's invitation reward.
                  </p>
                  <div className="flex items-center text-blue-600">
                    <span className="mr-2">🔼</span>
                    <p className="font-semibold">
                      As you reach higher membership levels, the base invitation
                      rewards grow — so your potential income increases!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Management Bonus */}
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Task Management Bonus
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-green-100">
                {bonus.headers.map((header, index) => (
                  <th
                    key={index}
                    className="py-3 px-4 border-b text-left font-semibold text-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bonus.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? "bg-green-50" : "bg-white"}
                >
                  <td className="py-3 px-4 border-b font-medium">
                    {row.level}
                  </td>
                  <td className="py-3 px-4 border-b">{row.ratio}</td>
                  <td className="py-3 px-4 border-b">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Management Bonus */}
      <div className="mb-10">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 shadow-sm">
          <h3 className="text-2xl font-bold mb-6 text-green-600 flex items-center">
            <span className="mr-3">💰</span>
            Daily Management Bonus
          </h3>

          {/* Introduction */}
          <div className="bg-white p-5 rounded-lg border border-green-100 mb-6">
            <h4 className="text-lg font-bold mb-4 text-green-500 flex items-center">
              <span className="mr-2">👉</span>
              Invite Friends & Earn Daily Management Fees!
            </h4>
            <p className="text-gray-700 text-lg leading-relaxed">
              When employees you invite complete their daily tasks, you earn a <span className="bg-green-200 px-2 py-1 rounded font-bold">management bonus</span> based on their level:
            </p>
          </div>

          {/* Bonus Rates */}
          <div className="bg-white p-5 rounded-lg border border-green-100 mb-6">
            <h4 className="text-lg font-bold mb-4 text-green-500 flex items-center">
              <span className="mr-2">📊</span>
              Management Bonus Rates
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold mr-4">A</span>
                  <span className="font-semibold text-gray-700">A-level subordinates</span>
                </div>
                <span className="bg-red-200 px-4 py-2 rounded-lg font-bold text-red-700">6% of daily income</span>
              </div>
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold mr-4">B</span>
                  <span className="font-semibold text-gray-700">B-level subordinates</span>
                </div>
                <span className="bg-blue-200 px-4 py-2 rounded-lg font-bold text-blue-700">3% of daily income</span>
              </div>
              <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full font-bold mr-4">C</span>
                  <span className="font-semibold text-gray-700">C-level subordinates</span>
                </div>
                <span className="bg-purple-200 px-4 py-2 rounded-lg font-bold text-purple-700">1% of daily income</span>
              </div>
            </div>
          </div>

          {/* Example Calculation */}
          <div className="bg-white p-5 rounded-lg border border-green-100">
            <h4 className="text-lg font-bold mb-4 text-green-500 flex items-center">
              <span className="mr-2">🧮</span>
              Example Calculation
            </h4>

            <div className="mb-6">
              <h5 className="font-bold text-gray-800 mb-3">If you invite:</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                  <div className="text-2xl font-bold text-red-600">10</div>
                  <div className="text-red-700 font-semibold">A-level subordinates</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                  <div className="text-2xl font-bold text-blue-600">100</div>
                  <div className="text-blue-700 font-semibold">B-level subordinates</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
                  <div className="text-2xl font-bold text-purple-600">1,000</div>
                  <div className="text-purple-700 font-semibold">C-level subordinates</div>
                </div>
              </div>
              <div className="text-center bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                <span className="text-yellow-800 font-semibold">Each earning an average of </span>
                <span className="bg-yellow-200 px-3 py-1 rounded font-bold text-yellow-900">1,000 PKR daily</span>
              </div>
            </div>

            <div className="mb-6">
              <h5 className="font-bold text-gray-800 mb-3">Your earnings will be:</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-200">
                  <span className="font-semibold text-gray-700">A-level: 1,000 × 10 × 6%</span>
                  <span className="bg-red-200 px-4 py-2 rounded-lg font-bold text-red-700">600 PKR</span>
                </div>
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <span className="font-semibold text-gray-700">B-level: 1,000 × 100 × 3%</span>
                  <span className="bg-blue-200 px-4 py-2 rounded-lg font-bold text-blue-700">3,000 PKR</span>
                </div>
                <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <span className="font-semibold text-gray-700">C-level: 1,000 × 1,000 × 1%</span>
                  <span className="bg-purple-200 px-4 py-2 rounded-lg font-bold text-purple-700">10,000 PKR</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-lg border border-green-300">
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-3">✅</span>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700 mb-2">Total Daily Management Bonus</div>
                  <div className="text-3xl font-bold text-green-800">
                    600 + 3000 + 10000 = <span className="bg-green-200 px-4 py-2 rounded-lg">13.600 PKR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Income Rules */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-800">Income Rules</h3>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <p className="text-gray-700">{rules}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfitOverview;
