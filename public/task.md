Tasks Documentation
This document outlines the functionality and developer instructions for the withdrawal, top-up, user interface, and level-based subscription features of the platform.
1. Withdrawal Process
Overview
The withdrawal screen features a table with fixed withdrawal amounts: 500, 3000, 10000, 30000, 100000, 250000, 500000 PKR. The system ensures that only buttons corresponding to amounts equal to or less than the user's available balance are enabled.
Functionality

Button Activation:
Buttons are enabled only if the user's available balance is sufficient.
Example: If the balance is 500 PKR, only the 500 PKR button is active; others are disabled.


Withdrawal Submission:
User selects an amount and enters account/wallet details (JazzCash, Easypaisa, or USDT TRC20).
Upon submission, the request status is set to Pending.
The selected amount is deducted from the user's wallet balance.
A notification is sent to the admin panel.


Processing Fees:
For JazzCash or Easypaisa withdrawals: Display “Processing Fee: 100 per 1,000 PKR”.
For USDT (TRC20) withdrawals: Display “No processing fee will be charged.”


Admin Actions:
Approval: Status changes from Pending to Approved. Upon processing, status updates to Withdrawal Done and is recorded in the user’s withdrawal history.
Decline: If declined (e.g., due to incorrect wallet details), status updates to Declined, and the deducted amount is returned to the user’s wallet.


Fund Password:
A Fund Password must be set by the user in the MY section under Fund Password.
This password is required for every withdrawal. The process proceeds only if the correct Fund Password is entered.



Developer Notes

Ensure buttons are dynamically enabled/disabled based on the user’s wallet balance.
Implement secure storage and validation for the Fund Password.
Display processing fee information clearly on the withdrawal screen based on the selected payment method.
Notify the admin panel for each withdrawal request and allow status updates (Pending → Approved → Withdrawal Done or Declined).
Ensure the deducted amount is returned to the wallet upon decline.

2. Quick Action Icons
Overview
Four clickable icons are added in the blank space of the MY section under Quick Actions: Top Up, Withdraw Money, Invite Friends, and Company Profile.
Functionality

Icons and Navigation:
Top Up: Redirects to the Top Up screen/page (larger icon).
Withdraw Money: Redirects to the Withdrawal screen/page (smaller icon).
Invite Friends: Redirects to the Invite Friends page/section (larger icon).
Company Profile: Redirects to the Company Profile page (smaller icon).


Design:
Top Up and Invite Friends icons are larger for emphasis.
Withdraw Money and Company Profile icons are smaller.



Developer Notes

Implement clickable icons with proper navigation to respective pages.
Use distinct sizes for icons as specified.
Ensure icons are visually clear and responsive across devices.

3. Subscription Levels
Overview
The platform offers 11 subscription levels (L1–L11), each requiring a deposit to unlock daily tasks and earnings. The validity period is removed from all levels.
Level Details

L1: Deposit: 2,000 PKR | 5 tasks/day | 13 PKR/task | Daily: 65 PKR | Monthly: 1,950 PKR | Yearly: 23,400 PKR
L2: Deposit: 5,000 PKR | 8 tasks/day | 21 PKR/task | Daily: 168 PKR | Monthly: 5,040 PKR | Yearly: 60,480 PKR
L3: Deposit: 20,000 PKR | 10 tasks/day | 72 PKR/task | Daily: 720 PKR | Monthly: 21,600 PKR | Yearly: 259,200 PKR
L4: Deposit: 50,000 PKR | 15 tasks/day | 123 PKR/task | Daily: 1,845 PKR | Monthly: 55,350 PKR | Yearly: 664,200 PKR
L5: Deposit: 100,000 PKR | 20 tasks/day | 192 PKR/task | Daily: 3,840 PKR | Monthly: 115,200 PKR | Yearly: 1,382,400 PKR
L6: Deposit: 250,000 PKR | 22 tasks/day | 454 PKR/task | Daily: 9,988 PKR | Monthly: 299,640 PKR | Yearly: 3,595,680 PKR
L7: Deposit: 500,000 PKR | 25 tasks/day | 836 PKR/task | Daily: 20,900 PKR | Monthly: 627,000 PKR | Yearly: 7,524,000 PKR
L8: Deposit: 1,000,000 PKR | 27 tasks/day | 1,611 PKR/task | Daily: 43,497 PKR | Monthly: 1,309,410 PKR | Yearly: 15,658,920 PKR
L9: Deposit: 2,000,000 PKR | 30 tasks/day | 3,033 PKR/task | Daily: 90,990 PKR | Monthly: 2,729,700 PKR | Yearly: 32,756,400 PKR
L10: Deposit: 4,000,000 PKR | 31 tasks/day | 6,129 PKR/task | Daily: 190,000 PKR | Monthly: 5,700,000 PKR | Yearly: 68,400,000 PKR
L11: Deposit: 8,000,000 PKR | 32 tasks/day | 12,500 PKR/task | Daily: 400,000 PKR | Monthly: 12,000,000 PKR | Yearly: 144,000,000 PKR

Formatting Note

Ensure amounts are formatted correctly (e.g., 13,600 PKR, not 13.600 PKR).

Developer Notes

Remove validity periods from all level descriptions.
On clicking Upgrade for a level, redirect the user to the Top Up page.
Ensure sufficient wallet balance before allowing plan activation.
Deduct the deposit amount from the Main Wallet upon activation.

4. MY Section - Quick Actions
Overview
The Quick Actions section in the MY tab includes Personal Information, Bank Card, Login Password, and Fund Password.
Functionality

Personal Information:
Remove Head Portrait option.
Retain Mobile Number and Detailed Information without changes.


Bank Card:
Add options for JazzCash, Easypaisa, and Wallet Address.


Login Password:
No changes.


Fund Password:
Prompt the user to set a Fund Password.
Required for all withdrawals; validate before proceeding.



Developer Notes

Remove Head Portrait from the UI and backend.
Add fields for JazzCash, Easypaisa, and Wallet Address in the Bank Card section.
Implement Fund Password setup and validation logic.

5. Top-Up Flow
Step 1: User Clicks "Top Up" Button

Display three options with logos:
JazzCash (with JazzCash logo)
Easypaisa (with Easypaisa logo)
USDT (TRC20) – Fast & Secure Recharge (with note: “Recharge via USDT & Get +3% Extra Commission Bonus”)



Step 2: User Selects Payment Method
JazzCash/Easypaisa

Display:
Wallet Number (from Admin Panel)
Wallet Title
QR Code (if uploaded by admin)


User sends payment to the provided wallet.
User uploads a payment screenshot/receipt.
User submits the request.
Notification is sent to the Admin Panel.
Admin verifies the payment.
On approval, the top-up amount is added to the Main Wallet.

USDT (TRC20)

Display:
USDT Wallet Address (from Admin Panel)
QR Code
Bonus Note: “Recharge via USDT & Get +3% Extra Commission Bonus”
Info Box: “Today’s USDT to PKR Rate: [Admin Defined Value]” (e.g., 295 PKR per 1 USDT)


User transfers USDT.
User uploads transaction hash or screenshot.
User submits the request.
Notification is sent to the Admin Panel.
Admin verifies the payment.
On approval:
Top-up amount (converted to PKR using the admin-defined rate) is added to the Main Wallet.
Extra 3% bonus is added to the Commission Wallet.



Step 3: Subscription Activation

After top-up approval, the user navigates to the Plans/Levels section.
User selects a plan (L1–L11).
If the wallet balance is sufficient:
Plan is activated.
Deposit amount is deducted from the Main Wallet.


User can perform daily tasks and earn commissions based on their level.

Developer Notes

Allow admin to edit/upload Wallet Numbers, QR Codes, and USDT Address in the Admin Panel.
Implement admin options to Approve or Reject top-up requests.
For USDT top-ups, calculate PKR using the admin-defined rate and add 3% bonus to the Commission Wallet.
Display the USDT to PKR rate in a highlighted box below the USDT Wallet Address and QR Code.
Ensure plan activation checks for sufficient balance.
