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
        unitPrice: "26",
        dailyIncome: "130",
        monthlyIncome: "---",
        annualIncome: "---",
      },
      {
        position: "P 1",
        jobSecurityDeposite: "3900",
        numberOfTasks: "5",
        unitPrice: "26",
        dailyIncome: "130",
        monthlyIncome: "3900",
        annualIncome: "47450",
      },
      {
        position: "p 2",
        jobSecurityDeposite: "18000",
        numberOfTasks: "10",
        unitPrice: "62",
        dailyIncome: "620",
        monthlyIncome: "18600",
        annualIncome: "226300",
      },
      {
        position: "P 3",
        jobSecurityDeposite: "52000",
        numberOfTasks: "20",
        unitPrice: "93",
        dailyIncome: "1860",
        monthlyIncome: "55800",
        annualIncome: "678900",
      },
      {
        position: "P 4",
        jobSecurityDeposite: "120000",
        numberOfTasks: "30",
        unitPrice: "145",
        dailyIncome: "4350",
        monthlyIncome: "130500",
        annualIncome: "1587750",
      },
      {
        position: "P 5",
        jobSecurityDeposite: "250000",
        numberOfTasks: "50",
        unitPrice: "210",
        dailyIncome: "10500",
        monthlyIncome: "315000",
        annualIncome: "3832500",
      },
      {
        position: "P 6",
        jobSecurityDeposite: "550000",
        numberOfTasks: "60",
        unitPrice: "350",
        dailyIncome: "21000",
        monthlyIncome: "630000",
        annualIncome: "7665000",
      },
      {
        position: "P 7",
        jobSecurityDeposite: "1100000",
        numberOfTasks: "80",
        unitPrice: "720",
        dailyIncome: "57600",
        monthlyIncome: "1728000",
        annualIncome: "21024000",
      },
      {
        position: "P 8",
        jobSecurityDeposite: "2200000",
        numberOfTasks: "100",
        unitPrice: "1300",
        dailyIncome: "130000",
        monthlyIncome: "3900000",
        annualIncome: "47450000",
      },
      {
        position: "P 9",
        jobSecurityDeposite: "4000000",
        numberOfTasks: "120",
        unitPrice: "2000",
        dailyIncome: "240000",
        monthlyIncome: "7200000",
        annualIncome: "87600000",
      },
      {
        position: "P 10",
        jobSecurityDeposite: "7000000",
        numberOfTasks: "150",
        unitPrice: "2800",
        dailyIncome: "420000",
        monthlyIncome: "12600000",
        annualIncome: "153300000",
      },
    ],
  };

  const defaultPositionDescriptions = [
    {
      level: "Intern",
      description:
        "Interns do not need a work deposite, and can receive 5 tasks per day. The income for each task is 26 PKR, and the daily income is 130 PKR. The internship period is 4 days.",
    },
    {
      level: "P1",
      description:
        "The job deposit for P1 is 3,900 PKR. The number of tasks per day is 5, and the income for each task is 26 PKR. The daily income is 130 PKR, the monthly income is 3,900 PKR, and the annual income is 47,450 PKR. The validity period is 365 days.",
    },
    {
      level: "P2",
      description:
        "The job deposit for P2 is 18,000 PKR. The number of tasks per day is 10, and the income for each task is 62 PKR. The daily income is 620 PKR, the monthly income is 18,600 PKR, and the annual income is 226,300 PKR. The validity period is 365 days.",
    },
    {
      level: "P3",
      description:
        "The job deposit for P3 is 52,000 PKR. The number of tasks per day is 20, and the income for each task is 93 PKR. The daily income is 1,860 PKR, the monthly income is 55,800 PKR, and the annual income is 678,900 PKR. The validity period is 365 days.",
    },
    {
      level: "P4",
      description:
        "The job deposit for P4 is 120,000 PKR. The number of tasks per day is 30, and the income for each task is 145 PKR. The daily income is 4,350 PKR, the monthly income is 130,500 PKR, and the annual income is 1,587,750 PKR. The validity period is 365 days.",
    },
    {
      level: "P5",
      description:
        "The job deposit for P5 is 250,000 PKR. The number of tasks per day is 50, and the income for each task is 210 PKR. The daily income is 10,500 PKR, the monthly income is 315,000 PKR, and the annual income is 3,832,500 PKR. The validity period is 365 days.",
    },
    {
      level: "P6",
      description:
        "The job deposit for P6 is 550,000 PKR. The number of tasks per day is 60, and the income for each task is 350 PKR. The daily income is 21,000 PKR, the monthly income is 630,000 PKR, and the annual income is 7,665,000 PKR. The validity period is 365 days.",
    },
    {
      level: "P7",
      description:
        "The job deposit for P7 is 1,100,000 PKR. The number of tasks per day is 80, and the income for each task is 720 PKR. The daily income is 57,600 PKR, the monthly income is 1,728,000 PKR, and the annual income is 21,024,000 PKR. The validity period is 365 days.",
    },
    {
      level: "P8",
      description:
        "The job deposit for P8 is 2,200,000 PKR. The number of tasks per day is 100, and the income for each task is 1,300 PKR. The daily income is 130,000 PKR, the monthly income is 3,900,000 PKR, and the annual income is 47,450,000 PKR. The validity period is 365 days.",
    },
    {
      level: "P9",
      description:
        "The job deposit for P9 is 4,000,000 PKR. The number of tasks per day is 120, and the income for each task is 2,000 PKR. The daily income is 240,000 PKR, the monthly income is 7,200,000 PKR, and the annual income is 87,600,000 PKR. The validity period is 365 days.",
    },
    {
      level: "P10",
      description:
        "The job deposit for P10 is 7,000,000 PKR. The number of tasks per day is 150, and the income for each task is 2,800 PKR. The daily income is 420,000 PKR, the monthly income is 12,600,000 PKR, and the annual income is 153,300,000 PKR. The validity period is 365 days.",
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
        position: "P 1",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "312",
        bLevelRewards: "117",
        cLevelRewards: "39",
      },
      {
        position: "P 2",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "1440",
        bLevelRewards: "540",
        cLevelRewards: "180",
      },
      {
        position: "P 3",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "4160",
        bLevelRewards: "1560",
        cLevelRewards: "520",
      },
      {
        position: "P 4",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "9600",
        bLevelRewards: "3600",
        cLevelRewards: "1200",
      },
      {
        position: "P 5",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "20000",
        bLevelRewards: "7500",
        cLevelRewards: "2500",
      },
      {
        position: "P 6",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "44000",
        bLevelRewards: "16500",
        cLevelRewards: "5500",
      },
      {
        position: "P 7",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "88000",
        bLevelRewards: "33000",
        cLevelRewards: "11000",
      },
      {
        position: "P 8",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "176000",
        bLevelRewards: "66000",
        cLevelRewards: "22000",
      },
      {
        position: "P 9",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "320000",
        bLevelRewards: "120000",
        cLevelRewards: "40000",
      },
      {
        position: "P 10",
        incomeRatio: "8%-3%-1%",
        aLevelRewards: "560000",
        bLevelRewards: "210000",
        cLevelRewards: "70000",
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
                  become <strong>P1</strong>, you earn{" "}
                  <strong className="text-green-600">312 PKR</strong>
                </span>
              </div>
              <div className="flex items-start bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                <span className="text-blue-600 font-bold mr-3">Level B:</span>
                <span className="text-gray-700">
                  If <strong>A</strong> invites <strong>B</strong> and they
                  become <strong>P1</strong>, you earn{" "}
                  <strong className="text-blue-600">117 PKR</strong>
                </span>
              </div>
              <div className="flex items-start bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                <span className="text-purple-600 font-bold mr-3">Level C:</span>
                <span className="text-gray-700">
                  If <strong>B</strong> invites <strong>C</strong> and they
                  become <strong>P1</strong>, you earn{" "}
                  <strong className="text-purple-600">39 PKR</strong>
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
                      P1
                    </span>{" "}
                    and your subordinate A becomes{" "}
                    <span className="bg-orange-200 px-2 py-1 rounded font-bold">
                      P2
                    </span>
                    , you receive{" "}
                    <span className="bg-green-200 px-2 py-1 rounded font-bold">
                      8% of the P1 invitation reward (312 PKR)
                    </span>{" "}
                    — that's{" "}
                    <span className="text-green-600 font-bold">25 PKR</span>
                  </p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="font-semibold text-indigo-700 mb-2">
                    Example 2:
                  </div>
                  <p className="text-gray-700">
                    If you are{" "}
                    <span className="bg-indigo-200 px-2 py-1 rounded font-bold">
                      P4
                    </span>{" "}
                    and your subordinate A becomes{" "}
                    <span className="bg-indigo-200 px-2 py-1 rounded font-bold">
                      P4
                    </span>
                    , you receive{" "}
                    <span className="bg-green-200 px-2 py-1 rounded font-bold">
                      8% of the P4 invitation reward (9,600 PKR)
                    </span>{" "}
                    — that's{" "}
                    <span className="text-green-600 font-bold">768 PKR</span>
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
