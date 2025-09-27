import { db } from "@/lib/db";

export interface DataIntegrityReport {
  orphanedTopupRequests: Array<{
    id: string;
    userId: string;
    amount: number;
    createdAt: Date;
  }>;
  missingWalletReferences: Array<{
    id: string;
    selectedWalletId: string;
    amount: number;
  }>;
  duplicateTransactionIds: Array<{
    transactionId: string;
    requests: Array<{
      id: string;
      userId: string;
      amount: number;
    }>;
  }>;
  summary: {
    totalTopupRequests: number;
    orphanedCount: number;
    missingWalletCount: number;
    duplicateTransactionCount: number;
    dataIntegrityScore: number; // Percentage of clean data
  };
}

/**
 * Check for topup requests with missing or invalid user references
 */
export async function checkTopupDataIntegrity(): Promise<DataIntegrityReport> {
  try {
    console.log("Starting topup data integrity check...");

    // Get all topup requests with user and wallet data
    const allTopupRequests = await db.topupRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        selectedWallet: {
          select: {
            id: true,
            walletType: true,
            walletNumber: true,
          },
        },
      },
    });

    console.log(`Found ${allTopupRequests.length} total topup requests`);

    // Find orphaned requests (requests without valid user)
    const orphanedTopupRequests = allTopupRequests
      .filter((request) => !request.user)
      .map((request) => ({
        id: request.id,
        userId: request.userId,
        amount: request.amount,
        createdAt: request.createdAt,
      }));

    // Find requests with missing wallet references
    const missingWalletReferences = allTopupRequests
      .filter((request) => !request.selectedWallet)
      .map((request) => ({
        id: request.id,
        selectedWalletId: request.selectedWalletId,
        amount: request.amount,
      }));

    // Find duplicate transaction IDs
    const transactionIdGroups: { [key: string]: typeof allTopupRequests } = {};

    allTopupRequests
      .filter((request) => request.transactionId)
      .forEach((request) => {
        const txId = request.transactionId!;
        if (!transactionIdGroups[txId]) {
          transactionIdGroups[txId] = [];
        }
        transactionIdGroups[txId].push(request);
      });

    const duplicateTransactionIds = Object.entries(transactionIdGroups)
      .filter(([, requests]) => requests.length > 1)
      .map(([transactionId, requests]) => ({
        transactionId,
        requests: requests.map((req) => ({
          id: req.id,
          userId: req.userId,
          amount: req.amount,
        })),
      }));

    // Calculate data integrity score
    const totalIssues =
      orphanedTopupRequests.length +
      missingWalletReferences.length +
      duplicateTransactionIds.length;

    const dataIntegrityScore = allTopupRequests.length > 0
      ? Math.max(0, Math.round(((allTopupRequests.length - totalIssues) / allTopupRequests.length) * 100))
      : 100;

    const report: DataIntegrityReport = {
      orphanedTopupRequests,
      missingWalletReferences,
      duplicateTransactionIds,
      summary: {
        totalTopupRequests: allTopupRequests.length,
        orphanedCount: orphanedTopupRequests.length,
        missingWalletCount: missingWalletReferences.length,
        duplicateTransactionCount: duplicateTransactionIds.length,
        dataIntegrityScore,
      },
    };

    console.log("Data integrity check completed:", report.summary);

    return report;
  } catch (error) {
    console.error("Error during data integrity check:", error);
    throw new Error("Failed to perform data integrity check");
  }
}

/**
 * Fix orphaned topup requests by removing invalid references
 */
export async function fixOrphanedTopupRequests(dryRun: boolean = true): Promise<{
  fixedCount: number;
  errors: string[];
}> {
  try {
    const report = await checkTopupDataIntegrity();
    const orphanedRequests = report.orphanedTopupRequests;

    if (orphanedRequests.length === 0) {
      console.log("No orphaned topup requests found");
      return { fixedCount: 0, errors: [] };
    }

    console.log(`Found ${orphanedRequests.length} orphaned topup requests`);

    if (dryRun) {
      console.log("DRY RUN: Would delete the following requests:", orphanedRequests);
      return { fixedCount: 0, errors: [] };
    }

    const errors: string[] = [];
    let fixedCount = 0;

    // Delete orphaned requests one by one to handle individual failures
    for (const request of orphanedRequests) {
      try {
        await db.topupRequest.delete({
          where: { id: request.id },
        });
        console.log(`Deleted orphaned topup request: ${request.id}`);
        fixedCount++;
      } catch (error) {
        const errorMsg = `Failed to delete request ${request.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`Fixed ${fixedCount} orphaned topup requests`);
    return { fixedCount, errors };
  } catch (error) {
    console.error("Error fixing orphaned topup requests:", error);
    throw new Error("Failed to fix orphaned topup requests");
  }
}

/**
 * Verify user session data consistency
 */
export async function verifyUserSessionData(userId: string): Promise<{
  isValid: boolean;
  user: any;
  issues: string[];
}> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
        referralCode: true,
      },
    });

    const issues: string[] = [];

    if (!user) {
      issues.push("User not found in database");
      return { isValid: false, user: null, issues };
    }

    if (user.status !== "ACTIVE") {
      issues.push(`User status is ${user.status}, not ACTIVE`);
    }

    if (!user.phone && !user.email) {
      issues.push("User has no phone or email");
    }

    return {
      isValid: issues.length === 0,
      user,
      issues,
    };
  } catch (error) {
    console.error("Error verifying user session data:", error);
    return {
      isValid: false,
      user: null,
      issues: ["Database error during verification"],
    };
  }
}

/**
 * Generate a comprehensive data health report
 */
export async function generateDataHealthReport(): Promise<{
  timestamp: Date;
  integrityReport: DataIntegrityReport;
  recommendations: string[];
}> {
  const integrityReport = await checkTopupDataIntegrity();
  const recommendations: string[] = [];

  if (integrityReport.summary.orphanedCount > 0) {
    recommendations.push(
      `Clean up ${integrityReport.summary.orphanedCount} orphaned topup requests`
    );
  }

  if (integrityReport.summary.missingWalletCount > 0) {
    recommendations.push(
      `Fix ${integrityReport.summary.missingWalletCount} requests with missing wallet references`
    );
  }

  if (integrityReport.summary.duplicateTransactionCount > 0) {
    recommendations.push(
      `Resolve ${integrityReport.summary.duplicateTransactionCount} duplicate transaction IDs`
    );
  }

  if (integrityReport.summary.dataIntegrityScore < 95) {
    recommendations.push(
      "Data integrity score is below 95% - consider running maintenance procedures"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("No issues found - data integrity is good");
  }

  return {
    timestamp: new Date(),
    integrityReport,
    recommendations,
  };
}
