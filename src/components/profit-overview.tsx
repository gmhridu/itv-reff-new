import React from "react";
import { Button } from "./ui/button";

interface TableRow {
  position: string;
  jobSecurityDeposite: string;
  numberOfTasks: string;
  unitPrice: string;
  dailyIncome: string;
  monthlyIncome: string;
  annualIncome: string;
}

interface RewardsRow {
  position: string;
  incomeRatio: string;
  aLevelRewards: string;
  bLevelRewards: string;
  cLevelRewards: string;
}

interface BonusRow {
  level: string;
  ratio: string;
  example: string;
}

interface PositionDescription {
  level: string;
  description: string;
}

const ProfitOverview: React.FC = () => {
  // Function to format numbers with consistent comma separators
  const formatNumber = (num: string | number): string => {
    if (typeof num === "string" && num.includes("---")) {
      return num;
    }

    // Remove existing commas and convert to number
    const cleanNum =
      typeof num === "string" ? num.replace(/,/g, "") : num.toString();
    const numValue = parseFloat(cleanNum);

    if (isNaN(numValue)) {
      return num.toString();
    }

    // Use toLocaleString with 'en-US' to ensure commas as thousand separators
    return numValue.toLocaleString("en-US");
  };
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
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow-lg">
      {/* Main Table */}
      <div className="mb-8 sm:mb-10">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 text-gray-800">
          Position Level And Income
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <Button className="bg-blue-600 hover:bg-blue-800 text-white text-sm sm:text-base px-4 py-2">
            Currency Unit (PKR)
          </Button>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  {data.headers.map((header, index) => (
                    <th
                      key={index}
                      className="py-3 px-4 border-b text-left font-semibold text-gray-700 text-sm xl:text-base whitespace-nowrap"
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
                    <td className="py-3 px-4 border-b font-medium text-sm xl:text-base">
                      {row.position}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm xl:text-base">
                      {formatNumber(row.jobSecurityDeposite)}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm xl:text-base">
                      {formatNumber(row.numberOfTasks)}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm xl:text-base">
                      {formatNumber(row.unitPrice)}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm xl:text-base">
                      {formatNumber(row.dailyIncome)}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm xl:text-base">
                      {formatNumber(row.monthlyIncome)}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm xl:text-base">
                      {formatNumber(row.annualIncome)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="block lg:hidden">
          <div className="space-y-4">
            {data.rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-blue-600">
                    {row.position}
                  </h4>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    Level {row.position}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Security Deposit
                    </div>
                    <div className="font-mono font-semibold text-gray-800">
                      {formatNumber(row.jobSecurityDeposite)} PKR
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Tasks/Day
                    </div>
                    <div className="font-mono font-semibold text-gray-800">
                      {formatNumber(row.numberOfTasks)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Unit Price
                    </div>
                    <div className="font-mono font-semibold text-gray-800">
                      {formatNumber(row.unitPrice)} PKR
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="text-green-600 text-xs uppercase tracking-wide font-semibold mb-1">
                      Daily Income
                    </div>
                    <div className="font-mono font-bold text-green-700">
                      {formatNumber(row.dailyIncome)} PKR
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="text-blue-600 text-xs uppercase tracking-wide font-semibold mb-1">
                      Monthly Income
                    </div>
                    <div className="font-mono font-bold text-blue-700">
                      {formatNumber(row.monthlyIncome)} PKR
                    </div>
                  </div>

                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <div className="text-purple-600 text-xs uppercase tracking-wide font-semibold mb-1">
                      Annual Income
                    </div>
                    <div className="font-mono font-bold text-purple-700">
                      {formatNumber(row.annualIncome)} PKR
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Position Descriptions */}
      <div className="mb-8 sm:mb-10">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
          Position Descriptions
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {descriptions.map((desc, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 md:p-5 rounded-lg border border-blue-200 shadow-sm"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-blue-700 text-sm sm:text-base md:text-lg break-words">
                    {desc.level}:
                  </span>
                  <p className="text-gray-700 mt-1 sm:mt-2 leading-relaxed text-sm sm:text-base break-words">
                    {desc.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invitation Rewards */}
      <div className="mb-8 sm:mb-10">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
          Invitation Rewards
        </h3>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-blue-100">
                  {rewards.headers.map((header, index) => (
                    <th
                      key={index}
                      className="py-3 px-4 border-b text-left font-semibold text-gray-700 text-sm lg:text-base whitespace-nowrap"
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
                    <td className="py-3 px-4 border-b font-medium text-sm lg:text-base">
                      {row.position}
                    </td>
                    <td className="py-3 px-4 border-b text-sm lg:text-base">
                      {row.incomeRatio}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm lg:text-base">
                      {formatNumber(row.aLevelRewards)}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm lg:text-base">
                      {formatNumber(row.bLevelRewards)}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm lg:text-base">
                      {formatNumber(row.cLevelRewards)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {rewards.rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-blue-600">
                  {row.position}
                </h4>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">
                  {row.incomeRatio}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-red-50 p-3 rounded border border-red-200 text-center">
                  <div className="text-red-600 text-xs font-semibold mb-1">
                    A-Level
                  </div>
                  <div className="font-mono font-bold text-red-700">
                    {formatNumber(row.aLevelRewards)} PKR
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-200 text-center">
                  <div className="text-blue-600 text-xs font-semibold mb-1">
                    B-Level
                  </div>
                  <div className="font-mono font-bold text-blue-700">
                    {formatNumber(row.bLevelRewards)} PKR
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded border border-purple-200 text-center">
                  <div className="text-purple-600 text-xs font-semibold mb-1">
                    C-Level
                  </div>
                  <div className="font-mono font-bold text-purple-700">
                    {formatNumber(row.cLevelRewards)} PKR
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Management Bonus */}
      <div className="mb-8 sm:mb-10">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
          Task Management Bonus
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-green-100">
                {bonus.headers.map((header, index) => (
                  <th
                    key={index}
                    className="py-2 sm:py-3 px-2 sm:px-4 border-b text-left font-semibold text-gray-700 text-xs sm:text-sm lg:text-base whitespace-nowrap"
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
                  <td className="py-2 sm:py-3 px-2 sm:px-4 border-b font-medium text-xs sm:text-sm lg:text-base">
                    {row.level}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 border-b text-xs sm:text-sm lg:text-base">
                    {row.ratio}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 border-b text-xs sm:text-sm lg:text-base">
                    {row.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Management Bonus */}
      <div className="mb-8 sm:mb-10">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg border border-green-200 shadow-sm">
          <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-green-600 flex items-center flex-wrap gap-2">
            <span className="text-xl sm:text-2xl">💰</span>
            <span className="break-words">Daily Management Bonus</span>
          </h3>

          {/* Introduction */}
          <div className="bg-white p-3 sm:p-5 rounded-lg border border-green-100 mb-4 sm:mb-6">
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-green-500 flex items-center flex-wrap gap-2">
              <span>👉</span>
              <span className="break-words">
                Invite Friends & Earn Daily Management Fees!
              </span>
            </h4>
            <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
              When employees you invite complete their daily tasks, you earn a{" "}
              <span className="bg-green-200 px-2 py-1 rounded font-bold">
                management bonus
              </span>{" "}
              based on their level:
            </p>
          </div>

          {/* Bonus Rates */}
          <div className="bg-white p-3 sm:p-5 rounded-lg border border-green-100 mb-4 sm:mb-6">
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-green-500 flex items-center gap-2">
              <span>📊</span>
              <span>Management Bonus Rates</span>
            </h4>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200 gap-2">
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                    A
                  </span>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">
                    A-level subordinates
                  </span>
                </div>
                <span className="bg-red-200 px-3 sm:px-4 py-2 rounded-lg font-bold text-red-700 text-sm sm:text-base">
                  6% of daily income
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 gap-2">
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                    B
                  </span>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">
                    B-level subordinates
                  </span>
                </div>
                <span className="bg-blue-200 px-3 sm:px-4 py-2 rounded-lg font-bold text-blue-700 text-sm sm:text-base">
                  3% of daily income
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200 gap-2">
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                    C
                  </span>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">
                    C-level subordinates
                  </span>
                </div>
                <span className="bg-purple-200 px-3 sm:px-4 py-2 rounded-lg font-bold text-purple-700 text-sm sm:text-base">
                  1% of daily income
                </span>
              </div>
            </div>
          </div>

          {/* Example Calculation */}
          <div className="bg-white p-3 sm:p-5 rounded-lg border border-green-100">
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-green-500 flex items-center gap-2">
              <span>🧮</span>
              <span>Example Calculation</span>
            </h4>

            <div className="mb-4 sm:mb-6">
              <h5 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">
                If you invite:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">
                    {formatNumber(10)}
                  </div>
                  <div className="text-red-700 font-semibold text-sm sm:text-base">
                    A-level subordinates
                  </div>
                </div>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {formatNumber(100)}
                  </div>
                  <div className="text-blue-700 font-semibold text-sm sm:text-base">
                    B-level subordinates
                  </div>
                </div>
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    {formatNumber(1000)}
                  </div>
                  <div className="text-purple-700 font-semibold text-sm sm:text-base">
                    C-level subordinates
                  </div>
                </div>
              </div>
              <div className="text-center bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                <span className="text-yellow-800 font-semibold text-sm sm:text-base">
                  Each earning an average of{" "}
                </span>
                <span className="bg-yellow-200 px-3 py-1 rounded font-bold text-yellow-900 font-mono text-sm sm:text-base">
                  {formatNumber(1000)} PKR daily
                </span>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <h5 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">
                Your earnings will be:
              </h5>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200 gap-2">
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">
                    A-level: {formatNumber(1000)} × {formatNumber(10)} × 6%
                  </span>
                  <span className="bg-red-200 px-3 sm:px-4 py-2 rounded-lg font-bold text-red-700 font-mono text-sm sm:text-base">
                    {formatNumber(600)} PKR
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 gap-2">
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">
                    B-level: {formatNumber(1000)} × {formatNumber(100)} × 3%
                  </span>
                  <span className="bg-blue-200 px-3 sm:px-4 py-2 rounded-lg font-bold text-blue-700 font-mono text-sm sm:text-base">
                    {formatNumber(3000)} PKR
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200 gap-2">
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">
                    C-level: {formatNumber(1000)} × {formatNumber(1000)} × 1%
                  </span>
                  <span className="bg-purple-200 px-3 sm:px-4 py-2 rounded-lg font-bold text-purple-700 font-mono text-sm sm:text-base">
                    {formatNumber(10000)} PKR
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 sm:p-6 rounded-lg border border-green-300">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <span className="text-xl sm:text-2xl">✅</span>
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold text-green-700 mb-2">
                    Total Daily Management Bonus
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800 break-words">
                    <span className="block sm:inline">
                      {`${formatNumber(600)} + ${formatNumber(3000)} + ${formatNumber(10000)} = `}
                    </span>
                    <span className="bg-green-200 px-3 sm:px-4 py-2 rounded-lg font-mono inline-block mt-2 sm:mt-0">
                      {formatNumber(13600)} PKR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Income Rules */}
      <div className="mb-6 sm:mb-8 lg:mb-10 pb-2.5">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
          Income Rules
        </h3>
        <div className="bg-yellow-50 p-4 sm:p-6 rounded-lg border border-yellow-100 mb-9">
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
            {rules}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfitOverview;
